(function () {
  'use strict';

  const STYLE_ID = 'vpmed-home-compact-style';
  const INTRO_SELECTOR = '#view-home .hero-intro';
  const GRID_SELECTOR = '#view-home .feature-grid, .feature-grid';
  const CHIP_CONTAINER_ID = 'vpmedHeroToolChips';

  const SHORT_NAMES = [
    [/tính liều kháng sinh nhi/i, 'Liều kháng sinh Nhi'],
    [/dinh dưỡng lâm sàng/i, 'Dinh dưỡng lâm sàng'],
    [/pha.*bảo quản.*thuốc tiêm/i, 'Pha thuốc tiêm'],
    [/tính liều kháng sinh/i, 'Liều kháng sinh'],
    [/pet\s*\/\s*ct/i, 'PET/CT'],
    [/danh mục kháng sinh/i, 'Kháng sinh nội trú'],
    [/kháng sinh theo bệnh lý/i, 'Kháng sinh theo bệnh lý'],
    [/tương tác thuốc/i, 'Tương tác thuốc'],
    [/độc gan/i, 'Độc tính gan'],
    [/có thai|thai kỳ|cho con bú/i, 'Thai kỳ & cho con bú'],
    [/icd-?10.*bhyt|bhyt.*icd-?10/i, 'ICD-10 & BHYT'],
    [/cảnh báo dược|cảnh giác dược/i, 'Cảnh báo dược']
  ];

  let observedGrid = null;
  let gridObserver = null;
  let refreshTimer = null;

  function normaliseText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #view-home .hero-intro[data-vpmed-compact="true"] {
        max-width: 1180px;
        margin-top: 12px;
      }

      #view-home .hero-intro[data-vpmed-compact="true"] .vpmed-hero-summary {
        max-width: 900px;
        margin: 0 0 13px;
        font-size: clamp(16px, 1.6vw, 19px);
        line-height: 1.5;
      }

      #view-home .vpmed-hero-groups {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        max-width: 1120px;
        margin: 0 0 13px;
      }

      #view-home .vpmed-hero-tool-chip {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        max-width: 100%;
        padding: 7px 12px;
        border: 1px solid rgba(255, 255, 255, .32);
        border-radius: 999px;
        background: rgba(255, 255, 255, .12);
        color: #fff;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        cursor: default;
        pointer-events: none;
      }

      #view-home .hero-intro[data-vpmed-compact="true"] .vpmed-hero-action {
        margin: 0;
        font-size: 14px;
        color: rgba(255, 255, 255, .92);
      }

      @media (max-width: 640px) {
        #view-home .hero-intro[data-vpmed-compact="true"] {
          margin-top: 8px;
        }

        #view-home .vpmed-hero-groups {
          flex-wrap: nowrap;
          gap: 7px;
          width: 100%;
          padding: 1px 2px 7px 0;
          overflow-x: auto;
          overscroll-behavior-inline: contain;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }

        #view-home .vpmed-hero-tool-chip {
          flex: 0 0 auto;
          min-height: 31px;
          padding: 6px 10px;
          font-size: 12px;
          cursor: default;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureCompactIntroduction() {
    const intro = document.querySelector(INTRO_SELECTOR);
    if (!intro) return null;

    ensureStyle();

    if (intro.dataset.vpmedCompact !== 'true' || !intro.querySelector(`#${CHIP_CONTAINER_ID}`)) {
      intro.innerHTML = `
        <p class="vpmed-hero-summary">
          Tra cứu thông tin thuốc, tính liều và rà soát an toàn trong thực hành lâm sàng.
        </p>
        <div id="${CHIP_CONTAINER_ID}" class="vpmed-hero-groups" aria-label="Các nhóm công cụ chính (chỉ để giới thiệu)"></div>
        <p class="vpmed-hero-action">
          Chọn thẻ mở tại mục <strong>Ứng dụng chính</strong> bên dưới để sử dụng.
        </p>`;
      intro.dataset.vpmedCompact = 'true';
    }

    return intro;
  }

  function getCardTitle(card) {
    const custom = normaliseText(card.dataset.introLabel);
    if (custom) return custom;

    const titleNode = card.querySelector('b, h3, h4, .feature-title, .card-title');
    if (titleNode) return normaliseText(titleNode.textContent);

    return normaliseText(card.getAttribute('aria-label') || card.textContent);
  }

  function getShortTitle(fullTitle) {
    const title = normaliseText(fullTitle);
    for (const [pattern, shortName] of SHORT_NAMES) {
      if (pattern.test(title)) return shortName;
    }
    return title.length > 34 ? `${title.slice(0, 33).trim()}…` : title;
  }

  function getCardKey(card, index) {
    return normaliseText(
      card.dataset.open ||
      card.dataset.view ||
      card.getAttribute('href') ||
      card.id ||
      getCardTitle(card) ||
      `tool-${index}`
    );
  }

  function shouldIncludeCard(card) {
    if (!(card instanceof HTMLElement)) return false;
    if (card.hidden || card.getAttribute('aria-hidden') === 'true') return false;
    if (card.matches('[disabled], [data-intro-hide="true"]')) return false;

    const route = normaliseText(card.dataset.open || card.dataset.view || card.getAttribute('href')).toLowerCase();
    const title = getCardTitle(card).toLowerCase();

    // “Nguồn dữ liệu hệ thống” là trang tham khảo, không phải công cụ thao tác nhanh.
    if (route === 'sources' || route === '#sources' || route.endsWith('#sources')) return false;
    if (title.includes('nguồn dữ liệu hệ thống')) return false;

    return Boolean(title);
  }

  function collectToolCards() {
    const grid = document.querySelector(GRID_SELECTOR);
    if (!grid) return [];

    const candidates = Array.from(grid.querySelectorAll('.feature-card, [data-open], [data-view], a[href^="#"]'));
    const seen = new Set();

    return candidates.filter((card, index) => {
      if (!shouldIncludeCard(card)) return false;
      const key = getCardKey(card, index);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      card.dataset.vpmedHeroToolKey = key;
      return true;
    });
  }

  function renderToolChips() {
    const intro = ensureCompactIntroduction();
    if (!intro) return false;

    const container = intro.querySelector(`#${CHIP_CONTAINER_ID}`);
    if (!container) return false;

    const cards = collectToolCards();
    const signature = cards.map((card, index) => `${getCardKey(card, index)}|${getCardTitle(card)}`).join('||');

    if (container.dataset.signature === signature && container.childElementCount === cards.length) {
      observeGrid();
      return true;
    }

    container.replaceChildren();

    cards.forEach((card, index) => {
      const fullTitle = getCardTitle(card);
      const key = getCardKey(card, index);
      const chip = document.createElement('span');
      chip.className = 'vpmed-hero-tool-chip';
      chip.textContent = getShortTitle(fullTitle);
      chip.title = fullTitle;
      chip.setAttribute('aria-hidden', 'true');
      chip.dataset.toolKey = key;
      container.appendChild(chip);
    });

    container.dataset.signature = signature;
    observeGrid();
    return true;
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(renderToolChips, 80);
  }

  function observeGrid() {
    const grid = document.querySelector(GRID_SELECTOR);
    if (!grid || grid === observedGrid) return;

    if (gridObserver) gridObserver.disconnect();
    observedGrid = grid;
    gridObserver = new MutationObserver(scheduleRefresh);
    gridObserver.observe(grid, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-open', 'data-view', 'data-intro-label', 'data-intro-hide', 'href', 'hidden', 'aria-hidden']
    });
  }

  function init() {
    let attempts = 0;
    const run = () => {
      attempts += 1;
      const ready = renderToolChips();
      if (!ready && attempts < 40) window.setTimeout(run, 250);
    };
    run();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
