/* VPMED - loading chậm vừa phải; không can thiệp giao diện hoặc dữ liệu ứng dụng. */
(function () {
  'use strict';

  var root = document.documentElement;
  var loader = document.getElementById('systemLoader');
  var bar = document.getElementById('systemLoaderBar');
  var status = document.getElementById('systemLoaderStatus');
  var percent = document.getElementById('systemLoaderPercent');

  if (!loader) {
    root.classList.remove('system-loading');
    return;
  }

  var startedAt = Date.now();
  var minimumVisibleMs = 1800;
  var closed = false;
  var closing = false;
  var current = 7;
  var timer = null;

  function setProgress(value, label) {
    current = Math.max(current, Math.min(100, Math.round(value)));
    if (bar) bar.style.width = current + '%';
    if (percent) percent.textContent = current + '%';
    if (status && label) status.textContent = label;
  }

  function finishLoading() {
    if (closed || closing) return;
    closing = true;

    var wait = Math.max(0, minimumVisibleMs - (Date.now() - startedAt));
    window.setTimeout(function () {
      if (timer) window.clearInterval(timer);
      setProgress(100, 'Hệ thống đã sẵn sàng');

      window.setTimeout(function () {
        closed = true;
        loader.classList.add('is-hidden');
        root.classList.remove('system-loading');

        window.setTimeout(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 480);
      }, 350);
    }, wait);
  }

  var steps = [
    { value: 23, label: 'Đang khởi tạo giao diện…' },
    { value: 46, label: 'Đang tải công cụ lâm sàng…' },
    { value: 68, label: 'Đang chuẩn bị dữ liệu tra cứu…' },
    { value: 86, label: 'Đang hoàn tất hệ thống…' }
  ];
  var index = 0;

  timer = window.setInterval(function () {
    if (index < steps.length) {
      setProgress(steps[index].value, steps[index].label);
      index += 1;
    } else if (current < 93) {
      setProgress(current + 1, 'Đang hoàn tất hệ thống…');
    }
  }, 380);

  if (document.readyState === 'complete') {
    finishLoading();
  } else {
    window.addEventListener('load', finishLoading, { once: true });
  }

  window.setTimeout(finishLoading, 6000);
}());
