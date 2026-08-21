const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.parentNode = null;
    this.className = '';
    this.id = '';
    this.textContent = '';
    this.onclick = null;
    this.onkeydown = null;
  }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) { this.children = this.children.filter(item => item !== child); child.parentNode = null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] || ''; }
  removeAttribute(name) { delete this.attributes[name]; }
  querySelector(selector) {
    if (!selector.startsWith('.')) return null;
    const cls = selector.slice(1);
    const queue = [...this.children];
    while (queue.length) {
      const item = queue.shift();
      if (String(item.className || '').split(/\s+/).includes(cls)) return item;
      queue.push(...item.children);
    }
    return null;
  }
}

const oldBuild = '2026.08.21.32';
const newBuild = '2026.08.21.33';
const footer = new Element('span');
footer.id = 'vpmedLatestVersion';
footer.textContent = '· v5.0';
const head = new Element('head');
const body = new Element('body');
body.contains = element => {
  const queue = [...body.children];
  while (queue.length) {
    const item = queue.shift();
    if (item === element) return true;
    queue.push(...item.children);
  }
  return false;
};

function findById(root, id) {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findById(child, id);
    if (found) return found;
  }
  return null;
}

const documentStub = {
  readyState: 'complete',
  visibilityState: 'visible',
  head,
  body,
  createElement(tagName) { return new Element(tagName); },
  getElementById(id) { return id === footer.id ? footer : findById(head, id) || findById(body, id); },
  querySelector(selector) {
    if (selector === 'meta[name="vpmed-build-version"]') {
      return { getAttribute(name) { return name === 'content' ? oldBuild : ''; } };
    }
    return null;
  },
  addEventListener() {}
};

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

let replacedUrl = '';
const windowStub = {
  fetch: null,
  localStorage: makeStorage(),
  sessionStorage: makeStorage(),
  location: {
    href: 'https://example.test/index.html',
    replace(url) { replacedUrl = url; },
    reload() { throw new Error('Không được tự reload'); }
  },
  history: { replaceState() {} },
  setInterval() {},
  addEventListener() {},
  setTimeout() { return 1; },
  clearTimeout() {}
};
windowStub.self = windowStub;
windowStub.top = windowStub;

const fetchStub = async () => ({
  ok: true,
  async json() {
    return { version: newBuild, displayVersion: '5.1', note: 'Bản phát hành mới' };
  }
});
windowStub.fetch = fetchStub;

const sandbox = {
  window: windowStub,
  document: documentStub,
  fetch: fetchStub,
  URL,
  Date,
  console
};

const code = fs.readFileSync(path.join(__dirname, '..', 'assets', 'update-notifier.js'), 'utf8');
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

(async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.strictEqual(footer.textContent, '· v5.0', 'Chưa bấm cập nhật thì footer phải giữ phiên bản đang chạy');
  assert.strictEqual(replacedUrl, '', 'Không được tự chuyển trang khi chỉ mới phát hiện bản mới');

  const notice = documentStub.getElementById('vpmedUpdateNotice');
  assert.ok(notice, 'Phải hiện thông báo có bản mới');
  assert.strictEqual(notice.querySelector('.vpmed-update-text').textContent, 'Có bản v5.1 mới');
  assert.strictEqual(notice.querySelector('.vpmed-update-action').textContent, '· Cập nhật');

  notice.onclick();
  assert.strictEqual(windowStub.sessionStorage.getItem('vpmed_update_reload_target_v1'), newBuild);
  assert.ok(replacedUrl.includes('vpmed_update=' + newBuild), 'Chỉ cú bấm Cập nhật mới tải build mới');
  console.log('Update notifier manual-gate tests: OK');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
