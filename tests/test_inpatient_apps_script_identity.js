const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dataSandbox = { window: {} };
vm.createContext(dataSandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'inpatient_medicines_20260707.js'), 'utf8'), dataSandbox);
const rows = dataSandbox.window.VPMED_INPATIENT_MEDICINES_20260707;
const payloadCatalog = rows.map((row, index) => ({
  catalogId: String(row.code || row.regNumber || row.id || `inventory-${index + 1}`),
  brand: row.name, activeIngredient: row.active, strength: row.strength,
  route: row.route, registrationNumber: row.regNumber
}));

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', 'inpatient-order-review.gs'), 'utf8'), sandbox);

const catalog = sandbox.sanitizeDrugCatalog(payloadCatalog);
assert.ok(catalog.length > 250);
const entry = catalog.find(item => /\s(?:TTKN|SYT)-\d+$/i.test(item.brand));
assert.ok(entry);
const rawNameFromImage = entry.brand.replace(/\s(?:TTKN|SYT)-\d+$/i, '');

const locked = sandbox.resolveCatalogIdentities([
  { rawName: rawNameFromImage, orderedText: 'Dòng y lệnh kiểm thử', readable: true },
  { rawName: 'Tên không có trong danh mục', orderedText: '', readable: true }
], catalog);
assert.strictEqual(locked[0].status, 'exact');
assert.strictEqual(locked[0].catalogId, entry.catalogId);
assert.strictEqual(locked[0].activeIngredient, entry.activeIngredient);
assert.strictEqual(locked[1].status, 'not_found');
assert.strictEqual(locked[1].activeIngredient, '');

const badAnalysis = {
  drugs: [{
    name: 'Tên AI trả',
    identity: {
      rawName: rawNameFromImage, status: 'exact', catalogId: entry.catalogId,
      activeIngredient: 'Hoạt chất sai do AI tự đoán'
    },
    doseAssessment: { status: 'phù hợp', detail: 'AI kết luận', source: 'AI' },
    infusionRate: { applicable: true, rate: '40 mL/h' },
    renalAdjustment: { applicable: false }
  }], interactions: [], unclear: []
};
const blocked = sandbox.enforceCatalogIdentity(badAnalysis, catalog);
assert.strictEqual(blocked.drugs[0].identity.activeIngredient, entry.activeIngredient);
assert.strictEqual(blocked.drugs[0].safetyBlocked, true);
assert.strictEqual(blocked.drugs[0].doseAssessment.status, 'không đủ dữ liệu để đánh giá');

console.log('Inpatient Apps Script two-stage identity tests: OK');
