/*
 * Phân tích y lệnh dùng thuốc nội trú
 * - Tải ảnh y lệnh/bệnh án không giới hạn số lượng
 * - Gửi tới AI (Gemini/Claude) qua Apps Script proxy (apps-script/inpatient-order-review.gs)
 *   — proxy giữ API key server-side, client không bao giờ có key.
 * - Phạm vi phân tích: liều dùng, cách dùng, tốc độ truyền (không pha chế),
 *   tương tác thuốc trong y lệnh, cảnh báo + phương pháp hiệu chỉnh khi suy thận.
 * - Vì ảnh được gửi ra ngoài (khác các module OCR cục bộ khác của hệ thống),
 *   bắt buộc người dùng xác nhận đã che/xóa thông tin định danh bệnh nhân
 *   trước khi phân tích.
 */
(function inpatientOrderReviewModule(){
  'use strict';

  // Apps Script Web App đã triển khai cho Phân tích y lệnh nội trú.
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyeLZslT5IKRwePrRY3m-k2zlcFLJwsSjDh6etvbihNwQY9UqjgM3BPgN5hRJX9GAX7hg/exec';

  const MAX_IMAGE_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;

  const io$ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const state = {
    files: [],      // { id, file, thumbUrl, label }
    nextId: 1,
    result: null,
    sending: false
  };

  function fingerprint(file) {
    return `${file.type || 'image/*'}|${file.size}|${file.lastModified}`;
  }

  function onFilesSelected(fileList) {
    const incoming = [...(fileList || [])];
    if (!incoming.length) return;
    const images = incoming.filter(file => String(file.type || '').startsWith('image/'));
    const existing = new Set(state.files.map(entry => entry.fingerprint));
    const accepted = images.filter(file => !existing.has(fingerprint(file)));
    if (incoming.length > accepted.length) {
      alert('Một số tệp không phải ảnh hoặc đã được thêm trước đó nên bị bỏ qua.');
    }
    accepted.forEach(file => {
      const id = state.nextId++;
      const entry = { id, file, fingerprint: fingerprint(file), thumbUrl: URL.createObjectURL(file), label: '' };
      state.files.push(entry);
    });
    renumberFiles();
    renderFileQueue();
    updateAnalyzeButtonState();
  }

  function renumberFiles() {
    state.files.forEach((entry, index) => {
      entry.label = `Ảnh ${String(index + 1).padStart(2, '0')}`;
    });
  }

  function removeFile(id) {
    const idx = state.files.findIndex(entry => entry.id === id);
    if (idx === -1) return;
    URL.revokeObjectURL(state.files[idx].thumbUrl);
    state.files.splice(idx, 1);
    renumberFiles();
    renderFileQueue();
    updateAnalyzeButtonState();
  }

  function renderFileQueue() {
    const box = io$('#ioFileQueue');
    if (!box) return;
    if (!state.files.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML = state.files.map(entry => `
        <div class="io-file-chip">
          <img src="${entry.thumbUrl}" alt="" class="io-file-thumb">
          <span>${esc(entry.label)}</span>
          <button type="button" class="io-file-remove" data-remove="${entry.id}" aria-label="Bỏ ${esc(entry.label)}">✕</button>
        </div>
      `).join('');
    box.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = () => removeFile(Number(btn.dataset.remove));
    });
  }

  function updateAnalyzeButtonState() {
    const btn = io$('#ioAnalyzeBtn');
    if (!btn) return;
    const consent = io$('#ioConsent');
    btn.disabled = state.sending || !state.files.length || !(consent && consent.checked);
  }

  /** Resize ảnh về canvas để giảm dung lượng trước khi gửi, trả base64 JPEG thuần (không kèm data: prefix). */
  function fileToCompressedBase64(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Không đọc được ảnh.'));
      reader.onload = () => {
        img.onerror = () => reject(new Error('Ảnh lỗi hoặc không hỗ trợ.'));
        img.onload = () => {
          const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          resolve({ mimeType: 'image/jpeg', base64: dataUrl.split(',')[1] || '' });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function setBusy(isBusy) {
    state.sending = isBusy;

    // Giữ giao diện gọn nhưng phải có dấu hiệu rõ ràng để người dùng biết
    // yêu cầu đang được xử lý. Không dùng lại thanh trạng thái dài đã loại bỏ.
    const status = io$('#ioStatus');
    if (status) {
      status.hidden = true;
      status.textContent = '';
    }

    const btn = io$('#ioAnalyzeBtn');
    if (btn) {
      btn.classList.toggle('io-btn-busy', isBusy);
      btn.setAttribute('aria-busy', isBusy ? 'true' : 'false');
      btn.innerHTML = isBusy
        ? '<span class="io-spinner io-spinner-btn" aria-hidden="true"></span> Đang phân tích…'
        : '⌁ Phân tích y lệnh';
    }

    if (isBusy) {
      const resultBox = io$('#ioResultBody');
      if (resultBox) {
        resultBox.innerHTML = `
          <div class="io-analyzing-state" role="status" aria-live="polite">
            <span class="io-spinner io-spinner-result" aria-hidden="true"></span>
            <b>Đang phân tích y lệnh…</b>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>`;
      }
    }

    updateAnalyzeButtonState();
  }

  async function analyzeOrder() {
    if (!state.files.length || state.sending) return;
    const consent = io$('#ioConsent');
    if (!consent || !consent.checked) {
      alert('Vui lòng xác nhận đã che/xóa thông tin định danh bệnh nhân trước khi phân tích.');
      return;
    }
    if (!WEB_APP_URL) {
      renderError('Chưa cấu hình dịch vụ phân tích y lệnh.');
      return;
    }
    setBusy(true);
    try {
      const images = await Promise.all(state.files.map(entry => fileToCompressedBase64(entry.file)));
      setBusy(true);
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'analyzeInpatientOrder', images })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'AI không trả về kết quả hợp lệ.');
      state.result = data.result;
      renderResult(data.result);
    } catch (err) {
      renderError(err && err.message ? err.message : 'Không thể phân tích y lệnh. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  function severityMeta(severity) {
    const key = String(severity || '').toLowerCase();
    if (key.includes('chống chỉ định')) return { cls: 'io-sev-cc', label: 'Chống chỉ định' };
    if (key.includes('nghiêm trọng')) return { cls: 'io-sev-nt', label: 'Nghiêm trọng — cần theo dõi' };
    return { cls: 'io-sev-lu', label: 'Cần lưu ý' };
  }

  function renderDrugCard(drug) {
    const dose = drug.doseAssessment || {};
    const infusion = drug.infusionRate || {};
    const renal = drug.renalAdjustment || {};
    const statusKey = String(dose.status || '').toLowerCase();
    const doseCls = statusKey.includes('cao hơn') || statusKey.includes('thấp hơn') ? 'io-dose-warn'
      : statusKey.includes('không đủ') ? 'io-dose-unknown' : 'io-dose-ok';

    return `
      <div class="clinical-item io-drug-card">
        <b>${esc(drug.name || 'Thuốc chưa xác định')}</b>
        <p><strong>Y lệnh kê:</strong> ${esc(drug.orderedDose || '—')}${drug.route ? ` · ${esc(drug.route)}` : ''}</p>
        ${drug.usageNote ? `<p><strong>Cách dùng:</strong> ${esc(drug.usageNote)}</p>` : ''}
        <p class="${doseCls}"><strong>Đánh giá liều:</strong> ${esc(dose.status || 'không đủ dữ liệu để đánh giá')}${dose.detail ? ` — ${esc(dose.detail)}` : ''}</p>
        ${infusion.applicable ? `<p><strong>Tốc độ truyền:</strong> ${esc(infusion.rate || '—')}${infusion.basis ? `<br><small>${esc(infusion.basis)}</small>` : ''}</p>` : ''}
        ${dose.source ? `<small>Nguồn: ${esc(dose.source)}</small>` : ''}
        ${renal.applicable ? `
          <div class="renal-alert renal-moderate io-renal-inline">
            <div class="renal-alert-icon">⚠</div>
            <div>
              <span>Cần hiệu chỉnh theo chức năng thận</span>
              <p>${esc(renal.warning || '')}</p>
              ${renal.method ? `<small><strong>Phương pháp:</strong> ${esc(renal.method)}</small><br>` : ''}
              ${renal.source ? `<small>Nguồn: ${esc(renal.source)}</small>` : ''}
            </div>
          </div>` : ''}
      </div>`;
  }

  function renderInteraction(item) {
    const meta = severityMeta(item.severity);
    return `
      <div class="clinical-item io-interaction-card ${meta.cls}">
        <b>${esc((item.drugs || []).join(' + ') || 'Cặp thuốc')}</b>
        <span class="io-sev-badge ${meta.cls}">${esc(meta.label)}</span>
        ${item.mechanism ? `<p>${esc(item.mechanism)}</p>` : ''}
        ${item.recommendation ? `<p><strong>Xử trí:</strong> ${esc(item.recommendation)}</p>` : ''}
        ${item.source ? `<small>Nguồn: ${esc(item.source)}</small>` : ''}
      </div>`;
  }

  function renderResult(result) {
    const box = io$('#ioResultBody');
    if (!box) return;
    const renalCtx = (result.patientContext || {}).renalFunction || {};
    const drugs = result.drugs || [];
    const interactions = result.interactions || [];
    const unclear = result.unclear || [];

    let html = '';

    if (renalCtx.crclOrEgfr || renalCtx.creatinine) {
      html += `
        <div class="alert io-context-alert">
          <b>Chức năng thận đọc được từ bệnh án:</b>
          ${renalCtx.creatinine ? ` Creatinine ${esc(renalCtx.creatinine)}.` : ''}
          ${renalCtx.crclOrEgfr ? ` CrCl/eGFR ${esc(renalCtx.crclOrEgfr)}.` : ''}
          ${renalCtx.note ? `<br><small>${esc(renalCtx.note)}</small>` : ''}
        </div>`;
    }

    html += `<h3>Thuốc trong y lệnh (${drugs.length})</h3>`;
    html += drugs.length
      ? `<div class="clinical-stack">${drugs.map(renderDrugCard).join('')}</div>`
      : '<div class="empty-state"><b>Không đọc được thuốc nào</b><p>Kiểm tra lại ảnh hoặc xem mục "cần xác minh" bên dưới.</p></div>';

    html += `<h3>Tương tác thuốc trong y lệnh (${interactions.length})</h3>`;
    html += interactions.length
      ? `<div class="clinical-stack">${interactions.map(renderInteraction).join('')}</div>`
      : '<p class="io-no-interaction">Không phát hiện tương tác đáng chú ý giữa các thuốc trong y lệnh này.</p>';

    if (unclear.length) {
      html += `<h3>Cần dược sĩ xác minh thủ công</h3><ul class="clinical-list">${unclear.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
    }

    html += `<div class="alert io-disclaimer">${esc(result.disclaimer || 'Kết quả hỗ trợ tham khảo, không thay thế đánh giá lâm sàng trực tiếp.')}</div>`;

    box.innerHTML = html;
    io$('#ioResetBtn').disabled = false;
  }

  function renderError(message) {
    const box = io$('#ioResultBody');
    if (!box) return;
    box.innerHTML = `<div class="empty-state"><b>Không thể phân tích</b><p>${esc(message)}</p></div>`;
  }

  function resetOrder() {
    state.files.forEach(entry => URL.revokeObjectURL(entry.thumbUrl));
    state.files = [];
    state.nextId = 1;
    state.result = null;
    const input = io$('#ioUploadInput');
    if (input) input.value = '';
    const consent = io$('#ioConsent');
    if (consent) consent.checked = false;
    renderFileQueue();
    io$('#ioResultBody').innerHTML = '<div class="empty-state"><b>Sẵn sàng nhận ảnh y lệnh</b><p>Tải ảnh y lệnh/bệnh án của cùng một bệnh nhân, cùng một đợt y lệnh. Không giới hạn số lượng ảnh.</p></div>';
    io$('#ioResetBtn').disabled = true;
    updateAnalyzeButtonState();
  }

  function bind() {
    const input = io$('#ioUploadInput');
    if (!input) return; // view chưa được nhúng trên trang này
    input.addEventListener('change', e => onFilesSelected(e.target.files));

    const zone = io$('#ioUploadZone');
    if (zone) {
      ['dragover', 'dragenter'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.add('io-drag-over'); }));
      ['dragleave', 'drop'].forEach(evt => zone.addEventListener(evt, e => { e.preventDefault(); zone.classList.remove('io-drag-over'); }));
      zone.addEventListener('drop', e => onFilesSelected(e.dataTransfer && e.dataTransfer.files));
    }

    const consent = io$('#ioConsent');
    if (consent) consent.addEventListener('change', updateAnalyzeButtonState);

    const analyzeBtn = io$('#ioAnalyzeBtn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeOrder);

    const resetBtn = io$('#ioResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetOrder);

    updateAnalyzeButtonState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Xuất hàm thuần phục vụ test không cần DOM/network.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { severityMeta };
  } else {
    window.__inpatientOrderReviewTestHooks = { severityMeta };
  }
})();
