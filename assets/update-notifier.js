/* VPMED - chỉ tải phiên bản mới sau khi người dùng chủ động bấm Cập nhật. */
(function () {
  'use strict';

  if (window.self !== window.top || !window.fetch) return;

  var VERSION_URL = 'assets/app-version.json';
  var SEEN_VERSION_KEY = 'vpmed_seen_app_version_v1';
  var ACCEPTED_VERSION_KEY = 'vpmed_accepted_app_build_v2';
  var ACCEPTED_DISPLAY_KEY = 'vpmed_accepted_app_display_v2';
  var RELOAD_TARGET_KEY = 'vpmed_update_reload_target_v1';
  var UPDATE_QUERY_KEY = 'vpmed_update';
  var CHECK_INTERVAL_MS = 5 * 60 * 1000;
  var checking = false;
  var announcedDataVersion = '';

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

  function getLoadedBuildVersion() {
    var meta = document.querySelector('meta[name="vpmed-build-version"]');
    return validVersion(meta && meta.getAttribute('content'));
  }

  /*
   * loadedVersion là build THỰC của HTML đang chạy. Không dùng localStorage để
   * giả định rằng trang hiện tại đã được cập nhật, vì localStorage có thể đã
   * được ghi bởi một tab/trang khác trong cùng website.
   */
  var loadedVersion = getLoadedBuildVersion();
  var legacySeenVersion = readStorage(window.localStorage, SEEN_VERSION_KEY);

  function getFooterVersion() {
    return document.getElementById('vpmedLatestVersion');
  }

  function ensureStyle() {
    if (document.getElementById('vpmedUpdateNotifierStyle')) return;
    var style = document.createElement('style');
    style.id = 'vpmedUpdateNotifierStyle';
    style.textContent = '#vpmedLatestVersion{display:inline-flex;align-items:center;margin-left:2px;color:#2f648b;font-size:11px;font-weight:850;white-space:nowrap;vertical-align:baseline;cursor:default;text-decoration:none;user-select:text}@media(max-width:420px){#vpmedLatestVersion{font-size:10.5px}}';
    document.head.appendChild(style);
  }

  function getFooterDisplayVersion() {
    var target = getFooterVersion();
    var match = String(target && target.textContent || '').match(/v([0-9A-Za-z._-]+)/);
    return validVersion(match && match[1]);
  }

  function setFooterVersion(displayVersion) {
    var target = getFooterVersion();
    displayVersion = validVersion(displayVersion);
    if (!target || !displayVersion) return false;
    ensureStyle();
    target.className = 'site-version';
    target.textContent = '· v' + displayVersion;
    target.setAttribute('title', 'Phiên bản đang dùng: v' + displayVersion);
    target.removeAttribute('role');
    target.removeAttribute('tabindex');
    target.onclick = null;
    target.onkeydown = null;
    return true;
  }

  function removeLegacyNotice() {
    var legacyNotice = document.getElementById('vpmedUpdateNotice');
    if (legacyNotice && legacyNotice.parentNode) legacyNotice.parentNode.removeChild(legacyNotice);
  }

  function cleanUpdateQuery() {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has(UPDATE_QUERY_KEY)) return;
      url.searchParams.delete(UPDATE_QUERY_KEY);
      window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash);
    } catch (error) {}
  }

  function showSuccess(version, displayVersion) {
    setFooterVersion(displayVersion);
    removeLegacyNotice();
  }

  function acceptVersion(version, displayVersion) {
    writeStorage(window.localStorage, ACCEPTED_VERSION_KEY, version);
    writeStorage(window.localStorage, ACCEPTED_DISPLAY_KEY, displayVersion);
    /* Giữ khóa cũ chỉ để tương thích; tuyệt đối không dùng nó để tự chấp nhận bản mới. */
    writeStorage(window.localStorage, SEEN_VERSION_KEY, version);
    legacySeenVersion = version;
  }

  function navigateToVersion(version) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set(UPDATE_QUERY_KEY, version);
      window.location.replace(url.toString());
    } catch (error) {
      window.location.reload();
    }
  }

  function reloadForUpdate(version) {
    /* Chỉ đánh dấu “đã thấy” sau khi trang mới tự xác nhận meta build khớp. */
    writeStorage(window.sessionStorage, RELOAD_TARGET_KEY, version);

    /* Nút “Cập nhật ngay” trên banner lớn cũng kích hoạt Service Worker đang
       chờ; toàn bộ quá trình chỉ dùng một banner và một nút hành động. */
    var serviceWorker = window.navigator && window.navigator.serviceWorker;
    if (!serviceWorker || typeof serviceWorker.getRegistration !== 'function') {
      navigateToVersion(version);
      return;
    }

    serviceWorker.getRegistration().then(function (registration) {
      if (!registration || !registration.waiting) {
        navigateToVersion(version);
        return;
      }
      var navigated = false;
      var navigateOnce = function () {
        if (navigated) return;
        navigated = true;
        navigateToVersion(version);
      };
      serviceWorker.addEventListener('controllerchange', navigateOnce, {once: true});
      registration.waiting.postMessage({type: 'SKIP_WAITING'});
      window.setTimeout(navigateOnce, 1500);
    }).catch(function () {
      navigateToVersion(version);
    });
  }

  function showUpdate(data) {
    var version = data.version;
    var displayVersion = data.displayVersion || version;

    /* Không tạo #vpmedUpdateNotice. Chỉ chuyển thông tin sang banner lớn của
       Platform Shell; phần thông báo nhỏ ở góc đã bị loại bỏ hoàn toàn. */
    removeLegacyNotice();
    if (typeof window.CustomEvent === 'function' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('vpmed:app-update-available', {detail: {
        version: version,
        displayVersion: displayVersion,
        currentDisplayVersion: data.currentDisplayVersion || '',
        note: data.note || ''
      }}));
    }
  }

  function applyVersion(data) {
    var version = validVersion(data && data.version);
    if (!version) return;
    if (loadedVersion && version !== loadedVersion && announcedDataVersion !== version) {
      announcedDataVersion = version;
      if (window.VPMED_PLATFORM) {
        window.VPMED_PLATFORM.emit('vpmed:data-version-changed', {
          previousVersion: loadedVersion,
          version: version,
          source: 'app-version-manifest'
        });
      } else if (typeof window.CustomEvent === 'function' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('vpmed:data-version-changed', {detail: {
          previousVersion: loadedVersion,
          version: version,
          source: 'app-version-manifest'
        }}));
      }
    }
    var displayVersion = validVersion(data && data.displayVersion) || version;
    var previousVersion = validVersion(data && data.previousVersion);
    var previousDisplayVersion = validVersion(data && data.previousDisplayVersion);
    var reloadTarget = readStorage(window.sessionStorage, RELOAD_TARGET_KEY);
    var acceptedVersion = validVersion(readStorage(window.localStorage, ACCEPTED_VERSION_KEY));
    var acceptedDisplayVersion = validVersion(readStorage(window.localStorage, ACCEPTED_DISPLAY_KEY));

    /*
     * Một số bản cũ từng ghi nhầm build mới vào SEEN_VERSION_KEY ngay khi mở
     * trang. Chỉ di chuyển giá trị cũ nếu nó KHÁC bản đang phát hành.
     */
    if (!acceptedVersion && legacySeenVersion && legacySeenVersion !== version) {
      acceptedVersion = legacySeenVersion;
    }
    if (!acceptedDisplayVersion && acceptedVersion && acceptedVersion === previousVersion) {
      acceptedDisplayVersion = previousDisplayVersion;
    }

    var currentDisplayVersion = acceptedDisplayVersion || previousDisplayVersion || getFooterDisplayVersion();

    /* HTML đang chạy đã đúng build máy chủ: không hiển thị lời mời cập nhật giả. */
    if (loadedVersion === version && !reloadTarget) {
      acceptVersion(version, displayVersion);
      cleanUpdateQuery();
      setFooterVersion(displayVersion);
      removeLegacyNotice();
      return;
    }

    /* Chỉ cú bấm Cập nhật mới tạo reloadTarget; lúc đó mới chấp nhận bản mới. */
    if (reloadTarget === version && (!loadedVersion || loadedVersion === version)) {
      acceptVersion(version, displayVersion);
      removeStorage(window.sessionStorage, RELOAD_TARGET_KEY);
      cleanUpdateQuery();
      showSuccess(version, displayVersion);
      return;
    }
    if (reloadTarget) removeStorage(window.sessionStorage, RELOAD_TARGET_KEY);

    /* Đã từng bấm cập nhật thành công trên thiết bị này. */
    if (acceptedVersion === version && (!loadedVersion || loadedVersion === version)) {
      cleanUpdateQuery();
      setFooterVersion(acceptedDisplayVersion || displayVersion);
      removeLegacyNotice();
      return;
    }

    /* Chưa bấm: luôn giữ nhãn phiên bản cũ và chỉ hiện nút Cập nhật. */
    if (currentDisplayVersion) setFooterVersion(currentDisplayVersion);
    cleanUpdateQuery();
    showUpdate({
      version: version,
      displayVersion: displayVersion,
      currentDisplayVersion: currentDisplayVersion,
      note: data.note
    });
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

  window.VPMED_UPDATE_NOTIFIER = Object.freeze({applyUpdate: reloadForUpdate});
  removeLegacyNotice();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}());
