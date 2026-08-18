/* VPMED - thông báo phiên bản mới, không can thiệp phiên đăng nhập. */
(function () {
  'use strict';

  if (window.self !== window.top || !window.fetch) return;

  var VERSION_URL = 'assets/app-version.json';
  var SEEN_VERSION_KEY = 'vpmed_seen_app_version_v1';
  var RELOAD_TARGET_KEY = 'vpmed_update_reload_target_v1';
  var UPDATE_QUERY_KEY = 'vpmed_update';
  var CHECK_INTERVAL_MS = 5 * 60 * 1000;
  var activeVersion = readStorage(window.localStorage, SEEN_VERSION_KEY);
  var notice = null;
  var checking = false;
  var successTimer = null;

  function readStorage(storage, key) {
    try { return storage.getItem(key) || ''; } catch (error) { return ''; }
  }

  function writeStorage(storage, key, value) {
    try { storage.setItem(key, value); } catch (error) {}
  }

  function removeStorage(storage, key) {
    try { storage.removeItem(key); } catch (error) {}
  }

  function validVersion(value) {
    var version = String(value || '').trim();
    return /^[0-9A-Za-z._-]{1,40}$/.test(version) ? version : '';
  }

  function getFooterVersion() {
    return document.getElementById('vpmedLatestVersion');
  }

  function ensureStyle() {
    if (document.getElementById('vpmedUpdateNotifierStyle')) return;
    var style = document.createElement('style');
    style.id = 'vpmedUpdateNotifierStyle';
    style.textContent = [
      '#vpmedLatestVersion{display:inline-flex;align-items:center;gap:4px;margin-left:2px;color:#2f648b;font-size:11px;font-weight:850;white-space:nowrap;vertical-align:baseline}',
      '#vpmedLatestVersion.vpmed-version-update{color:#b45309;font-weight:900;cursor:pointer;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px}',
      '#vpmedLatestVersion.vpmed-version-update:hover{color:#8a3f07}',
      '#vpmedLatestVersion.vpmed-version-update:focus-visible{outline:2px solid rgba(8,116,183,.28);outline-offset:3px;border-radius:3px}',
      '#vpmedUpdateNotice{position:fixed;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:999999;max-width:calc(100vw - 24px);display:flex;align-items:center;gap:7px;padding:7px 8px;border:1px solid #e7bd69;border-radius:999px;background:rgba(255,250,240,.97);color:#374151;box-shadow:0 8px 24px rgba(25,55,78,.16);font-family:inherit;line-height:1.2;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
      '#vpmedUpdateNotice.vpmed-update-success{border-color:#8ad9ad;background:rgba(241,255,247,.97)}',
      '#vpmedUpdateNotice .vpmed-update-icon{flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;border-radius:50%;background:#fff0c9;color:#9a5a00;font-size:14px;font-weight:900}',
      '#vpmedUpdateNotice.vpmed-update-success .vpmed-update-icon{background:#dff8e9;color:#087a42}',
      '#vpmedUpdateNotice .vpmed-update-content{min-width:0;display:flex;align-items:center;gap:6px;flex-wrap:nowrap}',
      '#vpmedUpdateNotice strong{display:block;margin:0;color:#754300;font-size:12px;font-weight:900;white-space:nowrap}',
      '#vpmedUpdateNotice.vpmed-update-success strong{color:#08673b}',
      '#vpmedUpdateNotice p{margin:0;color:#5d6772;font-size:11px;white-space:nowrap}',
      '#vpmedUpdateNotice .vpmed-update-version{font-weight:800;color:#3e5668}',
      '#vpmedUpdateNotice button{margin:0;min-height:28px;padding:5px 9px;border:0;border-radius:999px;background:#0874b7;color:#fff;font:inherit;font-size:11px;font-weight:900;line-height:1;cursor:pointer;box-shadow:none;white-space:nowrap}',
      '#vpmedUpdateNotice button:hover{background:#06649f}',
      '#vpmedUpdateNotice button:focus-visible{outline:3px solid rgba(8,116,183,.25);outline-offset:2px}',
      '@media(max-width:420px){#vpmedLatestVersion{font-size:10.5px}#vpmedUpdateNotice{right:8px;bottom:max(8px,env(safe-area-inset-bottom));max-width:calc(100vw - 16px);gap:5px;padding:6px 7px}#vpmedUpdateNotice .vpmed-update-icon{width:22px;height:22px;font-size:13px}#vpmedUpdateNotice strong{font-size:11.5px}#vpmedUpdateNotice p{font-size:10.5px}#vpmedUpdateNotice button{min-height:26px;padding:4px 8px;font-size:10.5px}}',
      '@media(prefers-reduced-motion:no-preference){#vpmedUpdateNotice{animation:vpmedUpdateIn .2s ease-out}@keyframes vpmedUpdateIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}}'
    ].join('');
    document.head.appendChild(style);
  }

  function setFooterLatest(displayVersion) {
    var target = getFooterVersion();
    if (!target) return false;
    ensureStyle();
    target.className = 'site-version';
    target.textContent = '· v' + displayVersion;
    target.setAttribute('title', 'Phiên bản mới nhất: v' + displayVersion);
    target.removeAttribute('role');
    target.removeAttribute('tabindex');
    target.onclick = null;
    target.onkeydown = null;
    return true;
  }

  function setFooterUpdate(version, displayVersion) {
    var target = getFooterVersion();
    if (!target) return false;
    ensureStyle();
    target.className = 'site-version vpmed-version-update';
    target.textContent = '· Bản mới v' + displayVersion;
    target.setAttribute('title', 'Bấm để cập nhật lên v' + displayVersion);
    target.setAttribute('role', 'button');
    target.setAttribute('tabindex', '0');
    target.onclick = function () { reloadForUpdate(version); };
    target.onkeydown = function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        reloadForUpdate(version);
      }
    };
    return true;
  }

  function getNotice() {
    if (notice && document.body.contains(notice)) return notice;
    ensureStyle();
    notice = document.createElement('aside');
    notice.id = 'vpmedUpdateNotice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');

    var icon = document.createElement('span');
    icon.className = 'vpmed-update-icon';
    icon.setAttribute('aria-hidden', 'true');

    var content = document.createElement('div');
    content.className = 'vpmed-update-content';
    var title = document.createElement('strong');
    var message = document.createElement('p');
    var button = document.createElement('button');
    button.type = 'button';
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(button);
    notice.appendChild(icon);
    notice.appendChild(content);
    document.body.appendChild(notice);
    return notice;
  }

  function cleanUpdateQuery() {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has(UPDATE_QUERY_KEY)) return;
      url.searchParams.delete(UPDATE_QUERY_KEY);
      window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash);
    } catch (error) {}
  }

  function showSuccess(displayVersion) {
    if (setFooterLatest(displayVersion)) return;
    var box = getNotice();
    box.className = 'vpmed-update-success';
    box.querySelector('.vpmed-update-icon').textContent = '✓';
    box.querySelector('strong').textContent = 'Đã cập nhật';
    box.querySelector('p').textContent = 'v' + displayVersion;
    box.querySelector('button').hidden = true;
    window.clearTimeout(successTimer);
    successTimer = window.setTimeout(function () {
      if (box.parentNode) box.parentNode.removeChild(box);
      notice = null;
    }, 5000);
  }

  function reloadForUpdate(version) {
    writeStorage(window.localStorage, SEEN_VERSION_KEY, version);
    writeStorage(window.sessionStorage, RELOAD_TARGET_KEY, version);
    activeVersion = version;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set(UPDATE_QUERY_KEY, version);
      window.location.replace(url.toString());
    } catch (error) {
      window.location.reload();
    }
  }

  function showUpdate(data) {
    var version = data.version;
    var displayVersion = data.displayVersion || version;
    if (setFooterUpdate(version, displayVersion)) return;

    var box = getNotice();
    box.className = '';
    box.querySelector('.vpmed-update-icon').textContent = '↻';
    box.querySelector('strong').textContent = 'Bản mới';
    box.querySelector('p').textContent = 'v' + displayVersion;
    box.querySelector('p').className = 'vpmed-update-version';
    var button = box.querySelector('button');
    button.hidden = false;
    button.textContent = 'Cập nhật';
    button.onclick = function () { reloadForUpdate(version); };
  }

  function applyVersion(data) {
    var version = validVersion(data && data.version);
    if (!version) return;
    var displayVersion = validVersion(data && data.displayVersion) || version;

    var reloadTarget = readStorage(window.sessionStorage, RELOAD_TARGET_KEY);
    if (reloadTarget && reloadTarget === version) {
      removeStorage(window.sessionStorage, RELOAD_TARGET_KEY);
      writeStorage(window.localStorage, SEEN_VERSION_KEY, version);
      activeVersion = version;
      cleanUpdateQuery();
      showSuccess(displayVersion);
      return;
    }

    if (!activeVersion) {
      activeVersion = version;
      writeStorage(window.localStorage, SEEN_VERSION_KEY, version);
      cleanUpdateQuery();
      setFooterLatest(displayVersion);
      return;
    }

    if (activeVersion !== version) {
      showUpdate({ version: version, displayVersion: displayVersion, note: data.note });
      return;
    }

    cleanUpdateQuery();
    setFooterLatest(displayVersion);
  }

  function checkVersion() {
    if (checking) return;
    checking = true;
    var separator = VERSION_URL.indexOf('?') === -1 ? '?' : '&';
    fetch(VERSION_URL + separator + '_=' + Date.now(), { cache: 'no-store', credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Không đọc được phiên bản');
        return response.json();
      })
      .then(applyVersion)
      .catch(function () {})
      .finally(function () { checking = false; });
  }

  function start() {
    checkVersion();
    window.setInterval(checkVersion, CHECK_INTERVAL_MS);
    window.addEventListener('online', checkVersion);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') checkVersion();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
