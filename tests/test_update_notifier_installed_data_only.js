'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.id = '';
    this.className = '';
    this.textContent = '';
  }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(item => item !== child); child.parentNode = null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || ''; }
  removeAttribute(name) { delete this.attributes[name]; }
}

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const footer = new Element('span');
footer.id = 'vpmedLatestVersion';
footer.textContent = '· v5.4.5';
const head = new Element('head');
const body = new Element('body');
const documentStub = {
  readyState: 'complete',
  visibilityState: 'visible',
  head,
  body,
  createElement(tagName) { return new Element(tagName); },
  getElementById(id) {
    if (id === footer.id) return footer;
    const all = [...head.children, ...body.children];
    return all.find(item => item.id === id) || null;
  },
  querySelector(selector) {
    if (selector === 'meta[name="vpmed-build-version"]') {
      return {getAttribute() { return '2026.08.22.44'; }};
    }
    return null;
  },
  addEventListener() {}
};

const localStorage = makeStorage();
const sessionStorage = makeStorage();
let clinicalDataVersion = 'sha256-source-a';
const events = [];
class CustomEventStub {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail || {}; }
}
const windowStub = {
  localStorage,
  sessionStorage,
  navigator: {},
  location: {
    href: 'https://example.test/index.html?vpmed_app=installed#home',
    replace() { throw new Error('Không được tự chuyển trang'); },
    reload() { throw new Error('Không được tự tải lại'); }
  },
  history: {replaceState() {}},
  setInterval() {},
  setTimeout(callback) { callback(); return 1; },
  addEventListener() {},
  dispatchEvent(event) { events.push(event); },
  CustomEvent: CustomEventStub
};
windowStub.self = windowStub;
windowStub.top = windowStub;

const fetchStub = async () => ({
  ok: true,
  async json() {
    return {
      version: '2026.08.22.45',
      displayVersion: '5.4.6',
      clinicalDataVersion
    };
  }
});
windowStub.fetch = fetchStub;

const code = fs.readFileSync(path.join(__dirname, '..', 'assets', 'update-notifier.js'), 'utf8');

async function runNotifier() {
  const sandbox = {window: windowStub, document: documentStub, fetch: fetchStub, URL, CustomEvent: CustomEventStub, Date, console};
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
}

(async () => {
  await runNotifier();
  assert.strictEqual(localStorage.getItem('vpmed_installed_clinical_data_version_v1'), 'sha256-source-a');
  assert.strictEqual(events.some(event => event.type === 'vpmed:app-update-available'), false,
    'Đổi build nhưng nguồn dữ liệu giữ nguyên không được báo cập nhật trong bản cài');

  clinicalDataVersion = 'sha256-source-b';
  await runNotifier();
  const update = events.find(event => event.type === 'vpmed:app-update-available');
  assert.ok(update, 'Bản cài phải báo khi phiên bản nguồn dữ liệu thay đổi');
  assert.strictEqual(update.detail.kind, 'clinical-data');
  assert.strictEqual(update.detail.dataVersion, 'sha256-source-b');
  assert.strictEqual(localStorage.getItem('vpmed_accepted_app_build_v2'), null,
    'Trạng thái build của tab web không được dùng cho bản cài');
  console.log('Installed data-only update tests: OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
