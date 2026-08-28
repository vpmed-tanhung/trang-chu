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

  function brandVisibleInRawName(rawName, catalogBrand) {
    const compactUnits = value => normalize(value)
      .replace(/\b(\d+)\s+(mg|g|mcg|ug|ml|iu|ui)\b/g, '$1$2')
      .replace(/\s+/g, ' ').trim();
    const raw = ` ${compactUnits(rawName)} `;
    const brand = compactUnits(catalogBrand);
    return brand.length >= 4 && raw.includes(` ${brand} `);
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

    return { status: 'not_found', entry: null, candidates: [] };
  }

  function extractDeclaredActive(drug) {
    const identityActive = drug?.identity?.activeIngredient || drug?.activeIngredient || drug?.genericName;
    if (identityActive) return String(identityActive);
    const name = String(drug?.name || '');
    const match = name.match(/\(([^)]+)\)/);
    return match && /[A-Za-zÀ-ỹ]/.test(match[1]) ? match[1] : '';
  }

  function reconcileResult(result) {
    const safe = result && typeof result === 'object' ? result : {};
    safe.drugs = Array.isArray(safe.drugs) ? safe.drugs : [];
    safe.unclear = Array.isArray(safe.unclear) ? safe.unclear : [];
    const catalog = getCatalog();
    const byId = new Map(catalog.map(entry => [entry.catalogId, entry]));

    safe.drugs.forEach(drug => {
      if (!drug || typeof drug !== 'object') return;
      const originalName = String(drug?.identity?.rawName || drug.tradeName || drug.name || '').trim();
      const claimedId = String(drug?.identity?.catalogId || '').trim();
      const claimedEntry = claimedId ? byId.get(claimedId) : null;
      const match = claimedEntry ? { status: 'exact', entry: claimedEntry } : findExact(originalName, catalog);
      const declaredActive = extractDeclaredActive(drug);
      let declaredBrand = String(drug?.identity?.brand || drug.tradeName || drug.brand || originalName).trim();

      if (match.status !== 'exact' || !match.entry) {
        drug.identity = {
          rawName: originalName,
          status: String(drug?.identity?.status || (originalName ? 'exact' : 'unreadable')),
          catalogStatus: catalog.length ? match.status : 'unavailable',
          catalogId: '', brand: declaredBrand,
          activeIngredient: declaredActive,
          strength: String(drug?.identity?.strength || drug.strength || ''),
          route: String(drug?.identity?.route || drug.route || ''),
          registrationNumber: String(drug?.identity?.registrationNumber || '')
        };
        drug.tradeName = drug.tradeName || declaredBrand;
        drug.activeIngredient = drug.activeIngredient || declaredActive;
        if (catalog.length) {
          safe.unclear.push(`Thuốc "${originalName || 'chưa đọc rõ tên'}" chưa có khớp duy nhất trong danh mục nội bộ; kết quả AI vẫn được giữ để dược sĩ đối chiếu.`);
        }
        return;
      }

      const entry = match.entry;
      if (!brandVisibleInRawName(originalName, declaredBrand)
          && brandVisibleInRawName(originalName, entry.brand)) {
        declaredBrand = entry.brand;
        drug.name = declaredBrand;
      }
      const activeMismatch = Boolean(declaredActive) && !activeEquivalent(declaredActive, entry.activeIngredient);
      if (activeMismatch) {
        drug.identity = {
          rawName: originalName,
          status: String(drug?.identity?.status || 'exact'),
          catalogStatus: 'conflict',
          catalogId: '', brand: declaredBrand,
          activeIngredient: declaredActive,
          strength: String(drug?.identity?.strength || drug.strength || ''),
          route: String(drug?.identity?.route || drug.route || ''),
          registrationNumber: String(drug?.identity?.registrationNumber || ''),
          catalogReference: {
            catalogId: entry.catalogId, brand: entry.brand, activeIngredient: entry.activeIngredient,
            strength: entry.strength, route: entry.route, registrationNumber: entry.registrationNumber
          }
        };
        safe.unclear.push(`Cần đối chiếu thuốc "${originalName}": AI nhận hoạt chất "${declaredActive}" nhưng danh mục nội bộ ghi "${entry.activeIngredient}". Kết quả AI không bị khóa.`);
        return;
      }

      drug.identity = {
        rawName: originalName,
        status: String(drug?.identity?.status || 'exact'),
        catalogStatus: 'matched',
        catalogId: entry.catalogId,
        brand: declaredBrand,
        activeIngredient: declaredActive,
        strength: String(drug?.identity?.strength || drug.strength || ''),
        route: String(drug?.identity?.route || drug.route || ''),
        registrationNumber: String(drug?.identity?.registrationNumber || ''),
        catalogReference: {
          catalogId: entry.catalogId, brand: entry.brand, activeIngredient: entry.activeIngredient,
          strength: entry.strength, route: entry.route, registrationNumber: entry.registrationNumber
        }
      };
      drug.tradeName = drug.tradeName || declaredBrand;
      drug.activeIngredient = drug.activeIngredient || declaredActive;
    });

    safe.unclear = [...new Set(safe.unclear.filter(Boolean))];
    return safe;
  }

  const api = { normalize, normalizeBrand, activeEquivalent, brandVisibleInRawName, getCatalog, getCatalogForAi, findExact, reconcileResult };
  root.VPMED_INPATIENT_IDENTITY = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
