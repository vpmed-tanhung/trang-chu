const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'assets/interaction-regulatory-data.js'), 'utf8'), ctx);

const base = ctx.window.VPMED_INTERACTIONS;
const supp = ctx.window.VPMED_RX_INTERACTION_SUPPLEMENTAL;
const sources = ctx.window.VPMED_RX_REGULATORY_SOURCES;

assert(Array.isArray(base) && base.length === 633, 'QĐ 5948 phải giữ đủ 633 cặp');
assert(Array.isArray(supp) && supp.length === 7, 'Phải có 7 cặp cảnh báo DI&ADR bổ sung đã tuyển chọn');
assert(sources && sources.qd5948 && sources.qd29 && sources.tt26_2025 && sources.tt37_2024 && sources.diadr, 'Thiếu registry nguồn chính thức');
assert(base.every(x => x.sourceType === 'moh-contraindication-list'), 'Cặp QĐ 5948 phải có metadata nguồn Bộ Y tế');
assert(base.filter(x => x.visualSeverity === 'critical').length === 369, 'Sai số lượng chống chỉ định đỏ');
assert(base.filter(x => x.visualSeverity === 'high').length === 264, 'Sai số lượng chống chỉ định có điều kiện');

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
const pairKey = x => [norm(x.drug1), norm(x.drug2)].sort().join('|');
const basePairs = new Set(base.map(pairKey));
assert(supp.every(x => !basePairs.has(pairKey(x))), 'Cảnh báo bổ sung không được trùng cặp QĐ 5948');
assert(supp.every(x => x.regulatoryStatus.includes('không tự động quy thành chống chỉ định')), 'Phải phân biệt cảnh báo DI&ADR với chống chỉ định QĐ 5948');

const atorva = supp.find(x => norm(x.drug1) === 'atorvastatin' && norm(x.drug2) === 'clarithromycin');
assert(atorva && atorva.visualSeverity === 'high', 'Atorvastatin + clarithromycin phải là cảnh báo mức cao');
const ticag = supp.find(x => norm(x.drug1) === 'ticagrelor' && norm(x.drug2) === 'atorvastatin');
assert(ticag && ticag.visualSeverity === 'moderate', 'Ticagrelor + atorvastatin phải là cảnh báo theo dõi');

console.log('OK: regulatory interaction layer', { base: base.length, supplemental: supp.length });
