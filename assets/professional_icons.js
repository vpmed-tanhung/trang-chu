(function () {
  'use strict';

  const STYLE_ID = 'vpmed-professional-icons-style';
  const ICONS = {
    calculator: '<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M7 6.5h10M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>',
    radiation: '<circle cx="12" cy="12" r="2"/><path d="M10.2 9.2 7.5 4.6A8.5 8.5 0 0 1 12 3v5M13.8 9.2l2.7-4.6A8.5 8.5 0 0 1 20.3 8L16 10.5M15.2 13.4l5.2 2.2A8.5 8.5 0 0 1 17 20l-3.2-4.5M10.2 14.8 7 20a8.5 8.5 0 0 1-3.4-4.4l5.2-2.2"/>',
    capsule: '<path d="m9.4 4.6-4.8 4.8a4.24 4.24 0 0 0 6 6l4.8-4.8a4.24 4.24 0 0 0-6-6Z"/><path d="m8 13 6-6M14.6 19.4a4.24 4.24 0 0 0 6-6l-2-2"/>',
    stethoscope: '<path d="M6 3v5a6 6 0 0 0 12 0V3M4 3h4M16 3h4M12 14v2a4 4 0 0 0 8 0v-1"/><circle cx="20" cy="13" r="2"/>',
    network: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m7.2 10.9 9.5-4M7.2 13.1l9.5 4"/>',
    heartPulse: '<path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l4.1-3.9"/><path d="M14.5 13h2l1-2 2 5 1-3H23"/>',
    maternity: '<circle cx="9" cy="6" r="3"/><path d="M4.5 21v-4.5A4.5 4.5 0 0 1 9 12a4.5 4.5 0 0 1 4.5 4.5V21M16.5 9.5c1.4-1.8 4.5-.8 4.5 1.6 0 2.1-2.4 3.7-4.5 5.3-2.1-1.6-4.5-3.2-4.5-5.3 0-2.4 3.1-3.4 4.5-1.6Z"/>',
    fileSearch: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7M14 2v6h6"/><path d="m14 2 6 6v4"/><circle cx="17" cy="17" r="3"/><path d="m19.3 19.3 2.2 2.2"/>',
    library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M8 4v13M12 8h5M12 12h5"/>',
    teamCheck: '<circle cx="9" cy="7" r="3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 3.8 1.8M16 7.5a3 3 0 0 1 3 3M15.5 19l2 2 4-5"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    hospital: '<path d="M4 22V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v17M17 9h3a1 1 0 0 1 1 1v12M8 7h5M10.5 4.5v5M8 13h2M13 13h1M8 17h2M13 17h1M9 22v-2h3v2"/>',
    documentCheck: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h3M8 17h2M13 16l1.5 1.5L18 14"/>',
    medicalDocument: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M12 11v7M8.5 14.5h7"/>',
    medicalGuide: '<path d="M3 5.5A3.5 3.5 0 0 1 6.5 4H11v16H6.5A3.5 3.5 0 0 0 3 21V5.5ZM21 5.5A3.5 3.5 0 0 0 17.5 4H13v16h4.5A3.5 3.5 0 0 1 21 21V5.5Z"/><path d="M17 8v6M14 11h6"/>',
    clipboardCheck: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M8 10h8M8 14h3M13 16l1.5 1.5L18 14"/>',
    alert: '<path d="M10.3 3.6 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M8 7h8M8 11h6"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    drugDatabase: '<ellipse cx="10" cy="5" rx="6.5" ry="2.5"/><path d="M3.5 5v6c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V5M3.5 11v5c0 1.4 2.9 2.5 6.5 2.5 1 0 1.9-.1 2.7-.2M18 14v7M14.5 17.5h7"/>',
    kidney: '<path d="M9.5 3C6.5 3 4 5.7 4 9c0 4.8 3.5 8 7 8 1.2 0 2-.8 2-2V8.5C13 5.5 11.7 3 9.5 3ZM15.5 3C18.5 3 21 5.7 21 9c0 4.8-3.5 8-7 8-1.2 0-2-.8-2-2V8.5C12 5.5 13.3 3 15.5 3Z"/><path d="M10 17v4M15 17v4"/>',
    liver: '<path d="M4 7.8c0-2 1.7-3.5 3.7-3.2l2.1.3c1.6.2 3 .9 4.1 2l1 1c1.1 1.1 2.6 1.7 4.1 1.7h1v3.1c0 3.2-2.6 5.8-5.8 5.8H9.6C6.5 18.5 4 16 4 12.9V7.8Z"/><path d="M14 8.2c-.4 2.8-2.6 5-5.5 5.3"/>',
    medicineShield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9.1 13.8 4.7-4.7a2.1 2.1 0 0 1 3 3l-4.7 4.7a2.1 2.1 0 0 1-3-3Z"/><path d="m11.2 11.7 3 3"/>',
    scan: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><circle cx="12" cy="12" r="4"/><path d="M12 10v4M10 12h4"/>',
    brain: '<path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.3A3.4 3.4 0 0 0 4 14a3.5 3.5 0 0 0 5.5 4.3V4.5ZM14.5 4.5A3.5 3.5 0 0 1 18 8v.3a3.4 3.4 0 0 1 2 5.7 3.5 3.5 0 0 1-5.5 4.3V4.5Z"/><path d="M9.5 9H7.8M14.5 9h1.7M9.5 14H7.8M14.5 14h1.7"/>',
    microbe: '<circle cx="12" cy="12" r="5.2"/><path d="M12 3V1.8M12 22.2V21M3 12H1.8M22.2 12H21M5.6 5.6l-.9-.9M19.3 19.3l-.9-.9M18.4 5.6l.9-.9M4.7 19.3l.9-.9"/><circle cx="10" cy="10" r=".7"/><circle cx="14.5" cy="12" r=".7"/><circle cx="10.5" cy="14.5" r=".7"/>',
    syringe: '<path d="m14 5 5 5M16 3l5 5M13 8l-8.5 8.5a2.1 2.1 0 0 0 3 3L16 11M7 14l3 3M4.5 19.5 2 22M18 5l2-2"/>',
    menu: '<path d="M5 7h14M5 12h14M5 17h14"/>',
    externalLink: '<path d="M14 5h5v5M19 5l-8 8"/><path d="M17 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    arrowLeft: '<path d="m15 18-6-6 6-6M9 12h10"/>'
  };

  const HOME_ICONS = {
    dose: ['calculator', 'blue'],
    'petct-dose': ['radiation', 'amber'],
    antibiotics: ['capsule', 'teal'],
    diseases: ['stethoscope', 'blue'],
    interactions: ['network', 'red'],
    hepatotoxicity: ['liver', 'red'],
    'pregnancy-lactation': ['maternity', 'purple'],
    'icd10-bhyt': ['fileSearch', 'indigo'],
    sources: ['library', 'slate'],
    'antibiotic-consultation': ['teamCheck', 'amber'],
    pharmacovigilance: ['medicineShield', 'teal']
  };

  function svg(name) {
    const content = ICONS[name] || ICONS.documentCheck;
    return `<svg class="vpmed-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
  }

  function normalise(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .feature-card,.source-card,.consultation-source,.source-item,.empty-state,.renal-alert{
        --vpmed-icon-fg:#075d98;--vpmed-icon-bg-1:#f8fcff;--vpmed-icon-bg-2:#dff1fb;
        --vpmed-icon-line:#bfdcea;--vpmed-icon-shadow:rgba(31,74,108,.13)
      }
      .feature-card[data-vpmed-icon-tone="amber"],.source-card[data-vpmed-icon-tone="amber"],.consultation-source[data-vpmed-icon-tone="amber"],.source-item[data-vpmed-icon-tone="amber"],.renal-alert[data-vpmed-icon-tone="amber"]{--vpmed-icon-fg:#986000;--vpmed-icon-bg-1:#fffdf7;--vpmed-icon-bg-2:#ffe9b8;--vpmed-icon-line:#ecd08b;--vpmed-icon-shadow:rgba(152,96,0,.14)}
      .feature-card[data-vpmed-icon-tone="teal"],.source-card[data-vpmed-icon-tone="teal"],.consultation-source[data-vpmed-icon-tone="teal"],.source-item[data-vpmed-icon-tone="teal"],.renal-alert[data-vpmed-icon-tone="teal"]{--vpmed-icon-fg:#08745c;--vpmed-icon-bg-1:#f7fffc;--vpmed-icon-bg-2:#d9f3e9;--vpmed-icon-line:#adddcd;--vpmed-icon-shadow:rgba(8,116,92,.13)}
      .feature-card[data-vpmed-icon-tone="red"],.source-card[data-vpmed-icon-tone="red"],.consultation-source[data-vpmed-icon-tone="red"],.source-item[data-vpmed-icon-tone="red"],.renal-alert[data-vpmed-icon-tone="red"]{--vpmed-icon-fg:#a23d49;--vpmed-icon-bg-1:#fffafa;--vpmed-icon-bg-2:#f9dfe3;--vpmed-icon-line:#edbec5;--vpmed-icon-shadow:rgba(162,61,73,.13)}
      .feature-card[data-vpmed-icon-tone="purple"],.source-card[data-vpmed-icon-tone="purple"],.consultation-source[data-vpmed-icon-tone="purple"],.source-item[data-vpmed-icon-tone="purple"]{--vpmed-icon-fg:#7151a1;--vpmed-icon-bg-1:#fdfbff;--vpmed-icon-bg-2:#e9e0f7;--vpmed-icon-line:#cfbde9;--vpmed-icon-shadow:rgba(113,81,161,.13)}
      .feature-card[data-vpmed-icon-tone="indigo"],.source-card[data-vpmed-icon-tone="indigo"],.consultation-source[data-vpmed-icon-tone="indigo"],.source-item[data-vpmed-icon-tone="indigo"]{--vpmed-icon-fg:#4059a3;--vpmed-icon-bg-1:#fbfcff;--vpmed-icon-bg-2:#e1e7f8;--vpmed-icon-line:#bec9ea;--vpmed-icon-shadow:rgba(64,89,163,.13)}
      .feature-card[data-vpmed-icon-tone="slate"],.source-card[data-vpmed-icon-tone="slate"],.consultation-source[data-vpmed-icon-tone="slate"],.source-item[data-vpmed-icon-tone="slate"]{--vpmed-icon-fg:#50697b;--vpmed-icon-bg-1:#fbfdff;--vpmed-icon-bg-2:#e5edf2;--vpmed-icon-line:#c9d7e0;--vpmed-icon-shadow:rgba(80,105,123,.13)}
      .feature-icon.vpmed-icon-frame,.vpmed-source-icon,.consultation-source-icon,.clinical-source-icon,.vpmed-empty-icon,.renal-alert-icon.vpmed-clinical-status-icon{
        position:relative;isolation:isolate;overflow:hidden;display:inline-grid!important;place-items:center;flex:0 0 auto;font-size:0!important;
        color:var(--vpmed-icon-fg);background:linear-gradient(145deg,var(--vpmed-icon-bg-1),var(--vpmed-icon-bg-2));
        border:1px solid var(--vpmed-icon-line);box-shadow:0 8px 18px var(--vpmed-icon-shadow),inset 0 1px 0 rgba(255,255,255,.8);
        transition:transform .2s ease,box-shadow .2s ease
      }
      .feature-icon.vpmed-icon-frame:before,.vpmed-source-icon:before,.consultation-source-icon:before,.clinical-source-icon:before,.vpmed-empty-icon:before,.renal-alert-icon.vpmed-clinical-status-icon:before{
        content:"";position:absolute;z-index:-1;width:22px;height:22px;border-radius:999px;right:-7px;top:-8px;background:rgba(255,255,255,.72)
      }
      .feature-icon.vpmed-icon-frame:after,.vpmed-source-icon:after,.consultation-source-icon:after,.clinical-source-icon:after,.vpmed-empty-icon:after{
        content:"";position:absolute;width:5px;height:5px;border-radius:999px;left:6px;bottom:6px;background:currentColor;opacity:.18
      }
      .vpmed-icon-svg{position:relative;z-index:1}
      .feature-icon.vpmed-icon-frame{width:50px;height:50px;border-radius:17px;margin-bottom:2px}
      .feature-icon.vpmed-icon-frame .vpmed-icon-svg{width:27px;height:27px;stroke-width:1.75}
      .feature-card:hover .vpmed-icon-frame,.feature-card:focus-visible .vpmed-icon-frame,.source-card:hover>.vpmed-source-icon,.consultation-source:hover>.consultation-source-icon,.source-item:hover>.clinical-source-icon{transform:translateY(-2px) rotate(-1.5deg);box-shadow:0 11px 23px var(--vpmed-icon-shadow),inset 0 1px 0 rgba(255,255,255,.9)}
      .vpmed-source-icon,.consultation-source-icon,.clinical-source-icon{width:44px;height:44px;border-radius:15px;margin:0 0 10px}
      .vpmed-source-icon .vpmed-icon-svg,.consultation-source-icon .vpmed-icon-svg,.clinical-source-icon .vpmed-icon-svg{width:23px;height:23px;stroke-width:1.75}
      .consultation-source{position:relative}
      .source-item.vpmed-source-decorated{display:grid;grid-template-columns:44px minmax(0,1fr);column-gap:11px;align-items:start}
      .source-item.vpmed-source-decorated>.clinical-source-icon{grid-column:1;grid-row:1/3;margin:0}
      .source-item.vpmed-source-decorated>.source-item-title,.source-item.vpmed-source-decorated>.clinical-small{grid-column:2}
      .source-item.vpmed-source-decorated>.clinical-small{margin-top:4px}
      .vpmed-empty-icon{width:58px;height:58px;border-radius:19px;margin:0 auto 5px}
      .vpmed-empty-icon .vpmed-icon-svg{width:30px;height:30px;stroke-width:1.7}
      .vpmed-back-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important}
      .vpmed-back-icon .vpmed-icon-svg{width:18px;height:18px}
      .vpmed-link-icon{display:inline-flex!important;align-items:center;justify-content:center;vertical-align:-.15em;margin-left:2px;font-size:0!important}
      .vpmed-link-icon .vpmed-icon-svg{width:15px;height:15px;stroke-width:2}
      #menuBtn.vpmed-menu-button{font-size:0;display:grid;place-items:center}
      #menuBtn.vpmed-menu-button .vpmed-icon-svg{width:23px;height:23px;stroke-width:2}
      .renal-alert-icon.vpmed-clinical-status-icon{width:44px!important;height:44px!important;border-radius:15px!important;margin:0!important}
      .renal-alert-icon.vpmed-clinical-status-icon .vpmed-icon-svg{width:23px;height:23px}
      @media(max-width:640px){.feature-icon.vpmed-icon-frame{width:46px;height:46px;border-radius:15px}.feature-icon.vpmed-icon-frame .vpmed-icon-svg{width:25px;height:25px}.vpmed-source-icon,.consultation-source-icon,.clinical-source-icon{width:41px;height:41px;border-radius:14px}.source-item.vpmed-source-decorated{grid-template-columns:41px minmax(0,1fr)}}
    `;
    document.head.appendChild(style);
  }

  function iconifyFeatureCards(root) {
    root.querySelectorAll('.feature-card').forEach(card => {
      const route = card.dataset.open || card.dataset.view || '';
      const iconNode = card.querySelector('.feature-icon');
      if (!iconNode) return;
      const config = HOME_ICONS[route] || ['documentCheck', 'blue'];
      if (iconNode.dataset.vpmedIcon === config[0]) return;
      iconNode.innerHTML = svg(config[0]);
      iconNode.classList.add('vpmed-icon-frame');
      iconNode.dataset.vpmedIcon = config[0];
      iconNode.setAttribute('aria-hidden', 'true');
      card.dataset.vpmedIconTone = config[1];
    });
  }

  function sourceIconConfig(title) {
    const text = normalise(title);
    if (text.includes('cuc quan ly duoc') || text.includes('cong bo thuoc')) return ['drugDatabase', 'teal'];
    if (text.includes('duoc thu') || text.includes('3445') || text.includes('192/vknttw')) return ['medicalGuide', 'purple'];
    if (text.includes('5948') || text.includes('633 cap') || text.includes('tuong tac')) return ['network', 'red'];
    if (text.includes('29/qd') || text.includes('giam sat adr') || text.includes('phan ung co hai')) return ['medicineShield', 'teal'];
    if (text.includes('2115')) return ['medicalGuide', 'amber'];
    if (text.includes('5631')) return ['hospital', 'amber'];
    if (text.includes('708')) return ['syringe', 'teal'];
    if (text.includes('2388') || text.includes('than man')) return ['kidney', 'teal'];
    if (text.includes('icd-10')) return ['fileSearch', 'indigo'];
    if (text.includes('thong tu')) return ['clipboardCheck', 'blue'];
    if (text.includes('brain')) return ['brain', 'purple'];
    if (text.includes('infection') || text.includes('inflammation')) return ['microbe', 'teal'];
    if (text.includes('radiation protection')) return ['medicineShield', 'teal'];
    if (text.includes('thu vien') || text.includes('human health')) return ['library', 'purple'];
    if (text.includes('benh vien') || text.includes('sop noi bo') || text.includes('kho noi tru')) return ['hospital', 'blue'];
    if (text.includes('thuoc') || text.includes('khang sinh')) return ['capsule', 'teal'];
    if (text.includes('iaea')) return ['radiation', 'amber'];
    if (text.includes('pet/ct') || text.includes('snmmi')) return ['radiation', 'amber'];
    if (text.includes('eanm') || text.includes('acr')) return ['scan', 'indigo'];
    if (text.includes('quyet dinh')) return ['medicalDocument', 'blue'];
    return ['book', 'blue'];
  }

  function iconifySourceCards(root) {
    root.querySelectorAll('.source-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent || '';
      const config = sourceIconConfig(title);
      const iconNode = card.querySelector(':scope > div');
      if (!iconNode || iconNode.dataset.vpmedIcon === config[0]) return;
      iconNode.innerHTML = svg(config[0]);
      iconNode.classList.add('vpmed-source-icon');
      iconNode.dataset.vpmedIcon = config[0];
      iconNode.setAttribute('aria-hidden', 'true');
      card.dataset.vpmedIconTone = config[1];
    });

    root.querySelectorAll('.consultation-source').forEach(card => {
      const title = card.querySelector('h3')?.textContent || '';
      const text = normalise(title);
      const config = text.includes('5631')
        ? ['hospital', 'amber']
        : text.includes('2115')
          ? ['medicalGuide', 'amber']
          : text.includes('708')
            ? ['syringe', 'teal']
            : ['drugDatabase', 'teal'];
      let iconNode = card.querySelector(':scope > .consultation-source-icon');
      if (!iconNode) {
        iconNode = document.createElement('span');
        iconNode.className = 'consultation-source-icon';
        card.prepend(iconNode);
      }
      if (iconNode.dataset.vpmedIcon === config[0]) return;
      iconNode.innerHTML = svg(config[0]);
      iconNode.dataset.vpmedIcon = config[0];
      iconNode.setAttribute('aria-hidden', 'true');
      card.dataset.vpmedIconTone = config[1];
    });
  }

  function iconifyClinicalSourceItems(root) {
    root.querySelectorAll('.source-item').forEach(card => {
      const title = card.querySelector('.source-item-title, strong')?.textContent || '';
      const config = sourceIconConfig(title);
      let iconNode = card.querySelector(':scope > .clinical-source-icon');
      if (!iconNode) {
        iconNode = document.createElement('span');
        iconNode.className = 'clinical-source-icon';
        card.prepend(iconNode);
      }
      if (iconNode.dataset.vpmedIcon !== config[0]) {
        iconNode.innerHTML = svg(config[0]);
        iconNode.dataset.vpmedIcon = config[0];
        iconNode.setAttribute('aria-hidden', 'true');
      }
      card.classList.add('vpmed-source-decorated');
      card.dataset.vpmedIconTone = config[1];
    });
  }

  function iconifyIndicators(root) {
    root.querySelectorAll('.source-link-icon, .source-item-title > span[aria-hidden="true"]').forEach(node => {
      const link = node.closest('a');
      const iconName = link?.hasAttribute('download') ? 'download' : 'externalLink';
      if (node.dataset.vpmedIcon === iconName) return;
      node.innerHTML = svg(iconName);
      node.classList.add('vpmed-link-icon');
      node.dataset.vpmedIcon = iconName;
      node.setAttribute('aria-hidden', 'true');
    });

    const menu = root.querySelector('#menuBtn');
    if (menu && menu.dataset.vpmedIcon !== 'menu') {
      menu.innerHTML = svg('menu');
      menu.classList.add('vpmed-menu-button');
      menu.dataset.vpmedIcon = 'menu';
    }

    root.querySelectorAll('.renal-alert-icon').forEach(node => {
      const alertBox = node.closest('.renal-alert');
      const className = alertBox?.className || '';
      const preserved = className.includes('renal-preserved');
      const mild = className.includes('renal-mild');
      const iconName = preserved ? 'shieldCheck' : 'alert';
      const tone = preserved ? 'teal' : mild ? 'amber' : 'red';
      if (node.dataset.vpmedIcon !== iconName) {
        node.innerHTML = svg(iconName);
        node.dataset.vpmedIcon = iconName;
        node.setAttribute('aria-hidden', 'true');
      }
      node.classList.add('vpmed-clinical-status-icon');
      if (alertBox) alertBox.dataset.vpmedIconTone = tone;
    });
  }

  function iconifyUtilityElements(root) {
    root.querySelectorAll('.empty-state > div:first-child').forEach(node => {
      const text = normalise(node.parentElement?.textContent || '');
      const iconName = text.includes('da chon') ? 'capsule' : text.includes('khong tim') ? 'fileSearch' : 'flask';
      if (node.dataset.vpmedIcon === iconName) return;
      node.innerHTML = svg(iconName);
      node.classList.add('vpmed-empty-icon');
      node.dataset.vpmedIcon = iconName;
      node.setAttribute('aria-hidden', 'true');
    });
    root.querySelectorAll('.back-home-btn > span:first-child').forEach(node => {
      if (node.dataset.vpmedIcon === 'arrowLeft') return;
      node.innerHTML = svg('arrowLeft');
      node.classList.add('vpmed-back-icon');
      node.dataset.vpmedIcon = 'arrowLeft';
      node.setAttribute('aria-hidden', 'true');
    });
  }

  function applyIcons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    installStyles();
    iconifyFeatureCards(scope);
    iconifySourceCards(scope);
    iconifyClinicalSourceItems(scope);
    iconifyIndicators(scope);
    iconifyUtilityElements(scope);
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyIcons(document);
    });
  }

  function init() {
    applyIcons(document);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
