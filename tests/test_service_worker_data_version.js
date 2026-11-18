'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

assert(source.includes("let currentDataVersion = '';"), 'Worker phải đọc phiên bản dữ liệu đã lưu sau mỗi lần khởi động');
assert(source.includes('await hydrateDataVersion();'), 'Mọi lần so phiên bản phải khôi phục phiên bản đã lưu trước');
assert(source.includes('DATA_VERSION_CHECK_INTERVAL_MS'), 'Kiểm tra phiên bản phải có thời gian chống gọi lặp');
assert(source.includes('dataVersionCheckPromise'), 'Các yêu cầu dữ liệu đồng thời phải dùng chung một lần kiểm tra phiên bản');
assert(source.includes('CLINICAL_INSTALLED_CACHE_PREFIX'), 'Bản cài phải có bộ nhớ dữ liệu tách khỏi tab web');
assert(source.includes('VPMED_DATA_VERSION_APPLIED'), 'Worker thông báo dữ liệu đã được áp dụng trong nền');
assert(source.indexOf("if (request.mode === 'navigate')") < source.indexOf('if (isAppShellRequest(request, url))'), 'Điều hướng trực tuyến phải ưu tiên HTML mới trước App Shell');
assert(source.includes('const cached = await cache.match(request);'), 'Cache buster của tài nguyên mới không được bị bỏ qua');

const clinicalVersion = 'sha256-test-clinical-version';
const scope = 'https://example.test/';
const storedVersionUrl = new URL('__vpmed_data_version__', scope).href;
const installedStoredVersionUrl = new URL('__vpmed_installed_data_version__', scope).href;
const installedOldVersion = 'sha256-installed-old';
const cacheValues = new Map([
  [storedVersionUrl, new Response(clinicalVersion)],
  [installedStoredVersionUrl, new Response(installedOldVersion)]
]);
const messages = [];

const cachesStub = {
  async open() {
    return {
      async match(request) {
        const key = typeof request === 'string' ? request : request.url;
        const response = cacheValues.get(key);
        return response ? response.clone() : undefined;
      },
      async put(request, response) {
        const key = typeof request === 'string' ? request : request.url;
        cacheValues.set(key, response.clone());
      }
    };
  },
  async keys() { return []; },
  async delete() { return true; }
};

const handlers = new Map();
let advisoryRequests = 0;
let offline = false;
const selfStub = {
  registration: {scope},
  location: new URL(scope),
  addEventListener(name, handler) { handlers.set(name, handler); },
  clients: {
    async claim() {},
    async matchAll() {
      return [{postMessage(message) { messages.push(message); }}];
    }
  }
};

const sandbox = {
  self: selfStub,
  caches: cachesStub,
  fetch: async (request) => {
    if (new URL(request.url).pathname === '/assets/pharmacovigilance_auto.json') {
      if (offline) throw new Error('offline');
      assert.strictEqual(request.cache, 'no-store');
      return new Response(String(++advisoryRequests));
    }
    return new Response(JSON.stringify({version: '2026.08.22.45', clinicalDataVersion: clinicalVersion}));
  },
  URL,
  Request,
  Response,
  Headers,
  Date,
  Promise,
  console
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

(async () => {
  const request = new Request(new URL('assets/app-version.json', scope));
  await sandbox.networkOnlyVersioned(request);
  await sandbox.networkOnlyVersioned(request);
  assert.deepStrictEqual(messages, [], 'Không được báo dữ liệu mới khi phiên bản máy chủ đã có trong bộ nhớ');

  await sandbox.networkOnlyVersioned(request, 'installed');
  const installedMessage = messages.find(message => message.type === 'VPMED_DATA_VERSION_APPLIED');
  assert.ok(installedMessage, 'Bản cài phải nhận thông báo khi nguồn máy chủ thay đổi');
  assert.strictEqual(installedMessage.previousVersion, installedOldVersion);
  const storedInstalled = cacheValues.get(installedStoredVersionUrl);
  assert.strictEqual(await storedInstalled.clone().text(), clinicalVersion);

  async function advisory(query) {
    let result;
    handlers.get('fetch')({
      request: new Request(scope + 'assets/pharmacovigilance_auto.json?' + query),
      respondWith(response) { result = response; }
    });
    return (await result).text();
  }
  assert.strictEqual(await advisory('vpmed_client=installed&v=1'), '1');
  assert.strictEqual(await advisory('vpmed_client=installed&v=2'), '2');
  offline = true;
  assert.strictEqual(await advisory('vpmed_client=installed&v=3'), '2');
  assert.strictEqual(messages.length, 1, 'Bản tin tự động không đổi phiên bản ứng dụng hoặc dữ liệu lâm sàng');

  console.log('Service worker data-version tests: OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
