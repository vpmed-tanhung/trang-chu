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
assert(source.indexOf("if (request.mode === 'navigate')") < source.indexOf('if (isAppShellRequest(request, url))'), 'Điều hướng trực tuyến phải ưu tiên HTML mới trước App Shell');
assert(source.includes('const cached = await cache.match(request);'), 'Cache buster của tài nguyên mới không được bị bỏ qua');

const clinicalVersion = 'sha256-test-clinical-version';
const scope = 'https://example.test/';
const storedVersionUrl = new URL('__vpmed_data_version__', scope).href;
const cacheValues = new Map([[storedVersionUrl, new Response(clinicalVersion)]]);
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

const selfStub = {
  registration: {scope},
  addEventListener() {},
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
  fetch: async () => new Response(JSON.stringify({
    version: '2026.08.22.41',
    clinicalDataVersion: clinicalVersion
  }), {status: 200, headers: {'Content-Type': 'application/json'}}),
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
  console.log('Service worker data-version tests: OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
