/*
 * Đối chiếu định danh thuốc cho phân tích y lệnh nội trú.
 * Nguồn duy nhất: window.VPMED_INPATIENT_MEDICINES_20260707 — danh mục thuốc
 * nội trú đã có sẵn trong ứng dụng. Module không chứa ánh xạ biệt dược viết
 * tay và không dùng kiến thức tự suy diễn của AI để gán hoạt chất.
 */
(function inpatientDrugIdentityModule(root) {
  'use strict';

  const INVENTORY_SUFFIX_RE = /\b(?:ttkn|syt|dv|bhyt)\s*\d+\b/g;
  const ACTIVE_NOISE = new Set([
    'duoi', 'dang', 'tuong', 'duong', 'natri', 'sodium', 'kali', 'potassium',
    'hydrat', 'hydrate', 'hydrochlorid', 'hydrochloride', 'monohydrat',
    'dihydrat', 'trihydrat', 'hemihydrat'
  ]);

  function normalize(value) {
    return String(value ?? '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeBrand(value) {
    return normalize(String(value ?? '').split('(')[0]).replace(INVENTORY_SUFFIX_RE, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function normalizeActiveToken(token) {
    const mapped = token === 'ampicillin' ? 'ampicilin' : token;
    return mapped.length >= 4 && !ACTIVE_NOISE.has(mapped) && !/^\d/.test(mapped) ? mapped : '';
  }

  function activeTokens(value) {
    return new Set(normalize(value).split(' ').map(normalizeActiveToken).filter(Boolean));
  }

  function activeEquivalent(left, right) {
    const a = activeTokens(left);
    const b = activeTokens(right);
    if (!a.size || !b.size) return false;
    const overlap = [...a].filter(token => b.has(token)).length;
    return overlap === Math.min(a.size, b.size) && overlap / Math.max(a.size, b.size) >= 0.5;
  }

  function inventoryRows() {
    return Array.isArray(root.VPMED_INPATIENT_MEDICINES_20260707)
      ? root.VPMED_INPATIENT_MEDICINES_20260707 : [];
  }

  function toCatalogEntry(row, index) {
    return {
      catalogId: String(row.code || row.regNumber || row.id || `inventory-${index + 1}`),
      code: String(row.code || ''),
      brand: String(row.name || ''),
      activeIngredient: String(row.active || ''),
      strength: String(row.strength || row.concentration || ''),
      route: String(row.route || row.routeBHYT || ''),
      registrationNumber: String(row.regNumber || '')
    };
  }

  function getCatalog() {
    const seen = new Set();
    return inventoryRows().map(toCatalogEntry).filter(entry => {
      if (!entry.brand || !entry.activeIngredient || seen.has(entry.catalogId)) return false;
      seen.add(entry.catalogId);
      return true;
    });
  }

  function getCatalogForAi() {
    return getCatalog().map(entry => ({
      catalogId: entry.catalogId,
      brand: entry.brand,
      activeIngredient: entry.activeIngredient,
      strength: entry.strength,
      route: entry.route,
      registrationNumber: entry.registrationNumber
    }));
  }

  function sameIdentity(entries) {
    if (!entries.length) return false;
    const first = entries[0];
    return entries.every(entry => activeEquivalent(entry.activeIngredient, first.activeIngredient)
      && normalize(entry.strength) === normalize(first.strength));
  }

  function findExact(rawName, catalog) {
    const raw = normalizeBrand(rawName);
    if (raw.length < 4) return { status: 'unreadable', entry: null, candidates: [] };
    const rows = Array.isArray(catalog) ? catalog : getCatalog();
    const exact = rows.filter(entry => normalizeBrand(entry.brand) === raw);
    if (exact.length === 1 || (exact.length > 1 && sameIdentity(exact))) {
      return { status: 'exact', entry: exact[0], candidates: exact };
    }
    if (exact.length > 1) return { status: 'ambiguous', entry: null, candidates: exact };

    // Chấp nhận duy nhất trường hợp một bên chỉ thiếu hậu tố kho/hàm lượng ở
    // cuối chuỗi. Không dùng fuzzy/đoán gần đúng vì có thể ghép nhầm biệt dược.
    const prefix = rows.filter(entry => {
      const brand = normalizeBrand(entry.brand);
      return brand.length >= 5 && (raw.startsWith(`${brand} `) || brand.startsWith(`${raw} `));
    });
    if (prefix.length === 1 || (prefix.length > 1 && sameIdentity(prefix))) {
      return { status: 'exact', entry: prefix[0], candidates: prefix };
    }
    if (prefix.length > 1) return { status: 'ambiguous', entry: null, candidates: prefix };
    return { status: 'not_found', entry: null, candidates: [] };
  }

  function extractDeclaredActive(drug) {
    const identityActive = drug?.identity?.activeIngredient || drug?.activeIngredient || drug?.genericName;
    if (identityActive) return String(identityActive);
    const name = String(drug?.name || '');
    const match = name.match(/\(([^)]+)\)/);
    return match && /[A-Za-zÀ-ỹ]/.test(match[1]) ? match[1] : '';
  }

  function blockDrugAssessment(drug, reason) {
    drug.safetyBlocked = true;
    drug.doseAssessment = {
      status: 'không đủ dữ liệu để đánh giá',
      detail: reason,
      source: ''
    };
    drug.infusionRate = {
      applicable: false,
      rate: '',
      basis: 'Đã khóa vì định danh thuốc chưa được xác nhận chắc chắn từ danh mục.'
    };
    drug.renalAdjustment = {
      applicable: false,
      priority: 'rà soát ngay',
      warning: 'Chưa cho phép đưa khuyến cáo hiệu chỉnh thận khi định danh thuốc chưa chắc chắn.',
      method: '', suggestedRegimen: '', loadingDoseNote: '', monitoring: '', source: ''
    };
  }

  function reconcileResult(result) {
    const safe = result && typeof result === 'object' ? result : {};
    safe.drugs = Array.isArray(safe.drugs) ? safe.drugs : [];
    safe.unclear = Array.isArray(safe.unclear) ? safe.unclear : [];
    const catalog = getCatalog();
    const byId = new Map(catalog.map(entry => [entry.catalogId, entry]));
    let allVerified = safe.drugs.length > 0;

    safe.drugs.forEach(drug => {
      if (!drug || typeof drug !== 'object') {
        allVerified = false;
        return;
      }
      const originalName = String(drug?.identity?.rawName || drug.tradeName || drug.name || '').trim();
      const claimedId = String(drug?.identity?.catalogId || '').trim();
      const claimedEntry = claimedId ? byId.get(claimedId) : null;
      const match = claimedEntry ? { status: 'exact', entry: claimedEntry } : findExact(originalName, catalog);
      const declaredActive = extractDeclaredActive(drug);

      if (match.status !== 'exact' || !match.entry) {
        allVerified = false;
        drug.identity = {
          rawName: originalName,
          status: match.status,
          catalogId: '', brand: originalName,
          activeIngredient: '', strength: '', route: '', registrationNumber: ''
        };
        blockDrugAssessment(drug,
          match.status === 'ambiguous'
            ? `Tên "${originalName || 'không đọc rõ'}" khớp nhiều thuốc trong danh mục; cần chọn/xác minh thủ công.`
            : `Không tìm thấy khớp chính xác cho "${originalName || 'không đọc rõ'}" trong danh mục thuốc nội trú; hệ thống không tự suy diễn hoạt chất.`
        );
        safe.unclear.push(`Định danh thuốc chưa xác nhận: ${originalName || 'không đọc rõ'}.`);
        return;
      }

      const entry = match.entry;
      const activeMismatch = Boolean(declaredActive) && !activeEquivalent(declaredActive, entry.activeIngredient);
      drug.identity = {
        rawName: originalName,
        status: 'exact',
        catalogId: entry.catalogId,
        brand: entry.brand,
        activeIngredient: entry.activeIngredient,
        strength: entry.strength,
        route: entry.route,
        registrationNumber: entry.registrationNumber
      };
      drug.tradeName = entry.brand;
      drug.activeIngredient = entry.activeIngredient;
      drug.name = `${entry.brand} (${entry.activeIngredient}${entry.strength ? `; ${entry.strength}` : ''})`;

      if (activeMismatch) {
        allVerified = false;
        blockDrugAssessment(drug,
          `AI gán hoạt chất không khớp danh mục cho "${originalName}". Kết luận lâm sàng đã bị khóa; cần phân tích lại từ hoạt chất trong danh mục.`
        );
        safe.unclear.push(`AI trả sai hoạt chất cho ${originalName}; hệ thống đã khóa kết luận liên quan.`);
      }
    });

    if (!allVerified && Array.isArray(safe.interactions) && safe.interactions.length) {
      safe.interactions = [];
      safe.unclear.push('Đã khóa kết quả tương tác vì còn thuốc chưa được định danh chính xác.');
    }
    safe.unclear = [...new Set(safe.unclear.filter(Boolean))];
    return safe;
  }

  const api = { normalize, normalizeBrand, activeEquivalent, getCatalog, getCatalogForAi, findExact, reconcileResult };
  root.VPMED_INPATIENT_IDENTITY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
