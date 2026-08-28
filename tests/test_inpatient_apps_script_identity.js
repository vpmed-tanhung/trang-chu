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

const brandRegressionCatalog = sandbox.sanitizeDrugCatalog([
  { catalogId: 'brand-a', brand: 'Trade Alpha I.V 5mg/ml', activeIngredient: 'Levofloxacin', strength: '5mg/ml' },
  { catalogId: 'brand-b', brand: 'Levofloxacin Vendor', activeIngredient: 'Levofloxacin', strength: '500mg/100ml' }
]);
assert.strictEqual(
  sandbox.catalogMatchFromOrderLine('Levofloxacin', brandRegressionCatalog).status,
  'not_found',
  'Tên hoạt chất đơn lẻ không được ghép sang biệt dược cùng tiền tố'
);
const visibleBrandResult = sandbox.enforceCatalogIdentity({
  drugs: [{
    name: 'Levofloxacin Vendor',
    identity: {
      rawName: 'Levofloxacin (Trade Alpha I.V 5mg/ml)', status: 'exact', catalogId: '',
      brand: 'Levofloxacin Vendor', activeIngredient: 'Levofloxacin', strength: '5mg/ml'
    }
  }], interactions: [], unclear: []
}, brandRegressionCatalog);
assert.strictEqual(visibleBrandResult.drugs[0].identity.catalogId, 'brand-a');
assert.strictEqual(visibleBrandResult.drugs[0].identity.brand, 'Trade Alpha I.V 5mg/ml', 'Phải lấy biệt dược xuất hiện nguyên văn trong rawName');
assert.strictEqual(visibleBrandResult.drugs[0].name, 'Trade Alpha I.V 5mg/ml', 'Tên tổng hợp sai phải được sửa theo biệt dược thực sự có trong rawName');
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
const warned = sandbox.enforceCatalogIdentity(badAnalysis, catalog);
assert.strictEqual(warned.drugs[0].identity.activeIngredient, 'Hoạt chất sai do AI tự đoán');
assert.strictEqual(warned.drugs[0].identity.catalogStatus, 'conflict');
assert.strictEqual(warned.drugs[0].identity.catalogReference.activeIngredient, entry.activeIngredient);
assert.ok(!warned.drugs[0].safetyBlocked);
assert.strictEqual(warned.drugs[0].doseAssessment.status, 'phù hợp');

console.log('Inpatient Apps Script catalog identity safety tests: OK');

const looseIdentity = sandbox.parseIdentityModelOutput(
  `Kết quả định danh:\n- ${rawNameFromImage} 1,5 g x 2 lần/ngày, truyền tĩnh mạch`,
  catalog
);
assert.ok(looseIdentity.drugs.length >= 1, 'Fallback phải bóc được thuốc từ text thô không phải JSON');
const looseLocked = sandbox.resolveCatalogIdentities(looseIdentity.drugs, catalog);
assert.ok(looseLocked.some(item => item.catalogId === entry.catalogId && item.status === 'exact'));

const fencedIdentity = sandbox.parseIdentityModelOutput(
  'Giải thích thừa trước JSON\n```json\n{"drugs":[{"rawName":"' + rawNameFromImage + '","orderedText":"' + rawNameFromImage + ' 1,5g"}]}\n```\nNội dung thừa sau JSON',
  catalog
);
assert.strictEqual(fencedIdentity.drugs[0].rawName, rawNameFromImage, 'Parser phải lấy JSON fragment dù có text thừa');

const recoveredAnalysis = sandbox.enforceCatalogIdentity({
  drugs: [{
    name: rawNameFromImage,
    identity: { rawName: rawNameFromImage, status: 'not_found', catalogId: '' },
    doseAssessment: { status: 'phù hợp', detail: 'Kết quả kiểm thử', source: 'Nguồn kiểm thử' },
    infusionRate: { applicable: false },
    renalAdjustment: { applicable: false }
  }], interactions: [], unclear: []
}, catalog);
assert.strictEqual(recoveredAnalysis.drugs[0].identity.status, 'not_found', 'Đối chiếu danh mục không được viết lại trạng thái nhận diện do AI trả');
assert.strictEqual(recoveredAnalysis.drugs[0].identity.catalogStatus, 'matched');
assert.strictEqual(recoveredAnalysis.drugs[0].identity.catalogId, entry.catalogId);
