'use strict';

const APP_VERSION = '2026.08.22.41';
const APP_SHELL_CACHE = `vpmed-shell-${APP_VERSION}`;
const RUNTIME_CACHE = `vpmed-runtime-${APP_VERSION}`;
const CLINICAL_CACHE_PREFIX = 'vpmed-clinical-';
const META_CACHE = 'vpmed-metadata';
const DATA_VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const VERSION_URL = new URL('assets/app-version.json', self.registration.scope).href;
const STORED_DATA_VERSION_URL = new URL('__vpmed_data_version__', self.registration.scope).href;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/style.css?v=20260822-site-policy-v1',
  './assets/disclaimer-gate.css?v=20260822-disclaimer-gate-v1',
  './assets/vpmed-access.css?v=20260814-password-change-v1',
  './assets/responsive-polish.css?v=20260712-balanced',
  './assets/platform-shell.css?v=20260822-pwa-v1',
  './assets/vpmed-access.js?v=20260817-admin-delete-v1',
  './assets/platform-shell.js?v=20260822-fast-modules-data-sync-v1',
  './assets/disclaimer-gate.js?v=20260822-disclaimer-gate-v1',
  './assets/update-notifier.js?v=20260822-pwa-v1',
  './assets/logo-vpmed.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/app-version.json'
];

const CLINICAL_PATH_PATTERN = /(?:^|\/)(?:data|sources)\/|\/assets\/(?:.*(?:data|database|profile|medicine|alert|icd10|disease|contra|renal|infusion|clinical|dosing|interaction|antibiotic|pharmacovigilance|pregnancy|hepatotoxicity|injectable|stock|source).*)\.(?:js|json|csv)$/i;
const AUTH_PATH_PATTERN = /(?:supabase|auth|token|session|login|logout)/i;
let currentDataVersion = '';
let dataVersionHydrationPromise = null;
let dataVersionCheckPromise = null;
let pendingDataVersionNotification = false;
let lastDataVersionCheckAt = 0;

const OFFLINE_PAGE = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Không có kết nối — VPMED</title></head>
<body style="font-family:system-ui,sans-serif;background:#f6f8fb;color:#15384f;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center">
<main><h1 style="font-size:22px">Không có kết nối mạng</h1>
<p>Trang này chưa được lưu trên thiết bị. Hãy kết nối mạng rồi thử lại.</p>
<a href="./index.html" style="color:#075f9f;font-weight:800">Về trang chủ ngoại tuyến</a></main></body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map((name) => {
      const isOldShell = name.startsWith('vpmed-shell-') && name !== APP_SHELL_CACHE;
      const isOldRuntime = name.startsWith('vpmed-runtime-') && name !== RUNTIME_CACHE;
      return isOldShell || isOldRuntime ? caches.delete(name) : Promise.resolve(false);
    }));
    await checkDataVersion({notify: false, force: true});
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CHECK_DATA_VERSION') event.waitUntil(checkDataVersion({notify: true, force: true}));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (AUTH_PATH_PATTERN.test(url.pathname)) return;

  if (url.href === VERSION_URL || url.pathname.endsWith('/assets/app-version.json')) {
    event.respondWith(networkOnlyVersioned(request));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (isAppShellRequest(request, url)) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }
  if (CLINICAL_PATH_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirstClinical(request));
    return;
  }
  event.respondWith(networkFirstRuntime(request));
});

function isAppShellRequest(request, url) {
  const candidates = APP_SHELL.map((item) => new URL(item, self.registration.scope));
  return candidates.some((candidate) => candidate.pathname === url.pathname) ||
    (request.mode === 'navigate' && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')));
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const fallback = await cache.match(request, {ignoreSearch: true});
    if (fallback) return fallback;
    throw error;
  }
}

async function networkOnlyVersioned(request) {
  const response = await fetch(new Request(request, {cache: 'no-store'}));
  if (response.ok) {
    const clone = response.clone();
    const payload = await clone.json().catch(() => null);
    const dataVersion = payload?.clinicalDataVersion || payload?.version;
    await hydrateDataVersion();
    lastDataVersionCheckAt = Date.now();
    if (dataVersion && String(dataVersion) !== currentDataVersion) {
      await switchClinicalVersion(String(dataVersion), true);
    }
  }
  return response;
}

async function fetchServerDataVersion() {
  const response = await fetch(`${VERSION_URL}?sw-check=${Date.now()}`, {cache: 'no-store'});
  if (!response.ok) throw new Error(`Version HTTP ${response.status}`);
  const payload = await response.json();
  const version = payload?.clinicalDataVersion || payload?.version;
  if (!version) throw new Error('Version payload is invalid');
  return String(version);
}

async function hydrateDataVersion() {
  if (currentDataVersion) return currentDataVersion;
  if (!dataVersionHydrationPromise) {
    dataVersionHydrationPromise = readStoredDataVersion()
      .then((storedVersion) => {
        currentDataVersion = storedVersion || APP_VERSION;
        return currentDataVersion;
      })
      .catch(() => {
        currentDataVersion = APP_VERSION;
        return currentDataVersion;
      });
  }
  return dataVersionHydrationPromise;
}

async function checkDataVersion({notify = true, force = false} = {}) {
  await hydrateDataVersion();
  pendingDataVersionNotification = pendingDataVersionNotification || notify;
  if (dataVersionCheckPromise) return dataVersionCheckPromise;
  if (!force && Date.now() - lastDataVersionCheckAt < DATA_VERSION_CHECK_INTERVAL_MS) {
    pendingDataVersionNotification = false;
    return currentDataVersion;
  }

  lastDataVersionCheckAt = Date.now();
  dataVersionCheckPromise = (async () => {
    try {
      const version = await fetchServerDataVersion();
      const shouldNotify = pendingDataVersionNotification;
      if (version !== currentDataVersion) await switchClinicalVersion(version, shouldNotify);
      return version;
    } catch (error) {
      return currentDataVersion;
    } finally {
      pendingDataVersionNotification = false;
      dataVersionCheckPromise = null;
    }
  })();
  return dataVersionCheckPromise;
}

async function switchClinicalVersion(version, notify) {
  const previousVersion = currentDataVersion;
  currentDataVersion = version;
  await storeDataVersion(currentDataVersion);
  const keep = `${CLINICAL_CACHE_PREFIX}${currentDataVersion}`;
  const names = await caches.keys();
  await Promise.all(names.map((name) => name.startsWith(CLINICAL_CACHE_PREFIX) && name !== keep ? caches.delete(name) : Promise.resolve(false)));
  if (notify) await notifyClients({type: 'VPMED_DATA_VERSION_CHANGED', previousVersion, version: currentDataVersion});
}

async function readStoredDataVersion() {
  const cache = await caches.open(META_CACHE);
  const response = await cache.match(STORED_DATA_VERSION_URL);
  return response ? String(await response.text()).trim() : '';
}

async function storeDataVersion(version) {
  const cache = await caches.open(META_CACHE);
  await cache.put(STORED_DATA_VERSION_URL, new Response(version, {
    headers: {'Content-Type': 'text/plain;charset=utf-8'}
  }));
}

async function networkFirstClinical(request) {
  await checkDataVersion({notify: true});
  const cacheName = `${CLINICAL_CACHE_PREFIX}${currentDataVersion}`;
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(new Request(request, {cache: 'no-store'}));
    if (!response.ok) throw new Error(`Clinical HTTP ${response.status}`);
    const stored = withCacheMetadata(response.clone(), currentDataVersion);
    await cache.put(request, stored);
    return response;
  } catch (error) {
    const cached = await cache.match(request, {ignoreSearch: true});
    if (!cached) throw error;
    await notifyClients({
      type: 'VPMED_OFFLINE_DATA_FALLBACK',
      url: request.url,
      version: cached.headers.get('X-VPMED-Data-Version') || currentDataVersion,
      cachedAt: cached.headers.get('X-VPMED-Cached-At') || ''
    });
    return cached;
  }
}

function withCacheMetadata(response, version) {
  const headers = new Headers(response.headers);
  headers.set('X-VPMED-Data-Version', version);
  headers.set('X-VPMED-Cached-At', new Date().toISOString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function networkFirstNavigation(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await runtime.put(request, response.clone());
    return response;
  } catch (error) {
    const exact = await runtime.match(request, {ignoreSearch: true});
    if (exact) return exact;
    const url = new URL(request.url);
    const scopePath = new URL('./', self.registration.scope).pathname;
    const isHome = url.pathname === scopePath || url.pathname === `${scopePath}index.html`;
    if (isHome) {
      const shell = await caches.open(APP_SHELL_CACHE);
      const index = await shell.match('./index.html', {ignoreSearch: true});
      if (index) return index;
    }
    return new Response(OFFLINE_PAGE, {
      status: 503,
      headers: {'Content-Type': 'text/html; charset=utf-8'}
    });
  }
}

async function networkFirstRuntime(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, {ignoreSearch: true});
    if (cached) return cached;
    throw error;
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
  clients.forEach((client) => client.postMessage(message));
}
