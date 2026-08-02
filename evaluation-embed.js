/* VPMED - evaluation-embed.js
   Sửa lỗi: các nút có nội dung chứa từ "đánh giá" bị hiểu nhầm là nút mở phiếu đánh giá.
   Chỉ mở modal khi phần tử có dấu hiệu định danh rõ ràng của chức năng Đánh giá.
*/
(function () {
  'use strict';

  if (window.__VPMED_EVALUATION_EMBED_FINAL__) return;
  window.__VPMED_EVALUATION_EMBED_FINAL__ = true;

  const EVAL_PATH = 'phieu-danh-gia.html';

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
        background:rgba(15,23,42,.60);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
      }
      .vpmed-eval-modal{
        width:min(980px,96vw);
        height:min(900px,92vh);
        background:#ffffff;
        border-radius:18px;
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
        padding:14px 18px;
        border-bottom:1px solid #dbeafe;
        background:#ffffff;
        color:#075985;
        font-weight:900;
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
      .vpmed-eval-frame{
        flex:1 1 auto;
        width:100%;
        min-height:0;
        border:0;
        background:#eef8fc;
      }
      @media(max-width:720px){
        .vpmed-eval-backdrop{padding:0}
        .vpmed-eval-modal{width:100vw;height:100vh;border-radius:0}
      }
    `;
    document.head.appendChild(style);
  }

  function closeEvaluationModal() {
    document
      .querySelectorAll('.vpmed-eval-backdrop,[data-vpmed-eval-modal="1"]')
      .forEach((el) => el.remove());

    document.body.style.overflow = '';
  }

  function openEvaluationModal() {
    ensureStyle();
    closeEvaluationModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'vpmed-eval-backdrop';
    backdrop.setAttribute('data-vpmed-eval-modal', '1');
    backdrop.innerHTML = `
      <div class="vpmed-eval-modal" role="dialog" aria-modal="true" aria-label="Phiếu đánh giá">
        <div class="vpmed-eval-head">
          <div>Phiếu đánh giá hệ thống hỗ trợ lâm sàng của Khoa Dược</div>
          <button type="button" class="vpmed-eval-close">Đóng</button>
        </div>
        <iframe class="vpmed-eval-frame" src="${getEvalUrl()}" title="Phiếu đánh giá"></iframe>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    backdrop
      .querySelector('.vpmed-eval-close')
      .addEventListener('click', closeEvaluationModal);

    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) closeEvaluationModal();
    });
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
      openEvaluationModal();
    },
    true
  );

  window.addEventListener('message', function (event) {
    if (event?.data?.type === 'close-evaluation-modal') {
      closeEvaluationModal();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeEvaluationModal();
  });
})();
