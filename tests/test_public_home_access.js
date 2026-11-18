const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const access = fs.readFileSync(require.resolve('../assets/vpmed-access.js'), 'utf8');
const toolEntry = fs.readFileSync(require.resolve('../assets/vpmed-tool-entry.js'), 'utf8');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const headGate = html.match(/<script>\s*(window\.VPMED_IS_PUBLIC_ROUTE[\s\S]*?)<\/script>/)[1];
const homeSchema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const publicUrl = 'https://hotrolamsang.io.vn/';

assert.equal(homeSchema.url, publicUrl);
assert.equal(homeSchema['@type'], 'WebSite');
assert.ok(html.includes(`rel="canonical" href="${publicUrl}"`));
assert.match(html, /name="description" content="[^"]*Hỗ trợ Dược lâm sàng/);
assert.doesNotMatch(html, /class="vpmed-public-home"/);
assert.match(html, /id="cong-cu-lam-sang"[^>]*data-internal-only/);
assert.doesNotMatch(html.match(/<section[^>]+id="danh-muc-tai-lieu"[^>]*>/)[0], /data-internal-only/);
assert.match(html, /<h2 data-guest-only>Hướng dẫn sử dụng<\/h2>/);
assert.match(html, /data-open="thong-tin-thuoc" data-internal-only/);
assert.doesNotMatch(html.match(/<a[^>]+data-open="huong-dan-su-dung"[^>]*>/)[0], /data-internal-only/);
assert.doesNotMatch(html.match(/<section[^>]+id="ban-tin"[^>]*>/)[0], /data-internal-only/);
for (const id of ['gioi-thieu','chuc-nang','to-chuc','danh-muc-tai-lieu','ban-tin','lien-he']) {
  assert.ok(html.includes(`id="${id}"`));
}

async function openPage(path = '', {approved = false, cdnAvailable = true, cachedProfile = false} = {}) {
  const urls = [];
  const classes = new Set(['vpmed-auth-checking']);
  const listeners = new Map();
  const node = {addEventListener() {}};
  const location = new URL(path, publicUrl);
  location.replace = (target) => urls.push(target);
  const document = {
    documentElement: {classList: {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name)
    }},
    getElementById: () => node,
    addEventListener() {},
    querySelectorAll: () => []
  };
  const navigator = {onLine: true};
  const user = approved ? {id: 'test-user', email: 'test@vpmed.vn'} : null;
  const client = {
    auth: {
      getUser: async () => ({data: {user}}),
      onAuthStateChange: (handler) => listeners.set('auth', handler)
    },
    from: () => ({select: () => ({eq: () => ({maybeSingle: async () => ({data: {status: 'approved'}})})})}),
    rpc: async () => ({data: false})
  };
  const window = {
    addEventListener: (name, handler) => listeners.set(name, handler),
    dispatchEvent: (event) => listeners.get(event.type)?.(event),
    matchMedia: () => ({matches: false}),
    setInterval() {},
    supabase: cdnAvailable ? {createClient: () => client} : undefined
  };
  const localStorage = {
    getItem: () => cachedProfile ? JSON.stringify({status: 'approved', verifiedAt: Date.now(), email: 'test@vpmed.vn'}) : null,
    setItem() {},
    removeItem() {}
  };
  class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
    }
  }
  const context = vm.createContext({window, document, navigator, location, localStorage, URLSearchParams, CustomEvent});
  vm.runInContext(headGate, context);
  vm.runInContext(access, context);
  await new Promise((resolve) => setImmediate(resolve));
  return {classes, listeners, location, urls, window};
}

async function openStandaloneTool({host, user, profileStatus} = {}) {
  const redirects = [];
  const css = new Set(['vpmed-tool-checking']);
  const fallback = 'tai-khoan.html?next=petct-dose-tool.html';
  const root = {
    classList: {remove: (name) => css.delete(name)},
    dataset: {toolFallback: fallback, toolEntry: 'account'}
  };
  const location = {origin: new URL(publicUrl).origin, replace: (target) => redirects.push(target)};
  const auth = {getUser: async () => ({data: {user}}), onAuthStateChange() {}};
  const from = () => ({select: () => ({eq: () => ({maybeSingle: async () => ({data: {status: profileStatus}})})})});
  const window = {supabase: {createClient: () => ({auth, from})}};
  window.parent = host || window;
  vm.runInNewContext(toolEntry, {window, document: {documentElement: root}, location});
  await new Promise((resolve) => setImmediate(resolve));
  return {redirects, visible: !css.has('vpmed-tool-checking')};
}

(async () => {
  for (const path of ['', 'index.html', '#gioi-thieu', '#danh-muc-tai-lieu', '#ban-tin', '#lien-he']) {
    const visitor = await openPage(path);
    assert.equal(visitor.classes.has('vpmed-private-entry'), false);
    assert.equal(visitor.classes.has('vpmed-auth-checking'), true);
    assert.deepEqual(visitor.urls, []);
    visitor.listeners.get('auth')('SIGNED_OUT');
    assert.deepEqual(visitor.urls, []);
  }

  const deepLink = await openPage('#pediatric-dose');
  assert.equal(deepLink.classes.has('vpmed-private-entry'), true);
  assert.deepEqual(deepLink.urls, ['tai-khoan.html?next=index.html%23pediatric-dose']);
  for (const hash of ['thong-tin-thuoc','huong-dan-su-dung']) {
    const internalLibrary = await openPage('#'+hash);
    assert.deepEqual(internalLibrary.urls, ['tai-khoan.html?next=index.html%23'+hash]);
  }
  const cachedButSignedOut = await openPage('#pediatric-dose', {cachedProfile: true});
  assert.equal(cachedButSignedOut.classes.has('vpmed-auth-checking'), true);
  assert.deepEqual(cachedButSignedOut.urls, deepLink.urls);

  const installed = await openPage('index.html?vpmed_app=installed');
  assert.equal(installed.classes.has('vpmed-private-entry'), true);
  assert.deepEqual(installed.urls, ['tai-khoan.html?next=index.html%3Fvpmed_app%3Dinstalled']);

  const noCdn = await openPage('', {cdnAvailable: false});
  assert.deepEqual(noCdn.urls, []);
  noCdn.location.hash = 'to-chuc';
  noCdn.listeners.get('hashchange')();
  assert.deepEqual(noCdn.urls, []);
  noCdn.location.hash = 'dose';
  noCdn.listeners.get('hashchange')();
  assert.deepEqual(noCdn.urls, ['tai-khoan.html?next=index.html%23dose']);

  const member = await openPage('#pediatric-dose', {approved: true});
  assert.equal(member.classes.has('vpmed-auth-checking'), false);
  assert.ok(member.window.VPMED_AUTH);
  assert.deepEqual(member.urls, []);
  member.listeners.get('auth')('SIGNED_OUT');
  assert.equal(member.classes.has('vpmed-auth-checking'), true);
  assert.deepEqual(member.urls, ['tai-khoan.html?next=index.html%23pediatric-dose']);

  assert.deepEqual(await openStandaloneTool(), {redirects: ['tai-khoan.html?next=petct-dose-tool.html'], visible: false});
  const clinician = {id: 'test-user', email: 'test@vpmed.vn'};
  assert.equal((await openStandaloneTool({user: clinician, profileStatus: 'pending'})).visible, false);
  assert.equal((await openStandaloneTool({user: clinician, profileStatus: 'approved'})).visible, true);
  const host = {
    location: {origin: new URL(publicUrl).origin},
    document: {documentElement: {classList: {contains: () => false}}},
    VPMED_AUTH: {profile: {status: 'approved'}}
  };
  assert.equal((await openStandaloneTool({host})).visible, true);
  assert.equal((await openStandaloneTool({host: {...host, VPMED_AUTH: undefined}})).visible, false);
  assert.equal((await openStandaloneTool({host: {...host, location: {origin: 'https://other.example'}}})).visible, false);
  console.log('Public homepage metadata and access routing tests passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
