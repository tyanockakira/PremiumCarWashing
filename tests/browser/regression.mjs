import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';

// Run against local Vite with Playwright available, or set PLAYWRIGHT_MODULE to its existing installation.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173');
assert.match(origin.origin, /^http:\/\/127\.0\.0\.1:\d+$/);
const routes = ['/', '/services', '/pricing', '/advantages', '/booking', '/contacts'];
const serviceModule = /(?:\/src\/pages\/ServicesPage\.jsx|\/assets\/ServicesPage-[\w-]+\.js)$/;
const servicesHeading = (page) => page.getByRole('main').getByRole('heading', { level: 1, name: /послуги дітейлінгу/i });
let browser;

before(async () => {
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM });
});
after(async () => browser?.close());

async function withPage(run, options = {}, intercept) {
  const context = await browser.newContext({ serviceWorkers: 'block', ...options });
  await context.route('**/*', async (route) => {
    if (intercept && await intercept(route)) return;
    const request = route.request();
    if (new URL(request.url()).origin === origin.origin && request.method() === 'GET') return route.continue();
    await route.abort('blockedbyclient');
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(4_000);
    await run(page);
  } finally {
    await context.close();
  }
}

async function open(page, path) {
  await page.goto(new URL(path, origin).href);
  await page.getByRole('main').getByRole('heading', { level: 1 }).waitFor();
}

const next = (page) => page.getByRole('button', { name: 'Продовжити' });
const date = (page) => page.getByLabel('Бажана дата (необов’язково)');
const slot = (page, time) => page.getByRole('radio', { name: new RegExp('^' + time) });

const skipLinkVisible = (skip) => skip.evaluate((link) => {
  const bounds = link.getBoundingClientRect();
  return link.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
});

async function openSchedule(page) {
  await open(page, '/booking');
  await next(page).click();
  await next(page).click();
  await date(page).waitFor();
}

test('the same slot is disabled at its Kyiv end time only for today', () => withPage(async (page) => {
  await page.clock.setFixedTime(new Date('2026-07-06T09:00:00Z'));
  await openSchedule(page);
  const morning = slot(page, '10:00');
  assert.equal(await morning.isEnabled(), true);
  await date(page).fill('2026-07-06');
  assert.equal(await morning.isDisabled(), true, 'the slot ended at 12:00 Kyiv');
  assert.equal(await slot(page, '21:00').isEnabled(), true);
  await next(page).click();
  await page.getByRole('alert').filter({ hasText: /інтервал уже минув/ }).waitFor();
  await date(page).fill('2026-07-07');
  assert.equal(await morning.isEnabled(), true);
  await date(page).fill('');
  assert.equal(await morning.isEnabled(), true);
}, { timezoneId: 'America/Los_Angeles' }));

test('a slot expires while the form is open and cannot be submitted with contact details', () => withPage(async (page) => {
  const start = new Date('2026-07-06T08:59:40Z');
  await page.clock.install({ time: start });
  await openSchedule(page);
  await date(page).fill('2026-07-06');
  const morning = slot(page, '10:00');
  assert.equal(await morning.isEnabled(), true);
  await page.clock.fastForward(20_000);
  await page.waitForFunction(() => document.querySelector('input[value="10:00-12:00"]')?.disabled);
  await date(page).fill('2026-07-07');
  await next(page).click();
  await page.getByLabel('Ваше ім’я *').fill('Тестова заявка');
  await page.getByLabel('Номер телефону *').fill('0500000754');
  await page.clock.fastForward(24 * 60 * 60 * 1_000);
  let posts = 0;
  page.on('request', (request) => { if (request.method() === 'POST') posts++; });
  await page.getByRole('button', { name: 'Надіслати заявку', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: /інтервал уже минув/ }).waitFor();
  assert.equal(posts, 0);
  await page.getByRole('button', { name: 'Назад' }).click();
  await slot(page, '15:00').check();
  await next(page).click();
  assert.equal(await page.getByLabel('Ваше ім’я *').inputValue(), 'Тестова заявка');
}));

test('normal navigation animates the page and reduced motion suppresses the transition', async () => {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await withPage(async (page) => {
      // Warm the route so the assertion measures an actual transition, independent of network latency.
      await open(page, '/services');
      const navigation = page.getByRole('navigation', { name: 'Головна навігація' });
      await navigation.getByRole('link', { name: 'Головна' }).click();
      await page.waitForURL(new URL('/', origin).href);
      await page.waitForTimeout(550);
      await page.evaluate(() => {
        window.observedPageMotion = false;
        const observe = () => {
          for (const frame of document.querySelectorAll('.page-transition-wrapper')) {
            const style = getComputedStyle(frame);
            if (style.transform !== 'none' || Number(style.opacity) < 0.999) window.observedPageMotion = true;
          }
          requestAnimationFrame(observe);
        };
        requestAnimationFrame(observe);
      });
      await navigation.getByRole('link', { name: 'Послуги' }).click();
      await page.waitForURL(new URL('/services', origin).href);
      await servicesHeading(page).waitFor();
      await page.waitForTimeout(450);
      assert.equal(await page.evaluate(() => window.observedPageMotion), reducedMotion === 'no-preference');
    }, { reducedMotion });
  }
});

test('the first Tab reveals the skip link and Enter moves focus into every route', () => withPage(async (page) => {
  for (const path of routes) {
    await open(page, path);
    const skip = page.getByRole('link', { name: 'Перейти до основного вмісту' });
    assert.equal(await skipLinkVisible(skip), false, path);
    if (path === '/contacts') {
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      for (let remaining = 12; remaining > 0 && !(await skipLinkVisible(skip)); remaining--) {
        await page.keyboard.press('Shift+Tab');
      }
    } else {
      await page.keyboard.press('Tab');
    }
    assert.equal(await skip.evaluate((link) => link === document.activeElement), true, path);
    assert.equal(await skipLinkVisible(skip), true, path);
    await page.keyboard.press('Enter');
    assert.equal(await page.getByRole('main').evaluate((main) => main === document.activeElement), true, path);
  }
}));

test('a failed lazy route can recover through the retry button', async () => {
  for (const direct of [true, false]) {
    let blockChunk = true;
    let failures = 0;
    await withPage(async (page) => {
      await page.goto(new URL(direct ? '/services' : '/', origin).href);
      if (!direct) await page.getByRole('navigation', { name: 'Головна навігація' }).getByRole('link', { name: 'Послуги' }).click();
      await page.getByRole('alert').getByRole('heading', { name: 'Сторінка оновлюється' }).waitFor();
      blockChunk = false;
      await page.getByRole('button', { name: 'Спробувати ще раз' }).click();
      await servicesHeading(page).waitFor();
      assert.ok(failures > 0);
    }, {}, async (route) => {
      const url = new URL(route.request().url());
      if (blockChunk && url.origin === origin.origin && serviceModule.test(url.pathname)) {
        failures++;
        await route.abort('failed');
        return true;
      }
    });
  }
});

test('a cold deep link shows the shell while its route chunk loads', async () => {
  const release = Promise.withResolvers();
  await withPage(async (page) => {
    try {
      await Promise.all([
        page.waitForRequest((request) => serviceModule.test(new URL(request.url()).pathname)),
        page.goto(new URL('/services', origin).href, { waitUntil: 'domcontentloaded' }),
      ]);
      await page.getByRole('navigation', { name: 'Головна навігація' }).waitFor();
      assert.equal(await page.getByRole('main').innerText(), '');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      assert.ok(await page.getByRole('main').evaluate((main) => main === document.activeElement));
    } finally {
      release.resolve();
    }
    await servicesHeading(page).waitFor();
  }, {}, async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin.origin && serviceModule.test(url.pathname)) {
      await release.promise;
      await route.continue();
      return true;
    }
  });
});
