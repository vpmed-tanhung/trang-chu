/*
 * Phân tích y lệnh dùng thuốc nội trú
 * - Tải ảnh y lệnh/bệnh án không giới hạn số lượng
 * - Gửi tới Gemini qua Apps Script proxy (apps-script/inpatient-order-review.gs)
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
  const UMOL_PER_MG_DL = 88.4;
  const RENAL_MODE_LABELS = {
    unknown: 'chưa xác định',
    stable: 'creatinine tương đối ổn định',
    aki: 'AKI / creatinine đang thay đổi',
    hd: 'lọc máu ngắt quãng (IHD)',
    crrt: 'lọc máu liên tục (CRRT)'
  };


  const io$ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));


  function positiveNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function calcBsaMosteller(heightCm, weightKg) {
    return heightCm && weightKg ? Math.sqrt((heightCm * weightKg) / 3600) : null;
  }

  function calcEgfr2021(ageYears, scrMgDl, sex) {
    if (!ageYears || !scrMgDl || !['m', 'f'].includes(sex)) return null;
    const female = sex === 'f';
    const k = female ? 0.7 : 0.9;
    const alpha = female ? -0.241 : -0.302;
    const ratio = scrMgDl / k;
    return 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.2)
      * Math.pow(0.9938, ageYears) * (female ? 1.012 : 1);
  }

  function calcIbwDevine(heightCm, sex) {
    if (!heightCm || !['m', 'f'].includes(sex) || heightCm < 152.4) return null;
    return (sex === 'f' ? 45.5 : 50) + 2.3 * ((heightCm / 2.54) - 60);
  }

  /**
   * Đánh giá thận thuần, không phụ thuộc DOM.
   * - CrCl Cockcroft–Gault dùng cân nặng thực; khi >120% IBW và có chiều cao,
   *   dùng AdjBW = IBW + 0,4 × (ABW - IBW) và ghi rõ phương pháp.
   * - eGFR CKD-EPI 2021 được hiển thị cả dạng chuẩn hóa và không chuẩn hóa BSA.
   * - Không cấp doseCrcl khi AKI/không rõ trạng thái/đang RRT để tránh chọn
   *   nhầm một dải liều tĩnh từ creatinine không ở trạng thái ổn định.
   */
  function calculateRenalAssessment(input) {
    const values = input || {};
    const mode = Object.prototype.hasOwnProperty.call(RENAL_MODE_LABELS, values.mode) ? values.mode : 'unknown';
    const ageYears = positiveNumber(values.ageYears);
    const weightKg = positiveNumber(values.weightKg);
    const heightCm = positiveNumber(values.heightCm);
    const scrValue = positiveNumber(values.scrValue);
    const sex = ['m', 'f'].includes(values.sex) ? values.sex : '';
    const scrUnit = values.scrUnit === 'mgdl' ? 'mgdl' : 'umol';
    const warnings = [];
    const errors = [];

    if (ageYears !== null && (ageYears < 18 || ageYears > 120)) errors.push('Tuổi phải trong khoảng 18–120.');
    if (weightKg !== null && (weightKg < 20 || weightKg > 300)) errors.push('Cân nặng phải trong khoảng 20–300 kg.');
    if (heightCm !== null && (heightCm < 100 || heightCm > 250)) errors.push('Chiều cao phải trong khoảng 100–250 cm.');

    const scrMgDl = scrValue === null ? null : (scrUnit === 'umol' ? scrValue / UMOL_PER_MG_DL : scrValue);
    if (scrMgDl !== null && (scrMgDl < 0.1 || scrMgDl > 20)) errors.push('Creatinine nằm ngoài khoảng kiểm tra 0,1–20 mg/dL.');

    let ibwKg = null;
    let adjustedWeightKg = null;
    let dosingWeightKg = weightKg;
    let weightMethod = weightKg ? 'cân nặng thực' : '';
    let bmi = null;
    if (heightCm && weightKg) bmi = weightKg / Math.pow(heightCm / 100, 2);
    if (heightCm && weightKg && sex) {
      ibwKg = calcIbwDevine(heightCm, sex);
      if (ibwKg && weightKg > 1.2 * ibwKg) {
        adjustedWeightKg = ibwKg + 0.4 * (weightKg - ibwKg);
        dosingWeightKg = adjustedWeightKg;
        weightMethod = 'cân nặng hiệu chỉnh AdjBW (ABW >120% IBW)';
        warnings.push('Béo phì/cân nặng >120% IBW: CrCl phụ thuộc quy ước cân nặng; cần đối chiếu quy trình của bệnh viện và HDSD thuốc.');
      }
    }

    const hasCgInputs = ageYears && weightKg && sex && scrMgDl && !errors.length;
    let calculatedCrcl = null;
    if (hasCgInputs) {
      calculatedCrcl = ((140 - ageYears) * dosingWeightKg) / (72 * scrMgDl);
      if (sex === 'f') calculatedCrcl *= 0.85;
      calculatedCrcl = Math.max(0, calculatedCrcl);
    }

    const egfr = (!errors.length && ageYears && sex && scrMgDl) ? calcEgfr2021(ageYears, scrMgDl, sex) : null;
    const bsa = calcBsaMosteller(heightCm, weightKg);
    const egfrAbsolute = egfr && bsa ? egfr * bsa / 1.73 : null;

    let doseCrcl = null;
    let doseBasis = '';
    if (mode === 'stable' && !errors.length && calculatedCrcl !== null) {
      doseCrcl = calculatedCrcl;
      doseBasis = `CrCl Cockcroft–Gault, ${weightMethod}`;
    }

    if (mode === 'unknown' && calculatedCrcl !== null) {
      warnings.push('Chưa xác nhận creatinine ổn định nên chưa tự chọn dải liều theo CrCl.');
    }
    if (mode === 'aki') {
      warnings.push('AKI/creatinine biến động: Cockcroft–Gault và CKD-EPI giả định trạng thái ổn định; phải xem xu hướng SCr, nước tiểu, mức thuốc/TDM và đánh giá lại liều liên tiếp.');
    }
    if (mode === 'hd') warnings.push('IHD: dùng phác đồ theo lịch lọc, loại màng lọc và thời điểm dùng thuốc; không chọn liều chỉ từ CrCl.');
    if (mode === 'crrt') warnings.push('CRRT: liều phụ thuộc phương thức và cường độ lọc/effluent, chức năng thận tồn dư, mức độ bệnh và TDM; không chọn liều chỉ từ CrCl.');
    if (scrValue !== null && !hasCgInputs && !errors.length && !['hd', 'crrt'].includes(mode)) {
      warnings.push('Thiếu tuổi, giới tính sinh học hoặc cân nặng nên chưa tính được CrCl Cockcroft–Gault.');
    }
    if (bmi !== null && (bmi < 18.5 || bmi >= 30)) {
      warnings.push('Thể trạng ngoài khoảng thông thường có thể làm ước tính từ creatinine kém chính xác; cân nhắc eGFR creatinine–cystatin C/mGFR với thuốc khoảng điều trị hẹp.');
    }

    return {
      mode,
      modeLabel: RENAL_MODE_LABELS[mode],
      ageYears,
      sex,
      weightKg,
      heightCm,
      bmi,
      scrValue,
      scrUnit,
      scrMgDl,
      calculatedCrcl,
      doseCrcl,
      doseBasis,
      egfr,
      egfrAbsolute,
      bsa,
      ibwKg,
      adjustedWeightKg,
      dosingWeightKg,
      weightMethod,
      canApplyDoseBand: mode === 'stable' && doseCrcl !== null && !errors.length,
      warnings: [...new Set(warnings)],
      errors: [...new Set(errors)]
    };
  }

  function renalPriorityMeta(assessment) {
    if (!assessment) return { cls: 'io-renal-priority-pending', label: 'Chưa đủ dữ liệu để phân tầng' };
    if (['aki', 'hd', 'crrt'].includes(assessment.mode) || (assessment.doseCrcl !== null && assessment.doseCrcl < 30)) {
      return { cls: 'io-renal-priority-now', label: 'Ưu tiên rà soát ngay' };
    }
    if (assessment.doseCrcl !== null && assessment.doseCrcl < 60) {
      return { cls: 'io-renal-priority-shift', label: 'Ưu tiên trong ca trực' };
    }
    if (assessment.canApplyDoseBand) return { cls: 'io-renal-priority-routine', label: 'Đã có mức lọc để đối chiếu' };
    return { cls: 'io-renal-priority-pending', label: 'Chưa đủ dữ liệu để chọn mức liều' };
  }

  function buildRenalNote(assessment) {
    if (!assessment) return '';
    const hasData = assessment.mode !== 'unknown' || assessment.scrValue !== null
      || assessment.ageYears !== null || assessment.weightKg !== null;
    if (!hasData) return '';
    const parts = [`Dữ liệu thận do dược sĩ nhập — tình trạng: ${assessment.modeLabel}.`];
    if (assessment.ageYears) parts.push(`Tuổi ${assessment.ageYears}.`);
    if (assessment.sex) parts.push(`Giới tính sinh học ${assessment.sex === 'f' ? 'nữ' : 'nam'}.`);
    if (assessment.weightKg) parts.push(`Cân nặng ${assessment.weightKg} kg${assessment.heightCm ? `, chiều cao ${assessment.heightCm} cm` : ''}.`);
    if (assessment.scrValue !== null) parts.push(`SCr ${assessment.scrValue} ${assessment.scrUnit === 'umol' ? 'µmol/L' : 'mg/dL'}.`);
    if (assessment.calculatedCrcl !== null) parts.push(`CrCl Cockcroft–Gault kiểm chứng ${assessment.calculatedCrcl.toFixed(1)} mL/phút (${assessment.weightMethod}).`);
    if (assessment.egfr !== null) parts.push(`eGFR CKD-EPI 2021 ${assessment.egfr.toFixed(1)} mL/phút/1,73m²${assessment.egfrAbsolute !== null ? `; không chuẩn hóa BSA ${assessment.egfrAbsolute.toFixed(1)} mL/phút` : ''}.`);
    if (!assessment.canApplyDoseBand) parts.push('Không tự chọn dải liều cố định từ CrCl ở trạng thái hiện tại; cần nêu dữ liệu còn thiếu và cách định liều/giám sát phù hợp.');
    if (assessment.warnings.length) parts.push(`Cảnh báo kiểm chứng: ${assessment.warnings.join(' ')}`);
    return parts.join(' ');
  }

  function getDrugIdentityApi() {
    return typeof window !== 'undefined' ? window.VPMED_INPATIENT_IDENTITY : null;
  }

  /**
   * Tạo danh mục đã xác minh dùng cho yêu cầu AI.
   *
   * Hàm này là điểm vào ổn định của module y lệnh (và của bộ kiểm thử). Mọi
   * dữ liệu vẫn được lấy từ module đối chiếu danh mục; tuyệt đối không tạo ánh
   * xạ biệt dược/hoạt chất bằng suy đoán tại đây.
   */
  function buildVerifiedDrugCatalog() {
    const identityApi = getDrugIdentityApi();
    if (identityApi && typeof identityApi.getCatalogForAi === 'function') {
      const catalog = identityApi.getCatalogForAi();
      if (Array.isArray(catalog) && catalog.length) return catalog;
    }

    // Nhánh dự phòng chỉ chuyển đổi nguyên văn danh mục chính thức đã nạp.
    // Không tra gần đúng và không tự bổ sung hoạt chất từ tên biệt dược.
    const inpatientRows = typeof window !== 'undefined' && Array.isArray(window.VPMED_INPATIENT_MEDICINES_20260707)
      ? window.VPMED_INPATIENT_MEDICINES_20260707 : [];
    const verifiedRows = inpatientRows.length
      ? inpatientRows
      : (typeof window !== 'undefined' && Array.isArray(window.VPMED_DRUGS) ? window.VPMED_DRUGS : []);
    const seen = new Set();
    return verifiedRows.map((row, index) => ({
      catalogId: String(row.code || row.regNumber || row.id || `inventory-${index + 1}`),
      brand: String(row.name || row.brand || ''),
      active: String(row.active || row.activeIngredient || ''),
      activeIngredient: String(row.activeIngredient || row.active || ''),
      strength: String(row.strength || row.concentration || ''),
      route: String(row.route || row.routeBHYT || ''),
      registrationNumber: String(row.regNumber || '')
    })).filter(entry => {
      if (!entry.brand || !entry.activeIngredient || seen.has(entry.catalogId)) return false;
      seen.add(entry.catalogId);
      return true;
    });
  }

  function normalizeVerifiedText(value) {
    return String(value ?? '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeVerifiedBrand(value) {
    return normalizeVerifiedText(String(value ?? '').split('(')[0])
      .replace(/\b(?:ttkn|syt|dv|bhyt)\s*\d+\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeVerifiedActive(value) {
    return normalizeVerifiedText(value)
      .replace(/\bampicillin\b/g, 'ampicilin')
      .replace(/\bsulbactam sodium\b/g, 'sulbactam')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function verifiedActiveEquivalent(left, right) {
    const identityApi = getDrugIdentityApi();
    if (identityApi && typeof identityApi.activeEquivalent === 'function') {
      return identityApi.activeEquivalent(left, right);
    }
    return Boolean(left && right) && normalizeVerifiedActive(left) === normalizeVerifiedActive(right);
  }

  function findVerifiedCatalogEntry(rawName, catalog) {
    const normalizedName = normalizeVerifiedBrand(rawName);
    if (normalizedName.length < 4) return null;
    const exact = (Array.isArray(catalog) ? catalog : []).filter(entry =>
      normalizeVerifiedBrand(entry.brand) === normalizedName
    );
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) {
      const firstActive = exact[0].active || exact[0].activeIngredient;
      const firstStrength = normalizeVerifiedText(exact[0].strength);
      return exact.every(entry =>
        verifiedActiveEquivalent(entry.active || entry.activeIngredient, firstActive)
        && normalizeVerifiedText(entry.strength) === firstStrength
      ) ? exact[0] : null;
    }
    return null;
  }

  function extractDeclaredDrugActive(drug) {
    const declared = drug?.activeIngredient || drug?.active || drug?.genericName || drug?.identity?.activeIngredient;
    if (declared) return String(declared);
    const match = String(drug?.name || '').match(/\(([^)]+)\)/);
    return match && /[A-Za-zÀ-ỹ]/.test(match[1]) ? match[1] : '';
  }

  function buildVerifiedDrugCatalogNote(catalog) {
    const lines = (Array.isArray(catalog) ? catalog : [])
      .filter(entry => entry && entry.brand && (entry.active || entry.activeIngredient))
      .map(entry => `${entry.brand} => HOẠT CHẤT: ${entry.active || entry.activeIngredient}${entry.strength ? `; HÀM LƯỢNG: ${entry.strength}` : ''}`);
    return ['DANH MỤC THUỐC NỘI BỘ ĐÃ XÁC MINH', ...lines].join('\n');
  }

  function applyVerifiedCatalogGuard(result, catalog) {
    const guardedResult = result && typeof result === 'object' ? result : {};
    guardedResult.drugs = Array.isArray(guardedResult.drugs) ? guardedResult.drugs : [];
    const conflicts = [];

    guardedResult.drugs.forEach((drug, index) => {
      if (!drug || typeof drug !== 'object') return;
      const rawName = String(drug?.identity?.rawName || drug.brand || drug.tradeName || drug.name || '').trim();
      const entry = findVerifiedCatalogEntry(rawName, catalog);
      const declaredActive = extractDeclaredDrugActive(drug);
      const declaredBrand = String(drug?.identity?.brand || drug.tradeName || drug.brand || rawName).trim();
      if (!entry) {
        drug.identity = {
          ...(drug.identity || {}),
          rawName,
          status: String(drug?.identity?.status || (rawName ? 'exact' : 'unreadable')),
          catalogStatus: Array.isArray(catalog) && catalog.length ? 'not_found' : 'unavailable',
          catalogId: '',
          brand: declaredBrand,
          activeIngredient: declaredActive,
          strength: String(drug?.identity?.strength || drug.strength || ''),
          route: String(drug?.identity?.route || drug.route || ''),
          registrationNumber: String(drug?.identity?.registrationNumber || '')
        };
        return;
      }

      const verifiedActive = String(entry.active || entry.activeIngredient || '');
      if (declaredActive && !verifiedActiveEquivalent(declaredActive, verifiedActive)) {
        conflicts.push({ index, rawName, declaredActive, verifiedActive, catalogEntry: entry });
        drug.identity = {
          ...(drug.identity || {}),
          rawName,
          status: String(drug?.identity?.status || 'exact'),
          catalogStatus: 'conflict',
          catalogId: '',
          brand: declaredBrand,
          activeIngredient: declaredActive,
          catalogReference: {
            catalogId: String(entry.catalogId || ''), brand: entry.brand,
            activeIngredient: verifiedActive, strength: String(entry.strength || ''),
            route: String(entry.route || ''), registrationNumber: String(entry.registrationNumber || '')
          }
        };
        return;
      }

      drug.brand = drug.brand || declaredBrand;
      drug.activeIngredient = drug.activeIngredient || declaredActive;
      drug.identity = {
        ...(drug.identity || {}),
        rawName,
        status: String(drug?.identity?.status || 'exact'),
        catalogStatus: 'matched',
        catalogId: String(entry.catalogId || ''),
        brand: declaredBrand,
        activeIngredient: declaredActive,
        strength: String(drug?.identity?.strength || drug.strength || ''),
        route: String(drug?.identity?.route || drug.route || ''),
        registrationNumber: String(drug?.identity?.registrationNumber || ''),
        catalogReference: {
          catalogId: String(entry.catalogId || ''), brand: entry.brand,
          activeIngredient: verifiedActive, strength: String(entry.strength || ''),
          route: String(entry.route || ''), registrationNumber: String(entry.registrationNumber || '')
        }
      };
    });

    return { result: guardedResult, conflicts };
  }

  function annotateIdentityConflicts(result, conflicts) {
    const reviewedResult = result && typeof result === 'object' ? result : {};
    reviewedResult.drugs = Array.isArray(reviewedResult.drugs) ? reviewedResult.drugs : [];
    reviewedResult.unclear = Array.isArray(reviewedResult.unclear) ? reviewedResult.unclear : [];
    (Array.isArray(conflicts) ? conflicts : []).forEach(conflict => {
      const drug = reviewedResult.drugs[conflict.index];
      if (!drug) return;
      reviewedResult.unclear.push(`Cần đối chiếu thuốc "${conflict.rawName}": AI nhận hoạt chất "${conflict.declaredActive}" nhưng danh mục nội bộ ghi "${conflict.verifiedActive}". Kết quả AI không bị khóa.`);
    });
    reviewedResult.unclear = [...new Set(reviewedResult.unclear.filter(Boolean))];
    return reviewedResult;
  }

  const state = {
    files: [],      // { id, file, thumbUrl, label }
    nextId: 1,
    result: null,
    renalAssessment: null,
    sending: false,
    autoAnalyzeTimer: null,
    autoAnalyzePending: false
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
    scheduleAutoAnalyze();
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


  function canAutoAnalyze() {
    const consent = io$('#ioConsent');
    return Boolean(state.files.length && consent && consent.checked);
  }

  function scheduleAutoAnalyze(delayMs = 220) {
    if (!canAutoAnalyze()) return;
    if (state.autoAnalyzeTimer) window.clearTimeout(state.autoAnalyzeTimer);
    if (state.sending) {
      state.autoAnalyzePending = true;
      return;
    }
    state.autoAnalyzePending = false;
    state.autoAnalyzeTimer = window.setTimeout(() => {
      state.autoAnalyzeTimer = null;
      analyzeOrder({ source: 'auto' });
    }, delayMs);
  }

  function firstText(...values) {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
    return '';
  }

  function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function parseOrderLine(value) {
    const orderedDose = firstText(value).replace(/^\s*(?:[-*•▪◦]+|\d+\s*[.)\-:])\s*/, '').trim();
    if (!orderedDose) return { rawName: '', orderedDose: '', strength: '' };
    const strengthMatch = orderedDose.match(/\b\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ug|ml|mL|l|iu|ui|đv|%)\b(?:\s*\/\s*\d*(?:[.,]\d+)?\s*(?:ml|mL|l))?/i);
    const quantityMatch = orderedDose.match(/\b\d+(?:[.,]\d+)?\s*(?:viên|vien|ống|ong|lọ|lo|gói|goi|chai|túi|tui|bơm)\b/i);
    const routeMatch = orderedDose.match(/\s+(?=(?:uống|tiêm|truyền|ngậm|bôi|đặt|xịt|nhỏ|khí\s*dung)\b)/i);
    const cutAt = [strengthMatch?.index, quantityMatch?.index, routeMatch?.index]
      .filter(index => Number.isInteger(index) && index > 1)
      .sort((left, right) => left - right)[0];
    return {
      rawName: (cutAt ? orderedDose.slice(0, cutAt) : orderedDose).trim(),
      orderedDose,
      strength: strengthMatch?.[0]?.trim() || ''
    };
  }

  function normalizeDrugRecord(item) {
    const source = typeof item === 'string' ? { orderedText: item } : asObject(item);
    const identitySource = asObject(source.identity ?? source.drugIdentity ?? source.drug_identity);
    const orderSource = asObject(source.order);
    const orderText = firstText(
      source.orderedDose, source.ordered_dose, source.orderedText, source.ordered_text,
      source.orderText, source.order_text, source.order, orderSource.text,
      source.dosage, source.dose, source.instruction, source.instructions
    );
    const parsedLine = parseOrderLine(orderText);
    const rawName = firstText(
      identitySource.rawName, identitySource.raw_name, source.rawName, source.raw_name,
      source.drugName, source.drug_name, source.name, source.drug,
      source.medicine, source.medication, source.tradeName, source.trade_name,
      source.brand, parsedLine.rawName
    );
    const brand = firstText(
      identitySource.brand, identitySource.tradeName, identitySource.trade_name,
      source.tradeName, source.trade_name, source.brand, rawName
    );
    const activeIngredient = firstText(
      identitySource.activeIngredient, identitySource.active_ingredient,
      source.activeIngredient, source.active_ingredient,
      source.genericName, source.generic_name, source.active
    );
    const route = firstText(
      source.route, source.administrationRoute, source.administration_route,
      identitySource.route, orderSource.route
    );
    const doseInput = source.doseAssessment ?? source.dose_assessment
      ?? source.doseEvaluation ?? source.dose_evaluation;
    const doseBlock = asObject(doseInput);
    const infusionInput = source.infusionRate ?? source.infusion_rate;
    const infusionBlock = asObject(infusionInput);
    const renalInput = source.renalAdjustment ?? source.renal_adjustment;
    const renalBlock = asObject(renalInput);
    const infusionRate = firstText(infusionBlock.rate, source.infusionRateText, source.infusion_rate_text);

    return {
      ...source,
      name: firstText(source.name, source.drugName, source.drug_name, brand, rawName),
      identity: {
        ...identitySource,
        rawName,
        status: firstText(identitySource.status, rawName ? 'not_found' : 'unreadable'),
        catalogId: firstText(identitySource.catalogId, identitySource.catalog_id),
        brand,
        activeIngredient,
        strength: firstText(identitySource.strength, source.strength, parsedLine.strength),
        route: firstText(identitySource.route, route),
        registrationNumber: firstText(identitySource.registrationNumber, identitySource.registration_number)
      },
      orderedDose: firstText(orderText, parsedLine.orderedDose),
      route,
      usageNote: firstText(
        source.usageNote, source.usage_note, source.instructions,
        source.instruction, source.directions, orderSource.usageNote, orderSource.usage_note
      ),
      doseAssessment: {
        ...doseBlock,
        status: firstText(doseBlock.status, doseBlock.result, typeof doseInput === 'string' ? doseInput : '', source.doseStatus, source.dose_status),
        detail: firstText(doseBlock.detail, doseBlock.reason, doseBlock.note),
        source: firstText(doseBlock.source, doseBlock.reference)
      },
      infusionRate: {
        ...infusionBlock,
        applicable: typeof infusionBlock.applicable === 'boolean' ? infusionBlock.applicable : Boolean(infusionRate),
        rate: infusionRate,
        basis: firstText(infusionBlock.basis, infusionBlock.detail, infusionBlock.source)
      },
      renalAdjustment: {
        ...renalBlock,
        applicable: typeof renalBlock.applicable === 'boolean'
          ? renalBlock.applicable
          : Boolean(firstText(renalBlock.warning, renalBlock.method, renalBlock.suggestedRegimen, renalBlock.suggested_regimen)),
        warning: firstText(renalBlock.warning, renalBlock.note),
        method: firstText(renalBlock.method, renalBlock.basis),
        suggestedRegimen: firstText(renalBlock.suggestedRegimen, renalBlock.suggested_regimen),
        loadingDoseNote: firstText(renalBlock.loadingDoseNote, renalBlock.loading_dose_note),
        monitoring: firstText(renalBlock.monitoring, renalBlock.followUp, renalBlock.follow_up),
        source: firstText(renalBlock.source, renalBlock.reference)
      }
    };
  }

  function normalizeServerResult(result) {
    const safe = asObject(result);
    const drugContainer = safe.drugs ?? safe.medications ?? safe.medicines ?? safe.items ?? [];
    const rows = Array.isArray(drugContainer)
      ? drugContainer
      : Object.values(asObject(drugContainer));
    return {
      ...safe,
      patientContext: asObject(safe.patientContext ?? safe.patient_context),
      drugs: rows.map(normalizeDrugRecord),
      interactions: Array.isArray(safe.interactions) ? safe.interactions : [],
      unclear: Array.isArray(safe.unclear) ? safe.unclear : []
    };
  }

  function reconcileServerResult(result, catalog) {
    const normalizedResult = normalizeServerResult(result);
    const identityApi = getDrugIdentityApi();
    if (identityApi && typeof identityApi.reconcileResult === 'function') {
      try {
        return identityApi.reconcileResult(normalizedResult);
      } catch (error) {
        console.warn('[VPMED] Đối chiếu identity module lỗi, chuyển sang guard cục bộ:', error);
      }
    }

    const guarded = applyVerifiedCatalogGuard(normalizedResult, catalog);
    return annotateIdentityConflicts(guarded.result, guarded.conflicts);
  }

  function readRenalInputs() {
    return {
      mode: io$('#ioRenalStatus')?.value || 'unknown',
      ageYears: io$('#ioAge')?.value || '',
      sex: io$('#ioSex')?.value || '',
      weightKg: io$('#ioWeight')?.value || '',
      heightCm: io$('#ioHeight')?.value || '',
      scrValue: io$('#ioScr')?.value || '',
      scrUnit: io$('#ioScrUnit')?.value || 'umol'
    };
  }

  function renalAssessmentHtml(assessment) {
    const hasData = assessment.mode !== 'unknown' || assessment.scrValue !== null
      || assessment.ageYears !== null || assessment.weightKg !== null || assessment.sex;
    if (!hasData) {
      return '';
    }
    const priority = renalPriorityMeta(assessment);
    const metrics = [];
    if (assessment.calculatedCrcl !== null) {
      metrics.push(`<div><span>CrCl Cockcroft–Gault</span><b>${assessment.calculatedCrcl.toFixed(1)} mL/phút</b><small>${esc(assessment.weightMethod)}</small></div>`);
    }
    if (assessment.egfr !== null) {
      metrics.push(`<div><span>eGFR CKD-EPI 2021</span><b>${assessment.egfr.toFixed(1)} mL/phút/1,73m²</b>${assessment.egfrAbsolute !== null ? `<small>Không chuẩn hóa BSA: ${assessment.egfrAbsolute.toFixed(1)} mL/phút</small>` : '<small>Thêm chiều cao để quy đổi BSA</small>'}</div>`);
    }
    const errors = assessment.errors.length
      ? `<ul class="io-renal-errors">${assessment.errors.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
    const warnings = assessment.warnings.length
      ? `<ul class="io-renal-warnings">${assessment.warnings.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
    const basis = assessment.canApplyDoseBand
      ? `<p class="io-dose-band-ready"><strong>Dùng để chọn dải liều:</strong> ${assessment.doseCrcl.toFixed(1)} mL/phút — ${esc(assessment.doseBasis)}.</p>`
      : '<p class="io-dose-band-blocked"><strong>Chưa tự chọn dải liều cố định.</strong> Xem cảnh báo và xác minh dữ liệu trước khi áp dụng.</p>';
    return `
      <div class="io-renal-result-head"><b>${esc(assessment.modeLabel)}</b><span class="${priority.cls}">${esc(priority.label)}</span></div>
      ${metrics.length ? `<div class="io-renal-metrics">${metrics.join('')}</div>` : ''}
      ${basis}${errors}${warnings}`;
  }

  function refreshRenalAssessment() {
    const box = io$('#ioRenalCalcResult');
    if (!box) return null;
    state.renalAssessment = calculateRenalAssessment(readRenalInputs());
    box.innerHTML = renalAssessmentHtml(state.renalAssessment);
    return state.renalAssessment;
  }

  function getLocalRenalRecommendation(drug, assessment) {
    if (!assessment || assessment.errors.length || assessment.mode === 'unknown') return null;
    const getter = typeof window !== 'undefined' && typeof window.VPMED_GET_RENAL_DOSE === 'function'
      ? window.VPMED_GET_RENAL_DOSE : null;
    if (!getter) return null;
    const candidates = [drug.name, drug.genericName, drug.activeIngredient].filter(Boolean);
    let rule = null;
    for (const candidate of candidates) {
      rule = getter(candidate, assessment.doseCrcl ?? assessment.calculatedCrcl ?? 0, drug.route || '');
      if (rule) break;
    }
    if (!rule) return null;
    const source = rule.hit?.source || rule.verified || 'Cơ sở dữ liệu chỉnh liều thận của hệ thống';
    const normalizedName = candidates.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalizedName.includes('vancomycin')) {
      return {
        kind: 'tdm',
        title: 'Vancomycin — không chốt bằng dải CrCl cố định',
        text: 'Dùng module Vancomycin chuyên biệt và TDM/AUC; tách liều nạp khỏi liều duy trì, đánh giá lại theo nồng độ và diễn biến chức năng thận.',
        source: 'Quy trình TDM/AUC của bệnh viện và HDSD đúng chế phẩm'
      };
    }
    if (normalizedName.includes('amikacin') || normalizedName.includes('gentamicin') || normalizedName.includes('tobramycin')) {
      return {
        kind: 'tdm',
        title: 'Aminoglycoside — cần phác đồ theo chỉ định và TDM',
        text: 'Không chốt liều chỉ từ một dải CrCl; xác định cân nặng tính liều, mục tiêu điều trị, khoảng cách liều và nồng độ đỉnh/đáy theo quy trình bệnh viện.',
        source: 'Quy trình TDM của bệnh viện và HDSD đúng chế phẩm'
      };
    }
    if (normalizedName.includes('colistin')) {
      return {
        kind: 'tdm',
        title: 'Colistin/CMS — dùng module chuyên biệt',
        text: 'Xác nhận đơn vị MIU, mg CBA hay mg CMS của đúng chế phẩm; dùng công cụ Colistin riêng cho liều nạp, duy trì, IHD/SLED/CRRT và theo dõi độc tính.',
        source: 'Cơ sở dữ liệu Colistin chuyên biệt của hệ thống và HDSD đúng chế phẩm'
      };
    }
    if (assessment.mode === 'hd') {
      return { kind: 'hd', title: 'Gợi ý cục bộ theo IHD', text: rule.hd || 'Chưa có phác đồ IHD cục bộ; cần đối chiếu chuyên gia.', source };
    }
    if (assessment.mode === 'crrt') {
      return { kind: 'crrt', title: 'Gợi ý cục bộ theo CRRT', text: rule.crrt || 'Chưa có phác đồ CRRT cục bộ; cần đối chiếu chuyên gia.', source };
    }
    if (assessment.mode === 'aki') {
      return {
        kind: 'aki',
        title: 'AKI — không áp dải CrCl tĩnh',
        text: 'Theo dõi xu hướng creatinine, lượng nước tiểu và TDM nếu có; đánh giá lại liều sau mỗi thay đổi chức năng thận. Liều nạp thường cần xem riêng với liều duy trì.',
        source: 'KDIGO 2024 — điều chỉnh liều khi GFR/creatinine chưa ở trạng thái ổn định'
      };
    }
    if (!assessment.canApplyDoseBand || !rule.hit) return null;
    return {
      kind: 'stable',
      title: `Dải liều cục bộ theo CrCl ${assessment.doseCrcl.toFixed(1)} mL/phút`,
      text: `${rule.hit.label}: ${rule.hit.text}`,
      standard: rule.standard || '',
      source
    };
  }

  function renderLocalRenalDose(drug) {
    const rec = getLocalRenalRecommendation(drug, state.renalAssessment);
    if (!rec) return '';
    return `
      <div class="io-local-renal-dose io-local-renal-${esc(rec.kind)}">
        <b>${esc(rec.title)}</b>
        <p>${esc(rec.text)}</p>
        ${rec.standard ? `<small><strong>Liều chuẩn trong dữ liệu:</strong> ${esc(rec.standard)}</small><br>` : ''}
        <small><strong>Nguồn dữ liệu:</strong> ${esc(rec.source)}</small>
      </div>`;
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

    const resultBox = io$('#ioResultBody');
    if (resultBox) {
      resultBox.classList.toggle('io-result-busy', isBusy);
      resultBox.setAttribute('aria-busy', isBusy ? 'true' : 'false');
      resultBox.querySelector(':scope > .io-analyzing-overlay')?.remove();
      if (isBusy) {
        resultBox.insertAdjacentHTML('beforeend', `
          <div class="io-analyzing-overlay" role="status" aria-live="polite">
            <span class="io-spinner io-spinner-result" aria-hidden="true"></span>
            <b>Đang phân tích y lệnh…</b>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>`);
      }
    }

    updateAnalyzeButtonState();
  }

  async function analyzeOrder(options = {}) {
    if (!state.files.length || state.sending) return;
    if (state.autoAnalyzeTimer) {
      window.clearTimeout(state.autoAnalyzeTimer);
      state.autoAnalyzeTimer = null;
    }
    const consent = io$('#ioConsent');
    if (!consent || !consent.checked) {
      alert('Vui lòng xác nhận đã che/xóa thông tin định danh bệnh nhân trước khi phân tích.');
      return;
    }
    if (!WEB_APP_URL) {
      renderError('Chưa cấu hình dịch vụ phân tích y lệnh.');
      return;
    }
    let analysisSucceeded = false;
    setBusy(true);
    try {
      const drugCatalog = buildVerifiedDrugCatalog();
      const renalAssessment = refreshRenalAssessment();
      const images = await Promise.all(state.files.map(entry => fileToCompressedBase64(entry.file)));
      setBusy(true);
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'analyzeInpatientOrder',
          images,
          drugCatalog,
          note: buildRenalNote(renalAssessment)
        })
      });
      const data = await res.json();
      if (!data.ok) {
        const aiError = normalizeAiError(data);
        const error = new Error(aiError.message);
        error.code = aiError.code;
        throw error;
      }
      const verifiedResult = reconcileServerResult(data.result, drugCatalog);
      state.result = verifiedResult;
      renderResult(verifiedResult);
      analysisSucceeded = true;
      window.VPMED_PLATFORM?.calculationComplete({feature:'inpatient-order',files:state.files.length});
    } catch (err) {
      renderError(
        err && err.message ? err.message : 'Không thể phân tích y lệnh. Vui lòng thử lại.',
        err && err.code ? err.code : ''
      );
    } finally {
      setBusy(false);
      if (analysisSucceeded && state.autoAnalyzePending && canAutoAnalyze()) {
        state.autoAnalyzePending = false;
        scheduleAutoAnalyze(120);
      } else if (!analysisSucceeded) {
        state.autoAnalyzePending = false;
      }
    }
  }

  function normalizeAiError(data) {
    const raw = String(data?.message || '');
    const normalized = raw.toLowerCase();
    const quotaLimited = data?.errorCode === 'AI_QUOTA' || /quota|rate.?limit|resource_exhausted|http 429/.test(normalized);
    const temporarilyBusy = data?.errorCode === 'AI_BUSY' || /high demand|overload|unavailable|spike|http 5\d\d/.test(normalized);
    const retrySeconds = Math.max(0, Number(data?.retryAfterSeconds) || 0);
    if (quotaLimited) {
      return {
        code: 'AI_QUOTA',
        message: retrySeconds
          ? `Dịch vụ AI đã chạm giới hạn tạm thời. Vui lòng thử lại sau khoảng ${Math.ceil(retrySeconds)} giây.`
          : 'Dịch vụ AI đã chạm giới hạn tạm thời. Vui lòng thử lại sau ít phút.'
      };
    }
    if (temporarilyBusy) {
      return { code: 'AI_BUSY', message: 'Dịch vụ AI đang quá tải tạm thời. Vui lòng thử lại sau ít phút.' };
    }
    return { code: data?.errorCode || 'AI_UNAVAILABLE', message: raw || 'Dịch vụ AI tạm thời chưa thể phân tích. Vui lòng thử lại sau.' };
  }

  function severityMeta(severity) {
    const key = String(severity || '').toLowerCase();
    if (key.includes('chống chỉ định')) return { cls: 'io-sev-cc', label: 'Chống chỉ định' };
    if (key.includes('nghiêm trọng')) return { cls: 'io-sev-nt', label: 'Nghiêm trọng — cần theo dõi' };
    return { cls: 'io-sev-lu', label: 'Cần lưu ý' };
  }

  function renderIdentityReference(identity) {
    if (!identity) return '';
    const aiIdentity = [identity.brand || identity.rawName, identity.activeIngredient, identity.strength]
      .filter(Boolean).map(esc).join(' · ');
    let catalogNote = '';
    if (identity.catalogStatus === 'matched' || identity.catalogId) {
      catalogNote = `Đã đối chiếu danh mục${identity.catalogId ? `: ${esc(identity.catalogId)}` : ''}`;
    } else if (identity.catalogStatus === 'conflict') {
      const ref = identity.catalogReference || {};
      const referenceText = [ref.brand, ref.activeIngredient, ref.strength].filter(Boolean).map(esc).join(' · ');
      catalogNote = `Danh mục nội bộ có dữ liệu khác${referenceText ? `: ${referenceText}` : ''} — chỉ cảnh báo tham khảo, không khóa kết quả AI`;
    } else if (identity.catalogStatus === 'unavailable') {
      catalogNote = 'Danh mục nội bộ chưa tải được — kết quả AI vẫn được hiển thị';
    } else {
      catalogNote = 'Chưa có trong danh mục nội bộ — kết quả AI vẫn được hiển thị để đối chiếu';
    }
    return `<p><small><strong>AI nhận diện:</strong> ${aiIdentity || 'Chưa đủ dữ liệu'}<br><strong>Đối chiếu:</strong> ${catalogNote}</small></p>`;
  }

  function drugDisplayName(drug) {
    const identity = drug?.identity || {};
    const brand = String(identity.brand || identity.rawName || drug?.tradeName || drug?.brand || '').trim();
    const active = String(identity.activeIngredient || drug?.activeIngredient || '').trim();
    const strength = String(identity.strength || drug?.strength || '').trim();
    if (!brand) return String(drug?.name || 'Thuốc chưa xác định');
    const detail = [active, strength].filter(Boolean).join('; ');
    return detail ? `${brand} (${detail})` : brand;
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
        <b>${esc(drugDisplayName(drug))}</b>
        ${renderIdentityReference(drug.identity)}
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
              ${renal.suggestedRegimen ? `<p><strong>Chế độ liều tham khảo:</strong> ${esc(renal.suggestedRegimen)}</p>` : ''}
              ${renal.loadingDoseNote ? `<small><strong>Liều nạp:</strong> ${esc(renal.loadingDoseNote)}</small><br>` : ''}
              ${renal.monitoring ? `<small><strong>Theo dõi/đánh giá lại:</strong> ${esc(renal.monitoring)}</small><br>` : ''}
              ${renal.source ? `<small>Nguồn: ${esc(renal.source)}</small>` : ''}
            </div>
          </div>` : ''}
        ${renderLocalRenalDose(drug)}
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

  function renderVerifiedRenalSummary(assessment) {
    if (!assessment) return '';
    const hasData = assessment.mode !== 'unknown' || assessment.scrValue !== null;
    if (!hasData) return '';
    const priority = renalPriorityMeta(assessment);
    const values = [];
    if (assessment.doseCrcl !== null) values.push(`Mức dùng đối chiếu: ${assessment.doseCrcl.toFixed(1)} mL/phút`);
    if (assessment.calculatedCrcl !== null) values.push(`CrCl CG: ${assessment.calculatedCrcl.toFixed(1)} mL/phút`);
    if (assessment.egfr !== null) values.push(`eGFR: ${assessment.egfr.toFixed(1)} mL/phút/1,73m²`);
    return `
      <div class="io-verified-renal-summary">
        <div><b>Dữ liệu thận do dược sĩ nhập</b><span class="${priority.cls}">${esc(priority.label)}</span></div>
        <p>${esc(assessment.modeLabel)}${values.length ? ` · ${esc(values.join(' · '))}` : ''}</p>
        ${assessment.warnings.length ? `<small>${esc(assessment.warnings.join(' '))}</small>` : ''}
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

    html += renderVerifiedRenalSummary(state.renalAssessment);

    if (renalCtx.crclOrEgfr || renalCtx.creatinine) {
      html += `
        <div class="alert io-context-alert">
          <b>Chức năng thận AI đọc từ ảnh — cần đối chiếu xét nghiệm gốc:</b>
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

  function renderError(message, code = '') {
    const box = io$('#ioResultBody');
    if (!box) return;
    const busy = code === 'AI_QUOTA' || code === 'AI_BUSY';
    box.innerHTML = `<div class="empty-state io-error-state" role="alert"><b>${busy ? 'AI tạm thời bận' : 'Không thể phân tích'}</b><p>${esc(message)}</p><small>Ảnh đã chọn vẫn được giữ nguyên; hệ thống không tự gửi lại để tránh tốn lượt API.</small></div>`;
  }

  function resetOrder() {
    state.files.forEach(entry => URL.revokeObjectURL(entry.thumbUrl));
    state.files = [];
    state.nextId = 1;
    state.result = null;
    state.renalAssessment = null;
    state.autoAnalyzePending = false;
    if (state.autoAnalyzeTimer) {
      window.clearTimeout(state.autoAnalyzeTimer);
      state.autoAnalyzeTimer = null;
    }
    const input = io$('#ioUploadInput');
    if (input) input.value = '';
    const consent = io$('#ioConsent');
    if (consent) consent.checked = false;
    ['ioAge', 'ioWeight', 'ioHeight', 'ioScr'].forEach(id => {
      const field = io$(`#${id}`);
      if (field) field.value = '';
    });
    const renalStatus = io$('#ioRenalStatus');
    if (renalStatus) renalStatus.value = 'unknown';
    const renalSex = io$('#ioSex');
    if (renalSex) renalSex.value = '';
    const scrUnit = io$('#ioScrUnit');
    if (scrUnit) scrUnit.value = 'umol';
    renderFileQueue();
    refreshRenalAssessment();
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
    if (consent) consent.addEventListener('change', () => {
      updateAnalyzeButtonState();
      if (consent.checked) scheduleAutoAnalyze();
    });

    ['ioRenalStatus', 'ioAge', 'ioSex', 'ioWeight', 'ioHeight', 'ioScr', 'ioScrUnit']
      .forEach(id => {
        const field = io$(`#${id}`);
        if (!field) return;
        field.addEventListener('input', refreshRenalAssessment);
        field.addEventListener('change', refreshRenalAssessment);
      });

    const analyzeBtn = io$('#ioAnalyzeBtn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeOrder);

    const resetBtn = io$('#ioResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetOrder);

    updateAnalyzeButtonState();
    refreshRenalAssessment();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Xuất hàm thuần phục vụ test không cần DOM/network.
  const testHooks = {
    severityMeta,
    calculateRenalAssessment,
    renalPriorityMeta,
    buildRenalNote,
    getLocalRenalRecommendation,
    buildVerifiedDrugCatalog,
    buildVerifiedDrugCatalogNote,
    applyVerifiedCatalogGuard,
    annotateIdentityConflicts,
    normalizeServerResult,
    reconcileServerResult,
    drugDisplayName
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testHooks;
  } else {
    window.__inpatientOrderReviewTestHooks = testHooks;
  }
})();
