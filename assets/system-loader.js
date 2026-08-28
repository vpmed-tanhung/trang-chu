/* VPMED - Splash khởi tạo theo trạng thái thật của ứng dụng, có thời gian hiển thị tối thiểu. */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var loader = document.getElementById('systemLoader');
  var bar = document.getElementById('systemLoaderBar');
  var status = document.getElementById('systemLoaderStatus');
  var percent = document.getElementById('systemLoaderPercent');

  if (!loader) {
    root.classList.remove('system-loading');
    return;
  }

  var MIN_VISIBLE_MS = 2800;
  var FADE_MS = 460;
  var startedAt = (window.performance && typeof window.performance.now === 'function')
    ? window.performance.now()
    : Date.now();

  var state = {
    domReady: document.readyState !== 'loading',
    authReady: !root.classList.contains('vpmed-auth-checking'),
    shellReady: false,
    initialFeatureReady: false,
    windowLoaded: document.readyState === 'complete'
  };

  var initialFeature = (location.hash || '#home').slice(1) || 'home';
  var displayed = 6;
  var target = 8;
  var initComplete = false;
  var closed = false;
  var closing = false;
  var animationFrame = 0;
  var lastFrameAt = startedAt;
  var lockScrollY = window.scrollY || window.pageYOffset || 0;

  if (body) {
    body.style.position = 'fixed';
    body.style.top = (-lockScrollY) + 'px';
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
  }

  function now() {
    return (window.performance && typeof window.performance.now === 'function')
      ? window.performance.now()
      : Date.now();
  }

  function unlockScroll() {
    if (!body) return;
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    window.scrollTo(0, lockScrollY);
  }

  function statusForProgress(value) {
    if (value < 18) return 'Đang bắt đầu hệ thống…';
    if (value < 34) return 'Đang khởi tạo giao diện…';
    if (value < 52) return 'Đang xác minh phiên làm việc…';
    if (value < 70) return 'Đang nạp hệ thống hỗ trợ lâm sàng…';
    if (value < 84) return 'Đang tải tài nguyên và dữ liệu ban đầu…';
    if (value < 96) return 'Đang nạp mô-đun khởi tạo…';
    if (value < 100) return 'Đang hoàn tất kiểm tra tài nguyên…';
    return 'Hệ thống đã sẵn sàng';
  }

  function renderProgress(value) {
    var rounded = Math.max(0, Math.min(100, Math.round(value)));
    if (bar) bar.style.width = rounded + '%';
    if (percent) percent.textContent = rounded + '%';
    if (status) status.textContent = statusForProgress(rounded);
  }

  function setTarget(value) {
    if (closed) return;
    target = Math.max(target, Math.min(96, Math.round(value)));
  }

  function allInitReady() {
    return state.domReady &&
      state.authReady &&
      state.shellReady &&
      state.initialFeatureReady &&
      state.windowLoaded;
  }

  function closeLoader() {
    if (closed || closing) return;
    closing = true;
    displayed = 100;
    renderProgress(100);

    window.setTimeout(function () {
      loader.classList.add('is-hidden');
      window.setTimeout(function () {
        closed = true;
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        if (loader.parentNode) loader.parentNode.removeChild(loader);
        root.classList.remove('system-loading');
        unlockScroll();
        window.dispatchEvent(new CustomEvent('vpmed:splash-complete'));
      }, FADE_MS);
    }, 180);
  }

  function animate(timestamp) {
    if (closed) return;

    var frameNow = typeof timestamp === 'number' ? timestamp : now();
    var delta = Math.max(0, Math.min(64, frameNow - lastFrameAt));
    lastFrameAt = frameNow;

    if (initComplete && frameNow - startedAt >= MIN_VISIBLE_MS) {
      target = 100;
    }

    if (displayed < target) {
      var remaining = target - displayed;
      var speedPerMs = target >= 100 ? 0.055 : 0.036;
      var step = Math.max(0.18, delta * speedPerMs);
      displayed += Math.min(remaining, step);
      renderProgress(displayed);
    }

    if (initComplete && target === 100 && displayed >= 99.6) {
      closeLoader();
      return;
    }

    animationFrame = window.requestAnimationFrame(animate);
  }

  function finishIfReady() {
    if (closed || closing || !allInitReady()) return;
    initComplete = true;
    setTarget(96);
  }

  function markDomReady() {
    state.domReady = true;
    setTarget(20);
    finishIfReady();
  }

  function markAuthReady() {
    state.authReady = true;
    setTarget(38);
    finishIfReady();
  }

  function markShellReady() {
    state.shellReady = true;
    setTarget(60);
    finishIfReady();
  }

  function markInitialFeatureLoading() {
    setTarget(76);
  }

  function markInitialFeatureReady() {
    state.initialFeatureReady = true;
    setTarget(92);
    finishIfReady();
  }

  function markWindowLoaded() {
    state.windowLoaded = true;
    setTarget(96);
    finishIfReady();
  }

  if (!state.domReady) {
    document.addEventListener('DOMContentLoaded', markDomReady, { once: true });
  } else {
    markDomReady();
  }

  window.addEventListener('vpmed-auth-ready', markAuthReady, { once: true });
  window.addEventListener('vpmed-auth-offline', markAuthReady, { once: true });
  if (state.authReady) markAuthReady();

  window.addEventListener('vpmed:shell-ready', function (event) {
    var detail = event && event.detail ? event.detail : {};
    if (Array.isArray(detail.features) && detail.features.indexOf(initialFeature) === -1) {
      initialFeature = 'home';
      state.initialFeatureReady = true;
    }
    markShellReady();
  }, { once: true });

  window.addEventListener('vpmed:feature-open', function (event) {
    var detail = event && event.detail ? event.detail : {};
    if (detail.source !== 'initial' || detail.feature !== initialFeature) return;
    if (detail.phase === 'loading') markInitialFeatureLoading();
    if (detail.phase === 'opened' || detail.phase === 'error') markInitialFeatureReady();
  });

  if (!state.windowLoaded) {
    window.addEventListener('load', markWindowLoaded, { once: true });
  } else {
    markWindowLoaded();
  }

  renderProgress(displayed);
  setTarget(8);
  animationFrame = window.requestAnimationFrame(animate);
}());
