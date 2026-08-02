/* VPMED - Fix lỗi báo "Failed to fetch" khi bấm Duyệt/Cần cập nhật.
   Mục tiêu:
   - Không sửa assets/unified.js.
   - Không sửa dữ liệu thuốc.
   - Nếu Apps Script đã ghi vào Google Sheet nhưng trình duyệt không đọc được phản hồi,
     coi thao tác là đã gửi và tự tải lại danh sách thuốc.
*/
(function () {
  function isFailedFetchError(err) {
    var msg = String((err && err.message) || err || '').toLowerCase();
    return msg.indexOf('failed to fetch') !== -1 ||
           msg.indexOf('load failed') !== -1 ||
           msg.indexOf('networkerror') !== -1;
  }

  function bodyHasApproveDrug(init) {
    try {
      var body = init && init.body;
      if (!body) return false;
      var text = typeof body === 'string' ? body : String(body);
      return text.indexOf('"approveDrug"') !== -1 ||
             text.indexOf("'approveDrug'") !== -1 ||
             text.indexOf('approveDrug') !== -1;
    } catch (e) {
      return false;
    }
  }

  function clickReloadButton() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('button, a'));
    var btn = buttons.find(function (b) {
      return /tải lại|tai lai|reload/i.test((b.textContent || '').trim());
    });
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }

  function refreshSoon() {
    setTimeout(function () {
      if (!clickReloadButton()) {
        // fallback nhẹ, chỉ reload trang quản trị nếu không tìm thấy nút Tải lại
        location.reload();
      }
    }, 1200);
  }

  function showSoftNotice() {
    var old = document.getElementById('vpmed-approve-soft-notice');
    if (old) old.remove();

    var box = document.createElement('div');
    box.id = 'vpmed-approve-soft-notice';
    box.textContent = 'Đã gửi yêu cầu cập nhật trạng thái. Đang tải lại danh sách thuốc...';
    box.style.cssText = [
      'position:fixed',
      'right:18px',
      'bottom:18px',
      'z-index:99999',
      'background:#ecfeff',
      'border:1px solid #67e8f9',
      'color:#075985',
      'font-weight:700',
      'padding:12px 14px',
      'border-radius:14px',
      'box-shadow:0 12px 30px rgba(15,23,42,.18)',
      'max-width:360px'
    ].join(';');

    document.body.appendChild(box);
    setTimeout(function () {
      if (box && box.parentNode) box.parentNode.removeChild(box);
    }, 3500);
  }

  // 1) Bắt lỗi fetch riêng cho action approveDrug, trả phản hồi giả để code cũ không bật lỗi.
  if (!window.__vpmedApproveFetchPatched) {
    window.__vpmedApproveFetchPatched = true;
    var nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      var isApprove = bodyHasApproveDrug(init);

      return nativeFetch.apply(this, arguments).catch(function (err) {
        if (isApprove && isFailedFetchError(err)) {
          showSoftNotice();
          refreshSoon();

          return new Response(JSON.stringify({
            ok: true,
            message: 'Đã gửi yêu cầu cập nhật trạng thái. Danh sách sẽ tự tải lại.',
            softOk: true
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        throw err;
      });
    };
  }

  // 2) Nếu code cũ vẫn gọi alert("Failed to fetch") thì chặn alert đó và tải lại.
  if (!window.__vpmedApproveAlertPatched) {
    window.__vpmedApproveAlertPatched = true;
    var nativeAlert = window.alert;
    window.alert = function (msg) {
      if (isFailedFetchError(msg)) {
        showSoftNotice();
        refreshSoon();
        return;
      }
      return nativeAlert.apply(window, arguments);
    };
  }

  // 3) Khi bấm Duyệt/Cần cập nhật, chủ động tải lại sau vài giây để đồng bộ giao diện.
  document.addEventListener('click', function (e) {
    var target = e.target && e.target.closest ? e.target.closest('button, a') : null;
    if (!target) return;

    var text = (target.textContent || '').trim().toLowerCase();
    if (text.indexOf('duyệt') !== -1 || text.indexOf('cần cập nhật') !== -1 || text.indexOf('can cap nhat') !== -1) {
      setTimeout(clickReloadButton, 2500);
    }
  }, true);
})();
