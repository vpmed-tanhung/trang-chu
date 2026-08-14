/* VPMED - evaluation-embed.js
   Sửa lỗi: các nút có nội dung chứa từ "đánh giá" bị hiểu nhầm là nút mở phiếu đánh giá.
   Chỉ mở modal khi phần tử có dấu hiệu định danh rõ ràng của chức năng Đánh giá.
*/
(function () {
  'use strict';

  if (window.__VPMED_EVALUATION_EMBED_FINAL__) return;
  window.__VPMED_EVALUATION_EMBED_FINAL__ = true;

  const EVAL_PATH = 'phieu-danh-gia.html';
  let activeTrigger = null;
  let previousBodyOverflow = '';

  function getEvalUrl() {
    const url = new URL(EVAL_PATH, window.location.href);
    url.searchParams.set('embed', '1');
    url.searchParams.set('v', String(Date.now()));
    return url.toString();
  }

  function ensureStyle() {
    if (document.getElementById('vpmed-evaluation-final-style')) return;

    const style = document.createElement('style');
    style.id = 'vpmed-evaluation-final-style';
    style.textContent = `
      .vpmed-eval-backdrop{
        position:fixed;
        inset:0;
        z-index:999999;
        background:rgba(8,29,47,.68);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:14px;
        backdrop-filter:blur(5px);
      }
      .vpmed-eval-modal{
        position:relative;
        width:min(1120px,97vw);
        height:min(940px,95vh);
        background:#ffffff;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 28px 80px rgba(15,23,42,.34);
        border:1px solid #dbeafe;
        display:flex;
        flex-direction:column;
      }
      .vpmed-eval-head{
        flex:0 0 auto;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:13px 16px;
        border-bottom:1px solid #dbeafe;
        background:linear-gradient(90deg,#f7fbfe,#eff9f8);
        color:#075985;
      }
      .vpmed-eval-title{
        min-width:0;
      }
      .vpmed-eval-title strong{
        display:block;
        font-size:15px;
        font-weight:900;
      }
      .vpmed-eval-title span{
        display:block;
        margin-top:2px;
        color:#5b7285;
        font-size:11px;
      }
      .vpmed-eval-close{
        border:0;
        border-radius:12px;
        padding:9px 14px;
        font-weight:900;
        background:#eaf6ff;
        color:#075985;
        cursor:pointer;
      }
      .vpmed-eval-close:focus-visible{
        outline:3px solid #ffbf47;
        outline-offset:2px;
      }
      .vpmed-eval-frame{
        flex:1 1 auto;
        width:100%;
        min-height:0;
        border:0;
        background:#eef8fc;
      }
      .vpmed-eval-loading{
        position:absolute;
        inset:58px 0 0;
        z-index:2;
        display:grid;
        place-items:center;
        color:#075985;
        background:#eef8fc;
        font-size:13px;
        font-weight:800;
      }
      .vpmed-eval-loading.is-hidden{display:none}
      @media(max-width:720px){
        .vpmed-eval-backdrop{padding:0}
        .vpmed-eval-modal{width:100vw;height:100vh;border-radius:0}
      }
    `;
    document.head.appendChild(style);
  }

  function closeEvaluationModal() {
    const openModals = document.querySelectorAll(
      '.vpmed-eval-backdrop,[data-vpmed-eval-modal="1"]'
    );
    const hadOpenModal = openModals.length > 0;

    openModals.forEach((el) => el.remove());

    if (hadOpenModal) document.body.style.overflow = previousBodyOverflow;
    if (hadOpenModal && activeTrigger && typeof activeTrigger.focus === 'function') {
      activeTrigger.focus();
    }
    if (hadOpenModal) activeTrigger = null;
  }

  function openEvaluationModal(trigger) {
    ensureStyle();
    closeEvaluationModal();
    activeTrigger = trigger || document.activeElement;
    previousBodyOverflow = document.body.style.overflow;

    const backdrop = document.createElement('div');
    backdrop.className = 'vpmed-eval-backdrop';
    backdrop.setAttribute('data-vpmed-eval-modal', '1');
    backdrop.innerHTML = `
      <div class="vpmed-eval-modal" role="dialog" aria-modal="true" aria-labelledby="vpmedEvalTitle" aria-describedby="vpmedEvalDescription">
        <div class="vpmed-eval-head">
          <div class="vpmed-eval-title"><strong id="vpmedEvalTitle">Khảo sát trải nghiệm hệ thống</strong><span id="vpmedEvalDescription">Khoảng 4 phút · Không cung cấp thông tin người bệnh</span></div>
          <button type="button" class="vpmed-eval-close" aria-label="Đóng phiếu đánh giá">Đóng</button>
        </div>
        <div class="vpmed-eval-loading" aria-live="polite">Đang mở phiếu đánh giá…</div>
        <iframe class="vpmed-eval-frame" src="${getEvalUrl()}" title="Phiếu đánh giá"></iframe>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    const closeButton = backdrop.querySelector('.vpmed-eval-close');
    const frame = backdrop.querySelector('.vpmed-eval-frame');
    const loading = backdrop.querySelector('.vpmed-eval-loading');
    closeButton.addEventListener('click', closeEvaluationModal);
    frame.addEventListener('load', function () {
      loading.classList.add('is-hidden');
    });
    closeButton.focus();
  }

  function isEvaluationLinkOrButton(element) {
    if (!element) return false;

    const href = String(element.getAttribute('href') || '').toLowerCase();
    const dataView = String(element.getAttribute('data-view') || '').toLowerCase();
    const dataOpen = String(element.getAttribute('data-open') || '').toLowerCase();
    const dataEval = String(element.getAttribute('data-evaluation') || '').toLowerCase();

    const hasEvaluationClass =
      element.classList?.contains('nav-evaluation') ||
      element.classList?.contains('js-open-evaluation') ||
      element.classList?.contains('open-evaluation');

    /*
      Không kiểm tra textContent.
      Vì các mục bệnh lý có thể chứa câu như:
      "Luôn đánh giá nguy cơ nặng và đa kháng".
    */
    return Boolean(
      href.includes('phieu-danh-gia') ||
      href.includes('danh-gia-khang-sinh') ||
      dataView === 'evaluation' ||
      dataOpen === 'evaluation' ||
      dataEval === '1' ||
      dataEval === 'true' ||
      dataEval === 'evaluation' ||
      hasEvaluationClass
    );
  }

  document.addEventListener(
    'click',
    function (event) {
      const trigger = event.target.closest(
        'a,button,[data-view],[data-open],[data-evaluation]'
      );

      if (!isEvaluationLinkOrButton(trigger)) return;
      if (trigger.classList?.contains('vpmed-eval-close')) return;

      event.preventDefault();
      event.stopPropagation();
      openEvaluationModal(trigger);
    },
    true
  );

  window.addEventListener('message', function (event) {
    if (event?.data?.type === 'close-evaluation-modal') {
      closeEvaluationModal();
    }
    if (event?.data?.type === 'evaluation-submitted') {
      const title = document.querySelector('.vpmed-eval-title strong');
      if (title) title.textContent = 'Đã hoàn tất khảo sát';
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeEvaluationModal();
  });
})();
