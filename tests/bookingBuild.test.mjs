import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const serverOnly = /sb_secret_[A-Za-z0-9_-]{20,}|PW752_SERVER_ONLY_FIXTURE|postgres(?:ql)?:\/\/[^\s@:]+:[^\s@]+@/;
const legacyRpc = /\bsubmit_(?:booking\b|consultation\b)/;

async function* textFiles(directory, ext) {
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (entry.isFile() && ext.test(entry.name)) yield readFile(entry.parentPath + '/' + entry.name, 'utf8');
  }
}

test('old RPCs are absent from client sources and the compiled assets', async () => {
  for await (const source of textFiles(new URL('src/', root), /\.(?:js|jsx)$/)) {
    assert.ok(!legacyRpc.test(source), 'Legacy booking RPC found in client sources');
  }
  for await (const asset of textFiles(new URL('dist/', root), /\.(?:js|html|map)$/)) {
    assert.ok(!legacyRpc.test(asset), 'Legacy booking RPC found in client assets');
  }
});

test('the live client build contains the HTTP route and no server credentials', async () => {
  let hasEndpoint = false;
  for await (const asset of textFiles(new URL('dist/', root), /\.(?:js|html|map)$/)) {
    hasEndpoint ||= asset.includes('/functions/v1/submit-booking-request');
    assert.ok(!serverOnly.test(asset), 'Server-only credential or build fixture detected');
    for (const match of asset.matchAll(/eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
      let role;
      try { role = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')).role; } catch { continue; }
      assert.notEqual(role, 'service_role', 'Privileged Supabase JWT detected');
    }
  }
  assert.ok(hasEndpoint, 'Expected compiled live booking transport');
});
