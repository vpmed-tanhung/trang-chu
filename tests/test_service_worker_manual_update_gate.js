'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
let networkRequests = 0;
const shellCache = {
  async match(request) {
    const url = new URL(typeof request === 'string' ? request : request.url, 'https://example.test/');
    if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
      return new Response('OLD_BUILD', {status: 200});
    }
    return undefined;
  },
  async addAll() {},
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
  addEventListener() {},
  skipWaiting() {}
};
const sandbox = {
  self: selfStub,
  caches: cachesStub,
  fetch: async () => {
    networkRequests += 1;
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
  const normal = await sandbox.networkFirstNavigation(
    new Request('https://example.test/index.html')
  );
  assert.strictEqual(await normal.text(), 'OLD_BUILD');
  assert.strictEqual(networkRequests, 0, 'Chưa bấm Cập nhật thì không được tải HTML build mới');

  const accepted = await sandbox.networkFirstNavigation(
    new Request('https://example.test/index.html?vpmed_update=2026.08.29.66')
  );
  assert.strictEqual(await accepted.text(), 'NEW_BUILD');
  assert.strictEqual(networkRequests, 1, 'Dấu do nút Cập nhật tạo ra mới được phép tải HTML build mới');

  console.log('Service worker manual update gate tests: OK');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
