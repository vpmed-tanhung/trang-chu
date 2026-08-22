(function exposePrescriptionResultModel(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VPMED_PRESCRIPTION_RESULT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPrescriptionResultModel() {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function classifyIcdIssue(item = {}) {
    const related = Boolean(item.related || item.isSuboptimal);
    if (related) {
      return {
        key: 'suboptimal',
        tone: 'warning',
        title: 'MÃ BỆNH CHƯA PHÙ HỢP / CẦN ĐỐI CHIẾU',
        status: 'Mã bệnh chưa thật sự phù hợp',
        eyebrow: 'Mã bệnh chưa thật sự phù hợp',
        explanation: 'Đã có chẩn đoán liên quan nhưng mã hiện tại chưa khớp chỉ định đã đối chiếu.'
      };
    }
    return {
      key: 'missing',
      tone: 'danger',
      title: 'THIẾU MÃ BỆNH',
      status: 'Thiếu mã bệnh',
      eyebrow: 'Thiếu mã bệnh BHYT',
      explanation: 'Thiếu mã bệnh.'
    };
  }

  function buildResultSummaryHtml({interactions = 0, icdIssues = 0, checked = 0} = {}) {
    return `<div><b>${Number(interactions) || 0}</b><span>Tương tác</span></div>` +
      `<div><b>${Number(icdIssues) || 0}</b><span>Mã bệnh</span></div>` +
      `<div><b>${Number(checked) || 0}</b><span>Đã đối chiếu</span></div>`;
  }

  function buildMissingIcdHtml(item = {}, options = {}) {
    const issue = classifyIcdIssue(item);
    const labelIcd = typeof options.icdLabel === 'function' ? options.icdLabel : (value) => String(value ?? '');
    const drug = item.drug || {};
    const drugName = drug.name || drug.rawName || 'Thuốc BHYT';
    const mappings = Array.isArray(item.mappings) ? item.mappings : [];
    const allowed = Array.isArray(item.allowed) ? item.allowed : [];
    const terms = mappings.map((mapping) => {
      const labels = (mapping.codes || []).map(labelIcd).join(', ');
      return `${mapping.term}: ${labels}`;
    }).join(' · ');
    const suggestion = terms || allowed.map(labelIcd).join(', ');
    const message = issue.key === 'missing'
      ? `${drugName}: ${issue.status}`
      : `${drugName}: Mã bệnh hiện có chưa phù hợp, cần đối chiếu HDSD/phác đồ điều trị`;
    return `<article class="rx-alert rx-alert-${issue.tone} rx-alert-missing-icd" data-icd-status="${issue.key}">` +
      `<div class="rx-alert-header"><span class="rx-alert-icon">ICD</span><div><small>${issue.title}</small><h3>${escapeHtml(message)}</h3></div></div>` +
      `<dl><div><dt>Gợi ý</dt><dd>${escapeHtml(suggestion)}</dd></div></dl></article>`;
  }

  function buildInpatientBhytHtml(item = {}) {
    const issue = classifyIcdIssue(item);
    const drugName = item.drug?.name || item.drug?.rawName || 'Thuốc BHYT';
    return `<article class="rx-alert rx-alert-warning" data-icd-status="${issue.key}">` +
      `<div class="rx-alert-header"><span class="rx-alert-icon">BHYT</span><div><h3>${escapeHtml(drugName)}: ${issue.status}</h3></div></div>` +
      `<p>• <b>Xuất toán BHYT:</b> ${issue.explanation}</p>` +
      '<p>• <b>Xử trí:</b> Kiểm tra chẩn đoán, hồ sơ bệnh án và điều kiện thanh toán hiện hành.</p></article>';
  }

  return Object.freeze({
    classifyIcdIssue,
    buildResultSummaryHtml,
    buildMissingIcdHtml,
    buildInpatientBhytHtml
  });
});

