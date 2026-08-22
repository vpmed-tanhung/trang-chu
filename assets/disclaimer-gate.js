/* =============================================================
   VPMED — Cổng xác nhận Tuyên bố trách nhiệm y khoa.

   Chặn tương tác với trang cho tới khi người dùng tick xác nhận có chuyên
   môn y tế phù hợp. Sau khi xác nhận:
   - Luôn nhớ trong PHIÊN hiện tại (sessionStorage) — load lại trang / mở
     view khác trong cùng tab sẽ KHÔNG hỏi lại.
   - Nếu tick thêm "Không hỏi lại trên thiết bị này" thì nhớ VĨNH VIỄN qua
     localStorage, mọi phiên sau trên máy đó sẽ không hỏi lại.
   - Có thể chủ động mở lại để xem (không chặn tương tác) qua nút "Xem lại
     Tuyên bố trách nhiệm" trên thanh nhắc gọn ở trang chủ.
   ============================================================= */
(function () {
  'use strict';

  var LS_KEY = 'vpmed_disclaimer_ack_v1';
  var SS_KEY = 'vpmed_disclaimer_ack_session_v1';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  var gate, backdrop, closeBtn, checksWrap, proCheck, rememberCheck, continueBtn;
  var blocking = true;

  function alreadyAcked() {
    return lsGet(LS_KEY) === '1' || ssGet(SS_KEY) === '1';
  }

  function lockScroll(lock) {
    document.body.classList.toggle('disclaimer-gate-open', lock);
  }

  function showGate() {
    if (!gate) return;
    gate.hidden = false;
    lockScroll(true);
    window.setTimeout(function () { if (proCheck && !proCheck.disabled) proCheck.focus(); }, 30);
  }

  function hideGate() {
    if (!gate) return;
    gate.hidden = true;
    lockScroll(false);
  }

  function confirmAck() {
    if (!proCheck || !proCheck.checked) return;
    ssSet(SS_KEY, '1');
    if (rememberCheck && rememberCheck.checked) lsSet(LS_KEY, '1');
    hideGate();
  }

  /* Chế độ CHẶN — dùng khi vào trang lần đầu / chưa từng xác nhận.
     Không có nút đóng, không cho bấm ra ngoài để tắt. */
  function enterGateMode() {
    blocking = true;
    if (closeBtn) closeBtn.hidden = true;
    if (checksWrap) checksWrap.hidden = false;
    if (proCheck) proCheck.checked = false;
    if (rememberCheck) rememberCheck.checked = false;
    if (continueBtn) {
      continueBtn.textContent = 'Tôi hiểu và tiếp tục';
      continueBtn.disabled = true;
      continueBtn.onclick = confirmAck;
    }
    showGate();
  }

  /* Chế độ XEM LẠI — người dùng đã xác nhận trước đó, giờ chỉ muốn đọc lại
     nội dung. Cho phép đóng bằng nút X / bấm ra ngoài / phím Esc. */
  function enterReviewMode() {
    blocking = false;
    if (closeBtn) closeBtn.hidden = false;
    if (checksWrap) checksWrap.hidden = true;
    if (continueBtn) {
      continueBtn.textContent = 'Đã hiểu, đóng lại';
      continueBtn.disabled = false;
      continueBtn.onclick = hideGate;
    }
    showGate();
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    gate = document.getElementById('disclaimerGate');
    if (!gate) return;

    backdrop = gate.querySelector('.disclaimer-gate-backdrop');
    closeBtn = document.getElementById('disclaimerGateCloseBtn');
    checksWrap = gate.querySelector('.disclaimer-gate-checks');
    proCheck = document.getElementById('disclaimerGateProCheck');
    rememberCheck = document.getElementById('disclaimerGateRememberCheck');
    continueBtn = document.getElementById('disclaimerGateContinueBtn');

    if (proCheck) {
      proCheck.addEventListener('change', function () {
        if (continueBtn) continueBtn.disabled = !proCheck.checked;
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', function () { if (!blocking) hideGate(); });
    if (backdrop) backdrop.addEventListener('click', function () { if (!blocking) hideGate(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && gate && !gate.hidden && !blocking) hideGate();
    });

    var reopenBtn = document.getElementById('reopenDisclaimerBtn');
    if (reopenBtn) reopenBtn.addEventListener('click', enterReviewMode);

    if (!alreadyAcked()) enterGateMode();
  });

  /* Lối vào công khai — phòng khi cần mở modal từ nơi khác (vd sau khi đổi
     tài khoản trên máy dùng chung, có thể ép hỏi lại bằng cách tự xoá 2
     khoá lưu trữ ở trên rồi gọi hàm này). */
  window.VpmedDisclaimerGate = {
    openReview: function () { if (gate) enterReviewMode(); },
    forceGate: function () { if (gate) enterGateMode(); }
  };
}());
