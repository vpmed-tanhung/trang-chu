/*
 * VPMED Tân Hưng – Cải thiện form tính đơn PET/CT theo từng bước
 * Phiên bản: 2026-07-13
 * Phạm vi: chỉ thay đổi cách trình bày và hướng dẫn nhập liệu.
 * Không thay đổi công thức, dữ liệu, hàm calc(), calcBatchDose() hoặc các kết quả tính.
 */
(function () {
  'use strict';

  const VERSION = '2026.07.13';
  const ROOT_ID = 'view-petct-dose';

  function byId(id) {
    return document.getElementById(id);
  }

  function fieldWrap(idOrElement) {
    const element = typeof idOrElement === 'string' ? byId(idOrElement) : idOrElement;
    if (!element) return null;
    if (element.parentElement && element.parentElement.tagName === 'LABEL') return element.parentElement;
    return element.closest('div') || element.parentElement;
  }

  function fieldLabel(idOrElement) {
    const element = typeof idOrElement === 'string' ? byId(idOrElement) : idOrElement;
    if (!element) return null;
    if (element.parentElement && element.parentElement.tagName === 'LABEL') return element.parentElement;
    const wrap = fieldWrap(element);
    if (!wrap) return null;
    return wrap.querySelector(':scope > label') || wrap.querySelector('label');
  }

  function addBadge(id, type, text) {
    const label = fieldLabel(id);
    if (!label) return;
    label.querySelectorAll('.petct-required, .petct-optional, .petct-auto').forEach(function (node) {
      node.remove();
    });
    const badge = document.createElement('span');
    badge.className = type === 'required' ? 'petct-required' : (type === 'auto' ? 'petct-auto' : 'petct-optional');
    badge.textContent = type === 'required' ? ' *' : (text || (type === 'auto' ? 'Tự động' : 'Không bắt buộc'));
    label.appendChild(badge);
  }

  function addHelp(id, text) {
    const wrap = fieldWrap(id);
    const element = byId(id);
    if (!wrap || !element || wrap.querySelector('.petct-field-help')) return;
    const help = document.createElement('small');
    help.className = 'petct-field-help';
    help.textContent = text;
    element.insertAdjacentElement('afterend', help);
  }

  function setPlaceholder(id, text) {
    const element = byId(id);
    if (element) element.setAttribute('placeholder', text);
  }

  function clearError(id) {
    const element = byId(id);
    const wrap = fieldWrap(id);
    if (element) {
      element.classList.remove('petct-invalid');
      element.removeAttribute('aria-invalid');
    }
    if (wrap) {
      const error = wrap.querySelector('.petct-field-error');
      if (error) error.remove();
    }
  }

  function setError(id, message) {
    const element = byId(id);
    const wrap = fieldWrap(id);
    if (!element || !wrap) return;
    clearError(id);
    element.classList.add('petct-invalid');
    element.setAttribute('aria-invalid', 'true');
    const error = document.createElement('small');
    error.className = 'petct-field-error';
    error.textContent = message;
    element.insertAdjacentElement('afterend', error);
  }

  function valueNumber(id) {
    const element = byId(id);
    if (!element || String(element.value).trim() === '') return NaN;
    return Number(element.value);
  }

  function focusFirstError(panel) {
    const invalid = panel ? panel.querySelector('.petct-invalid') : document.querySelector('.petct-invalid');
    if (invalid) {
      invalid.focus({ preventScroll: true });
      invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function addGroupNote(card, html) {
    if (!card || card.querySelector('.petct-group-note')) return;
    const note = document.createElement('div');
    note.className = 'petct-group-note';
    note.innerHTML = html;
    const heading = card.querySelector('h2');
    if (heading) heading.insertAdjacentElement('afterend', note);
  }

  function createSegmentedControl(name, options, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'petct-segmented';
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', name);

    options.forEach(function (option) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'petct-segmented-btn';
      button.dataset.value = option.value;
      button.innerHTML = '<b>' + option.title + '</b><small>' + option.description + '</small>';
      button.addEventListener('click', function () {
        onChange(option.value);
      });
      wrapper.appendChild(button);
    });

    return wrapper;
  }

  function setSegmentedActive(wrapper, value) {
    if (!wrapper) return;
    wrapper.querySelectorAll('.petct-segmented-btn').forEach(function (button) {
      const active = button.dataset.value === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function injectStyles() {
    if (document.getElementById('petct-step-form-styles')) return;
    const style = document.createElement('style');
    style.id = 'petct-step-form-styles';
    style.textContent = `
      #${ROOT_ID} .petct-wizard-shell{margin:0 auto 18px;max-width:1080px;border:1px solid #d9e8ee;border-radius:18px;background:#fff;box-shadow:0 12px 34px rgba(21,67,82,.08);overflow:hidden}
      #${ROOT_ID} .petct-wizard-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 20px 14px;background:linear-gradient(135deg,#f4fbfd 0%,#eef8fb 100%);border-bottom:1px solid #d9e8ee}
      #${ROOT_ID} .petct-wizard-intro h2{margin:0 0 5px;font-size:20px;line-height:1.3;color:#123d4a}
      #${ROOT_ID} .petct-wizard-intro p{margin:0;color:#4a6470;line-height:1.55}
      #${ROOT_ID} .petct-required-legend{white-space:nowrap;font-size:13px;color:#b42318;font-weight:800;padding-top:3px}
      #${ROOT_ID} .petct-wizard-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;padding:0 10px;background:#fff;border-bottom:1px solid #e5eef2}
      #${ROOT_ID} .petct-step-tab{appearance:none;border:0;background:transparent;padding:14px 8px 13px;display:flex;align-items:center;justify-content:center;gap:8px;color:#6b7f88;font:inherit;cursor:pointer;position:relative;min-width:0}
      #${ROOT_ID} .petct-step-tab::after{content:"";position:absolute;left:12px;right:12px;bottom:-1px;height:3px;border-radius:3px 3px 0 0;background:transparent}
      #${ROOT_ID} .petct-step-number{display:grid;place-items:center;flex:0 0 28px;height:28px;border-radius:50%;background:#edf3f5;color:#46606b;font-weight:900;font-size:13px}
      #${ROOT_ID} .petct-step-copy{display:flex;flex-direction:column;min-width:0;text-align:left}
      #${ROOT_ID} .petct-step-copy b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${ROOT_ID} .petct-step-copy small{font-size:11px;font-weight:600;color:#8a9aa1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #${ROOT_ID} .petct-step-tab.is-active{color:#0b6f82}
      #${ROOT_ID} .petct-step-tab.is-active::after{background:#0b7f91}
      #${ROOT_ID} .petct-step-tab.is-active .petct-step-number{background:#0b7f91;color:#fff}
      #${ROOT_ID} .petct-step-tab.is-complete .petct-step-number{background:#157347;color:#fff}
      #${ROOT_ID} .petct-wizard-grid{display:block!important;max-width:1080px;margin:0 auto!important}
      #${ROOT_ID} .petct-wizard-panel{max-width:1080px;margin:0 auto 16px!important;border-radius:18px!important;border:1px solid #dce9ee!important;box-shadow:0 10px 28px rgba(26,69,83,.07)!important}
      #${ROOT_ID} .petct-wizard-panel[hidden],#${ROOT_ID} .petct-result-extra[hidden]{display:none!important}
      #${ROOT_ID} .petct-wizard-panel>h2{display:flex;align-items:center;gap:10px;margin-bottom:8px!important;color:#123d4a!important}
      #${ROOT_ID} .petct-wizard-panel>h2::before{content:attr(data-step);display:grid;place-items:center;flex:0 0 34px;height:34px;border-radius:11px;background:#e8f5f8;color:#08798b;font-size:14px;font-weight:900}
      #${ROOT_ID} .petct-group-note{margin:0 0 16px;padding:11px 13px;border-radius:12px;background:#f7fafb;border:1px solid #dbe8ed;color:#3f5964;font-size:13px;line-height:1.55}
      #${ROOT_ID} .petct-group-note strong{color:#b42318}
      #${ROOT_ID} .petct-required{color:#d92d20;font-size:16px;font-weight:900}
      #${ROOT_ID} .petct-optional,#${ROOT_ID} .petct-auto{display:inline-flex;margin-left:7px;padding:2px 7px;border-radius:999px;background:#eef3f5;color:#60747d;font-size:10px;font-weight:800;vertical-align:middle}
      #${ROOT_ID} .petct-auto{background:#e8f5f8;color:#0b6f82}
      #${ROOT_ID} .petct-field-help{display:block;margin-top:5px;color:#71848c;font-size:11px;line-height:1.45;font-weight:600}
      #${ROOT_ID} .petct-field-error{display:block;margin-top:5px;color:#b42318;font-size:11px;line-height:1.4;font-weight:800}
      #${ROOT_ID} .petct-invalid{border-color:#d92d20!important;box-shadow:0 0 0 3px rgba(217,45,32,.12)!important;background:#fffafa!important}
      #${ROOT_ID} .petct-segmented{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:8px 0 16px}
      #${ROOT_ID} .petct-segmented-btn{appearance:none;border:1px solid #d6e4e9;border-radius:13px;background:#fff;padding:12px 14px;text-align:left;color:#36535f;font:inherit;cursor:pointer;transition:.18s ease}
      #${ROOT_ID} .petct-segmented-btn:hover{border-color:#82bdc8;background:#f7fcfd}
      #${ROOT_ID} .petct-segmented-btn.is-active{border-color:#0b7f91;background:#edf9fb;box-shadow:0 0 0 2px rgba(11,127,145,.10)}
      #${ROOT_ID} .petct-segmented-btn b{display:block;font-size:13px;margin-bottom:3px;color:#123d4a}
      #${ROOT_ID} .petct-segmented-btn small{display:block;font-size:11px;line-height:1.4;color:#71848c}
      #${ROOT_ID} .petct-method-hidden{display:none!important}
      #${ROOT_ID} .petct-step-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid #e3ecef}
      #${ROOT_ID} .petct-step-actions-right{display:flex;gap:8px;margin-left:auto}
      #${ROOT_ID} .petct-wizard-btn{appearance:none;border:1px solid #cddde3;border-radius:11px;background:#fff;color:#385460;padding:10px 16px;font:inherit;font-weight:800;cursor:pointer;min-height:42px}
      #${ROOT_ID} .petct-wizard-btn:hover{background:#f5f9fa}
      #${ROOT_ID} .petct-wizard-btn.primary{border-color:#0b7f91;background:#0b7f91;color:#fff}
      #${ROOT_ID} .petct-wizard-btn.primary:hover{background:#096f7f}
      #${ROOT_ID} .petct-wizard-btn.skip{border-color:#b7d5dc;background:#eff8fa;color:#0b6f82}
      #${ROOT_ID} details.petct-advanced{margin:12px 0 4px;border:1px solid #dde9ed;border-radius:12px;background:#f9fbfc;overflow:hidden}
      #${ROOT_ID} details.petct-advanced>summary{cursor:pointer;padding:11px 13px;font-weight:800;color:#45616c;list-style:none}
      #${ROOT_ID} details.petct-advanced>summary::-webkit-details-marker{display:none}
      #${ROOT_ID} details.petct-advanced>summary::before{content:"＋";display:inline-block;margin-right:8px;color:#0b7f91;font-weight:900}
      #${ROOT_ID} details.petct-advanced[open]>summary::before{content:"−"}
      #${ROOT_ID} .petct-advanced-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:0 13px 13px}
      #${ROOT_ID} .petct-readonly input[readonly]{background:#f3f7f8!important;color:#49626c!important;border-style:dashed!important}
      #${ROOT_ID} .petct-step4-note{padding:10px 12px;border-radius:11px;background:#fff8e8;border:1px solid #f2ddb0;color:#735a1a;font-size:12px;line-height:1.5;margin-bottom:12px}
      #${ROOT_ID} .petct-result-back{margin-bottom:14px}
      @media(max-width:900px){
        #${ROOT_ID} .petct-wizard-nav{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;justify-content:flex-start;padding:0 6px}
        #${ROOT_ID} .petct-step-tab{flex:0 0 155px;scroll-snap-align:start;justify-content:flex-start}
        #${ROOT_ID} .petct-step-copy small{display:none}
      }
      @media(max-width:680px){
        #${ROOT_ID} .petct-wizard-shell{border-radius:14px;margin-bottom:12px}
        #${ROOT_ID} .petct-wizard-intro{display:block;padding:15px}
        #${ROOT_ID} .petct-wizard-intro h2{font-size:18px}
        #${ROOT_ID} .petct-required-legend{padding-top:8px}
        #${ROOT_ID} .petct-wizard-panel{border-radius:14px!important;padding:15px!important}
        #${ROOT_ID} .petct-segmented{grid-template-columns:1fr}
        #${ROOT_ID} .petct-step-actions{align-items:stretch;flex-direction:column-reverse}
        #${ROOT_ID} .petct-step-actions-right{display:grid;grid-template-columns:1fr;width:100%;margin-left:0}
        #${ROOT_ID} .petct-wizard-btn{width:100%}
        #${ROOT_ID} .petct-advanced-body{grid-template-columns:1fr}
      }
      @media print{
        #${ROOT_ID} .petct-wizard-shell,#${ROOT_ID} .petct-step-actions,#${ROOT_ID} .petct-result-back{display:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    const root = byId(ROOT_ID);
    if (!root || root.dataset.petctStepForm === VERSION) return;

    const requiredIds = ['singleCondition', 'tracerSelect', 'weight', 'k', 'kUnit', 'half', 'mode'];
    if (requiredIds.some(function (id) { return !byId(id); })) return;

    injectStyles();

    const infoCard = byId('weight').closest('section.card');
    const timeCard = byId('drawDate').closest('section.card');
    const concentrationCard = byId('stockA').closest('section.card');
    const postCard = byId('preA').closest('section.card');
    const resultCard = byId('target').closest('section.card');
    const tableCard = byId('table') ? byId('table').closest('section.card') : null;
    const noteCard = byId('note') ? byId('note').closest('section.card') : null;
    const grid = infoCard ? infoCard.closest('.grid') : null;

    if (!infoCard || !timeCard || !concentrationCard || !postCard || !resultCard || !grid) return;

    root.dataset.petctStepForm = VERSION;
    grid.classList.add('petct-wizard-grid');
    [infoCard, timeCard, concentrationCard, postCard, resultCard].forEach(function (card) {
      card.classList.add('petct-wizard-panel');
    });
    [tableCard, noteCard].filter(Boolean).forEach(function (card) {
      card.classList.add('petct-result-extra');
    });

    const infoHeading = infoCard.querySelector('h2');
    const timeHeading = timeCard.querySelector('h2');
    const concentrationHeading = concentrationCard.querySelector('h2');
    const postHeading = postCard.querySelector('h2');
    const resultHeading = resultCard.querySelector('h2');
    if (infoHeading) {
      infoHeading.textContent = 'Thông tin người bệnh và liều mục tiêu';
      infoHeading.setAttribute('data-step', '1');
    }
    if (timeHeading) {
      timeHeading.textContent = 'Xác định thời gian từ lúc đo/rút đến lúc tiêm';
      timeHeading.setAttribute('data-step', '2');
    }
    if (concentrationHeading) {
      concentrationHeading.textContent = 'Nhập nồng độ để tính thể tích cần rút';
      concentrationHeading.setAttribute('data-step', '3');
    }
    if (postHeading) {
      postHeading.textContent = 'Ghi nhận liều thực tiêm sau tiêm';
      postHeading.setAttribute('data-step', '4');
    }
    if (resultHeading) resultHeading.setAttribute('data-step', '5');

    addGroupNote(infoCard, '<strong>* Trường bắt buộc.</strong> Hoàn thành cân nặng và hệ số liều trước khi chuyển sang bước tiếp theo. Các thông tin lâm sàng bổ sung có thể để trống.');
    addGroupNote(timeCard, '<strong>* Chọn một cách nhập thời gian:</strong> nhập trực tiếp số phút chờ hoặc nhập đầy đủ ngày/giờ đo-rút và ngày/giờ tiêm.');
    addGroupNote(concentrationCard, '<strong>* Chọn một cách nhập nồng độ:</strong> nhập trực tiếp mCi/mL hoặc nhập tổng hoạt độ kèm tổng thể tích.');

    const postNote = document.createElement('div');
    postNote.className = 'petct-step4-note';
    postNote.innerHTML = '<b>Bước này không bắt buộc trước tiêm.</b> Có thể bỏ qua để xem liều mục tiêu và thể tích cần rút. Sau tiêm, quay lại nhập số đo trước tiêm và phần còn dư để tính liều thực tiêm.';
    if (postHeading && !postCard.querySelector('.petct-step4-note')) {
      postHeading.insertAdjacentElement('afterend', postNote);
    }

    requiredIds.forEach(function (id) { addBadge(id, 'required'); });
    ['singleGlucose', 'singleBloodPressure', 'singleClinicalNote', 'minCheck', 'maxCheck', 'preA', 'resA', 'resDelta', 'note'].forEach(function (id) {
      if (byId(id)) addBadge(id, 'optional');
    });
    ['doseRangeText', 'clinicalUseText'].forEach(function (id) {
      if (byId(id)) {
        addBadge(id, 'auto');
        const wrap = fieldWrap(id);
        if (wrap) wrap.classList.add('petct-readonly');
      }
    });

    addHelp('weight', 'Nhập cân nặng hiện tại của người bệnh, đơn vị kg.');
    addHelp('k', 'Có thể chọn nhanh bằng các nút phía dưới hoặc nhập theo SOP của đơn vị.');
    addHelp('half', 'Hệ thống tự cập nhật theo đồng vị đã chọn; chỉ sửa khi SOP quy định khác.');
    addHelp('singleGlucose', 'Nhập khi có chỉ định kiểm tra đường huyết trước tiêm.');
    addHelp('singleBloodPressure', 'Định dạng gợi ý: 130/80.');
    addHelp('drawnMci', 'Chỉ bắt buộc khi chọn chế độ tính lượng còn lại lúc tiêm từ lượng đã rút.');
    addHelp('preA', 'Số đo hoạt độ của bơm trước khi tiêm.');
    addHelp('resA', 'Số đo phần hoạt độ còn dư sau khi tiêm.');

    setPlaceholder('weight', 'Ví dụ: 60');
    setPlaceholder('k', 'Ví dụ: 0.15');
    setPlaceholder('drawTime', 'Ví dụ: 08:30');
    setPlaceholder('injectTime', 'Ví dụ: 09:00');
    setPlaceholder('deltaManual', 'Ví dụ: 30');
    setPlaceholder('drawnMci', 'Ví dụ: 8.50');
    setPlaceholder('stockA', 'Ví dụ: 200');
    setPlaceholder('stockV', 'Ví dụ: 10');
    setPlaceholder('concDirect', 'Ví dụ: 20');
    setPlaceholder('preA', 'Ví dụ: 8.20');
    setPlaceholder('resA', 'Ví dụ: 0.35');

    ['weight', 'k', 'half'].forEach(function (id) {
      const element = byId(id);
      if (element) element.setAttribute('required', 'required');
    });

    // Thu gọn các thông tin không bắt buộc để người mới không bị ngợp.
    const clinicalOptionalIds = ['singleGlucose', 'singleBloodPressure', 'singleClinicalNote'];
    const clinicalOptionalWraps = clinicalOptionalIds.map(fieldWrap).filter(Boolean);
    if (clinicalOptionalWraps.length) {
      const details = document.createElement('details');
      details.className = 'petct-advanced';
      details.innerHTML = '<summary>Thông tin lâm sàng bổ sung <span class="petct-optional">Không bắt buộc</span></summary><div class="petct-advanced-body"></div>';
      const body = details.querySelector('.petct-advanced-body');
      clinicalOptionalWraps.forEach(function (wrap) { body.appendChild(wrap); });
      const conditionGrid = byId('singleCondition').closest('.grid3');
      if (conditionGrid) conditionGrid.insertAdjacentElement('afterend', details);
    }

    const advancedDoseIds = ['minCheck', 'maxCheck'];
    const advancedDoseWraps = advancedDoseIds.map(fieldWrap).filter(Boolean);
    if (advancedDoseWraps.length) {
      const details = document.createElement('details');
      details.className = 'petct-advanced';
      details.innerHTML = '<summary>Thiết lập ngưỡng kiểm tra <span class="petct-optional">Nâng cao</span></summary><div class="petct-advanced-body"></div>';
      const body = details.querySelector('.petct-advanced-body');
      advancedDoseWraps.forEach(function (wrap) { body.appendChild(wrap); });
      const halfGrid = byId('half').closest('.grid3');
      if (halfGrid) halfGrid.insertAdjacentElement('afterend', details);
    }

    let timeMethod = (String(byId('deltaManual').value || '').trim() !== '') ? 'manual' :
      (['drawDate', 'drawTime', 'injectDate', 'injectTime'].some(function (id) { return String(byId(id).value || '').trim() !== ''; }) ? 'datetime' : 'manual');

    const timeSwitch = createSegmentedControl('Cách nhập thời gian', [
      { value: 'manual', title: 'Nhập trực tiếp số phút', description: 'Nhanh nhất khi đã biết khoảng thời gian chờ.' },
      { value: 'datetime', title: 'Nhập ngày và giờ', description: 'Hệ thống tự tính số phút từ lúc đo/rút đến lúc tiêm.' }
    ], function (value) {
      timeMethod = value;
      updateTimeMethod();
    });
    const timeNote = timeCard.querySelector('.petct-group-note');
    if (timeNote) timeNote.insertAdjacentElement('afterend', timeSwitch);

    const dateTimeWraps = ['drawDate', 'drawTime', 'injectDate', 'injectTime'].map(fieldWrap).filter(Boolean);
    const manualWrap = fieldWrap('deltaManual');

    function updateTimeMethod() {
      setSegmentedActive(timeSwitch, timeMethod);
      dateTimeWraps.forEach(function (wrap) { wrap.classList.toggle('petct-method-hidden', timeMethod !== 'datetime'); });
      if (manualWrap) manualWrap.classList.toggle('petct-method-hidden', timeMethod !== 'manual');
      ['deltaManual', 'drawDate', 'drawTime', 'injectDate', 'injectTime'].forEach(clearError);
    }
    updateTimeMethod();

    let concentrationMethod = (Number(byId('concDirect').value) > 0) ? 'direct' :
      ((Number(byId('stockA').value) > 0 || Number(byId('stockV').value) > 0) ? 'stock' : 'direct');

    const concentrationSwitch = createSegmentedControl('Cách nhập nồng độ', [
      { value: 'direct', title: 'Đã biết nồng độ mCi/mL', description: 'Chỉ nhập một giá trị nồng độ tại thời điểm đo/rút.' },
      { value: 'stock', title: 'Có tổng hoạt độ và thể tích', description: 'Hệ thống tự tính nồng độ từ tổng mCi và tổng mL.' }
    ], function (value) {
      concentrationMethod = value;
      updateConcentrationMethod();
    });
    const concentrationNote = concentrationCard.querySelector('.petct-group-note');
    if (concentrationNote) concentrationNote.insertAdjacentElement('afterend', concentrationSwitch);

    const stockWraps = ['stockA', 'stockV'].map(fieldWrap).filter(Boolean);
    const directWrap = fieldWrap('concDirect');

    function updateConcentrationMethod() {
      setSegmentedActive(concentrationSwitch, concentrationMethod);
      stockWraps.forEach(function (wrap) { wrap.classList.toggle('petct-method-hidden', concentrationMethod !== 'stock'); });
      if (directWrap) directWrap.classList.toggle('petct-method-hidden', concentrationMethod !== 'direct');
      ['stockA', 'stockV', 'concDirect'].forEach(clearError);
    }
    updateConcentrationMethod();

    const mode = byId('mode');
    const drawnWrap = fieldWrap('drawnMci');
    function updateMode() {
      const needDrawn = mode && mode.value === 'drawToInject';
      if (drawnWrap) drawnWrap.classList.toggle('petct-method-hidden', !needDrawn);
      if (needDrawn) addBadge('drawnMci', 'required');
      else {
        addBadge('drawnMci', 'optional', 'Chỉ dùng ở chế độ 2');
        clearError('drawnMci');
      }
    }
    if (mode) mode.addEventListener('change', updateMode);
    updateMode();

    // Thanh hướng dẫn từng bước.
    const shell = document.createElement('div');
    shell.className = 'petct-wizard-shell';
    shell.innerHTML = `
      <div class="petct-wizard-intro">
        <div><h2>Tính đơn bệnh nhân theo từng bước</h2><p>Nhập lần lượt từ Bước 1 đến Bước 4. Các trường bắt buộc được đánh dấu rõ để người dùng mới dễ thao tác.</p></div>
        <div class="petct-required-legend">* Trường bắt buộc</div>
      </div>
      <nav class="petct-wizard-nav" aria-label="Các bước nhập liệu PET/CT"></nav>
    `;
    grid.insertAdjacentElement('beforebegin', shell);

    const stepDefinitions = [
      { title: 'Thông tin ca', detail: 'Người bệnh và liều' },
      { title: 'Thời gian', detail: 'Đo/rút đến tiêm' },
      { title: 'Nồng độ', detail: 'Tính thể tích rút' },
      { title: 'Sau tiêm', detail: 'Không bắt buộc' },
      { title: 'Kết quả', detail: 'Kiểm tra và in' }
    ];
    const nav = shell.querySelector('.petct-wizard-nav');
    const tabs = stepDefinitions.map(function (step, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'petct-step-tab';
      button.innerHTML = '<span class="petct-step-number">' + (index + 1) + '</span><span class="petct-step-copy"><b>' + step.title + '</b><small>' + step.detail + '</small></span>';
      button.addEventListener('click', function () {
        goToStep(index);
      });
      nav.appendChild(button);
      return button;
    });

    const panels = [infoCard, timeCard, concentrationCard, postCard, resultCard];
    let currentStep = 0;
    const completed = new Set();

    function validateStep(index) {
      let valid = true;
      const errors = [];

      function requirePositive(id, message) {
        clearError(id);
        const number = valueNumber(id);
        if (!Number.isFinite(number) || number <= 0) {
          setError(id, message);
          errors.push(id);
          valid = false;
        }
      }

      if (index === 0) {
        ['weight', 'k', 'half'].forEach(clearError);
        requirePositive('weight', 'Vui lòng nhập cân nặng lớn hơn 0 kg.');
        requirePositive('k', 'Vui lòng nhập hoặc chọn hệ số liều theo SOP.');
        requirePositive('half', 'Vui lòng nhập chu kỳ bán rã lớn hơn 0 phút.');
      }

      if (index === 1) {
        ['deltaManual', 'drawDate', 'drawTime', 'injectDate', 'injectTime', 'drawnMci'].forEach(clearError);
        if (timeMethod === 'manual') {
          const minutes = valueNumber('deltaManual');
          if (!Number.isFinite(minutes) || minutes < 0) {
            setError('deltaManual', 'Vui lòng nhập số phút chờ từ 0 trở lên.');
            errors.push('deltaManual');
            valid = false;
          }
        } else {
          ['drawDate', 'drawTime', 'injectDate', 'injectTime'].forEach(function (id) {
            const element = byId(id);
            if (!element || String(element.value).trim() === '') {
              setError(id, 'Vui lòng nhập đầy đủ trường này.');
              errors.push(id);
              valid = false;
            }
          });
          ['drawTime', 'injectTime'].forEach(function (id) {
            const element = byId(id);
            if (element && String(element.value).trim() && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(element.value).trim())) {
              setError(id, 'Nhập giờ theo định dạng HH:mm, ví dụ 08:30.');
              errors.push(id);
              valid = false;
            }
          });
        }
        if (mode && mode.value === 'drawToInject') {
          requirePositive('drawnMci', 'Vui lòng nhập hoạt độ đã rút khi dùng chế độ này.');
        }
      }

      if (index === 2) {
        ['stockA', 'stockV', 'concDirect'].forEach(clearError);
        if (concentrationMethod === 'direct') {
          requirePositive('concDirect', 'Vui lòng nhập nồng độ trực tiếp lớn hơn 0 mCi/mL.');
        } else {
          requirePositive('stockA', 'Vui lòng nhập tổng hoạt độ lớn hơn 0 mCi.');
          requirePositive('stockV', 'Vui lòng nhập tổng thể tích lớn hơn 0 mL.');
        }
      }

      if (index === 3) {
        ['preA', 'resA', 'resDelta'].forEach(clearError);
        const preText = String(byId('preA').value || '').trim();
        const resText = String(byId('resA').value || '').trim();
        if (preText || resText) {
          requirePositive('preA', 'Đã nhập dữ liệu sau tiêm thì cần nhập hoạt độ trước tiêm.');
          requirePositive('resA', 'Đã nhập dữ liệu sau tiêm thì cần nhập hoạt độ còn dư.');
          const delta = valueNumber('resDelta');
          if (!Number.isFinite(delta) || delta < 0) {
            setError('resDelta', 'Số phút chênh lệch phải từ 0 trở lên.');
            errors.push('resDelta');
            valid = false;
          }
        }
      }

      if (!valid) focusFirstError(panels[index]);
      return valid;
    }

    function validatePrevious(targetIndex) {
      for (let index = 0; index < targetIndex; index += 1) {
        if (!validateStep(index)) {
          showStep(index, true);
          return false;
        }
        completed.add(index);
      }
      return true;
    }

    function showStep(index, scroll) {
      currentStep = Math.max(0, Math.min(index, panels.length - 1));
      panels.forEach(function (panel, panelIndex) {
        panel.hidden = panelIndex !== currentStep;
      });
      [tableCard, noteCard].filter(Boolean).forEach(function (card) {
        card.hidden = currentStep !== 4;
      });
      tabs.forEach(function (tab, tabIndex) {
        tab.classList.toggle('is-active', tabIndex === currentStep);
        tab.classList.toggle('is-complete', completed.has(tabIndex));
        tab.setAttribute('aria-current', tabIndex === currentStep ? 'step' : 'false');
      });
      if (currentStep === 4 && typeof window.calc === 'function') {
        window.setTimeout(function () { window.calc(); }, 0);
      }
      if (scroll) {
        shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function goToStep(index) {
      if (index <= currentStep) {
        showStep(index, true);
        return;
      }
      if (validatePrevious(index)) showStep(index, true);
    }

    function addActions(card, stepIndex, options) {
      if (!card || card.querySelector('.petct-step-actions')) return;
      const actions = document.createElement('div');
      actions.className = 'petct-step-actions';
      const right = document.createElement('div');
      right.className = 'petct-step-actions-right';

      if (stepIndex > 0) {
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'petct-wizard-btn';
        back.textContent = '← Quay lại';
        back.addEventListener('click', function () { showStep(stepIndex - 1, true); });
        actions.appendChild(back);
      } else {
        actions.appendChild(document.createElement('span'));
      }

      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'petct-wizard-btn ' + (options && options.skip ? 'skip' : 'primary');
      next.textContent = (options && options.label) || 'Tiếp tục →';
      next.addEventListener('click', function () {
        if (validateStep(stepIndex)) {
          completed.add(stepIndex);
          showStep(stepIndex + 1, true);
        }
      });
      right.appendChild(next);
      actions.appendChild(right);
      card.appendChild(actions);
    }

    addActions(infoCard, 0, { label: 'Tiếp tục: Nhập thời gian →' });
    addActions(timeCard, 1, { label: 'Tiếp tục: Nhập nồng độ →' });
    addActions(concentrationCard, 2, { label: 'Tiếp tục: Sau tiêm →' });
    addActions(postCard, 3, { label: 'Bỏ qua / Xem kết quả →', skip: true });

    if (!resultCard.querySelector('.petct-result-back')) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'petct-wizard-btn petct-result-back';
      back.textContent = '← Quay lại chỉnh sửa';
      back.addEventListener('click', function () { showStep(3, true); });
      const heading = resultCard.querySelector('h2');
      if (heading) heading.insertAdjacentElement('afterend', back);
    }

    root.querySelectorAll('input, select, textarea').forEach(function (element) {
      element.addEventListener('input', function () { clearError(element.id); });
      element.addEventListener('change', function () { clearError(element.id); });
    });

    root.querySelectorAll('button[onclick*="clearPatient"]').forEach(function (button) {
      button.addEventListener('click', function () {
        completed.clear();
        window.setTimeout(function () {
          timeMethod = 'manual';
          concentrationMethod = 'direct';
          updateTimeMethod();
          updateConcentrationMethod();
          updateMode();
          showStep(0, true);
        }, 0);
      });
    });

    showStep(0, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
