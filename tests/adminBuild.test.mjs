import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const files = [
  'src/pages/AdminLoginPage.jsx',
  'src/pages/AdminPage.jsx',
  'src/lib/adminAuth.js',
  'src/App.jsx',
];

test('admin UI uses Supabase Auth without public registration or privileged credentials', async () => {
  const source = await Promise.all(files.map((file) => readFile(new URL('../' + file, import.meta.url), 'utf8')));
  const combined = source.join('\n');
  assert.match(combined, /signInWithPassword/);
  assert.match(combined, /signOut/);
  assert.match(combined, /admin_list_bookings/);
  assert.match(combined, /admin_update_booking_status/);
  assert.doesNotMatch(combined, /signUp|service_role|SUPABASE_SERVICE_ROLE_KEY/);
});
