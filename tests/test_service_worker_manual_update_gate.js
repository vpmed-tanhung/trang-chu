'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const networkRequests = [];
const workerEvents = new Map();
let offline = false;
let skippedWaiting = 0;
let precachedRequests = [];
let hasOldPdfScript = false;
const shellCache = {
  async match(request) {
    const url = new URL(typeof request === 'string' ? request : request.url, 'https://example.test/');
    if (hasOldPdfScript && url.searchParams.get('v') === '20261118-public-guides') {
      return new Response('WINDOW_OPEN_PDF');
    }
    if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
      return new Response('OLD_BUILD', {status: 200});
    }
    return undefined;
  },
  async addAll(requests) { precachedRequests = requests; },
  async put() {}
};
const runtimeCache = {
  async match() { return undefined; },
  async put() {}
};
const metadataCache = {
  async match() { return undefined; },
  async put() {}
};
const cachesStub = {
  async open(name) {
    if (String(name).startsWith('vpmed-shell-')) return shellCache;
    if (String(name).startsWith('vpmed-runtime-')) return runtimeCache;
    return metadataCache;
  },
  async keys() { return []; },
  async delete() { return true; }
};
const selfStub = {
  registration: {scope: 'https://example.test/'},
  clients: {async matchAll() { return []; }, async claim() {}},
  addEventListener(type, callback) { workerEvents.set(type, callback); },
  async skipWaiting() { skippedWaiting += 1; }
};
const sandbox = {
  self: selfStub,
  caches: cachesStub,
  fetch: async (request) => {
    networkRequests.push(request);
    if (offline) throw new Error('Offline');
    return new Response('NEW_BUILD', {status: 200});
  },
  URL,
  Request,
  Response,
  Headers,
  Date,
  Map,
  Promise,
  console,
  setTimeout
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), sandbox);

(async () => {
  let installation;
  workerEvents.get('install')({waitUntil(promise) { installation = promise; }});
  await installation;
  assert.ok(precachedRequests.length);
  assert.ok(precachedRequests.every(request => request.cache === 'reload'));
  const recoveryBuild = vm.runInContext('APP_VERSION === NAVIGATION_CACHE_RECOVERY_BUILD', sandbox);
  assert.strictEqual(skippedWaiting, recoveryBuild ? 1 : 0, 'Chỉ bản sửa cache tự thay worker đang chạy');
  hasOldPdfScript = true;
  skippedWaiting = 0;
  workerEvents.get('install')({waitUntil(promise) { installation = promise; }});
  await installation;
  assert.strictEqual(skippedWaiting, 1, 'Tự thay worker khi cache còn mã xem PDF cũ');

  const normal = await sandbox.networkFirstNavigation(
    new Request('https://example.test/index.html')
  );
  assert.strictEqual(await normal.text(), 'NEW_BUILD');
  assert.strictEqual(networkRequests[0].cache, 'no-cache');

  const installed = await sandbox.networkFirstNavigation(
    new Request('https://example.test/index.html?vpmed_app=installed')
  );
  assert.strictEqual(await installed.text(), 'OLD_BUILD');
  assert.strictEqual(networkRequests.length, 1, 'Ứng dụng cài đặt tiếp tục dùng HTML đã lưu');

  const accepted = await sandbox.networkFirstNavigation(
    new Request('https://example.test/index.html?vpmed_app=installed&vpmed_update=2026.11.18.82')
  );
  assert.strictEqual(await accepted.text(), 'NEW_BUILD');
  assert.strictEqual(networkRequests[1].cache, 'reload');

  offline = true;
  const cached = await sandbox.networkFirstNavigation(new Request('https://example.test/'));
  assert.strictEqual(await cached.text(), 'OLD_BUILD', 'Khi mất mạng, lấy HTML đã lưu');

  console.log('Service worker manual update gate tests: OK');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
