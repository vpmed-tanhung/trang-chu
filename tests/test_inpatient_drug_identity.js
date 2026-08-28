const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const sandbox = { window: {}, console, module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'inpatient_medicines_20260707.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'inpatient-drug-identity.js'), 'utf8'), sandbox);

const api = sandbox.module.exports;
const catalog = api.getCatalog();
assert.ok(catalog.length > 250, 'Phải dùng danh mục thuốc nội trú đầy đủ, không phải ánh xạ viết tay');

const catalogEntry = catalog.find(item => /\s(?:TTKN|SYT)-\d+$/i.test(item.brand));
assert.ok(catalogEntry, 'Ca kiểm thử phải được chọn động từ chính danh mục hiện có');
const rawNameFromImage = catalogEntry.brand.replace(/\s(?:TTKN|SYT)-\d+$/i, '');

const exact = api.findExact(rawNameFromImage);
assert.strictEqual(exact.status, 'exact');
assert.strictEqual(exact.entry.catalogId, catalogEntry.catalogId);

const sameActiveDifferentBrands = [
  { catalogId: 'brand-a', brand: 'Trade Alpha I.V 5mg/ml', activeIngredient: 'Levofloxacin', strength: '5mg/ml' },
  { catalogId: 'brand-b', brand: 'Levofloxacin Vendor', activeIngredient: 'Levofloxacin', strength: '500mg/100ml' }
];
const genericMustNotBecomeBrand = api.findExact('Levofloxacin', sameActiveDifferentBrands);
assert.strictEqual(genericMustNotBecomeBrand.status, 'not_found', 'Tên hoạt chất không được suy thành một biệt dược có cùng tiền tố');

const literalCatalogEntry = catalog.find(item => !/\s(?:TTKN|SYT|DV|BHYT)-\d+$/i.test(item.brand));
assert.ok(literalCatalogEntry, 'Cần một biệt dược không có hậu tố kho để kiểm tra chuỗi nhìn thấy');
const visibleBrand = api.reconcileResult({
  drugs: [{
    name: 'Tên biệt dược AI tự thay',
    identity: {
      rawName: `Hoạt chất (${literalCatalogEntry.brand})`, status: 'exact', catalogId: literalCatalogEntry.catalogId,
      brand: 'Tên biệt dược AI tự thay', activeIngredient: literalCatalogEntry.activeIngredient, strength: literalCatalogEntry.strength
    }
  }], interactions: [], unclear: []
});
assert.strictEqual(visibleBrand.drugs[0].identity.brand, literalCatalogEntry.brand, 'Phải ưu tiên biệt dược thực sự có trong rawName');
assert.strictEqual(visibleBrand.drugs[0].name, literalCatalogEntry.brand, 'Tên tổng hợp sai phải được sửa theo biệt dược thực sự có trong rawName');

const wrongAiResult = {
  drugs: [{
    name: `${rawNameFromImage} (Hoạt chất sai do AI tự đoán)`,
    orderedDose: '1,5g/lần x 2 lần/ngày',
    doseAssessment: { status: 'cao hơn khuyến cáo', detail: 'Đối chiếu theo hoạt chất AI tự đoán', source: 'AI' },
    infusionRate: { applicable: true, rate: '40 mL/giờ', basis: '20 mL trong 30 phút' },
    renalAdjustment: { applicable: false }
  }],
  interactions: [], unclear: []
};
const warned = api.reconcileResult(wrongAiResult);
assert.strictEqual(warned.drugs[0].identity.catalogStatus, 'conflict');
assert.strictEqual(warned.drugs[0].identity.catalogReference.catalogId, catalogEntry.catalogId);
assert.strictEqual(warned.drugs[0].identity.activeIngredient, 'Hoạt chất sai do AI tự đoán');
assert.ok(!warned.drugs[0].safetyBlocked, 'Xung đột danh mục chỉ cảnh báo, không khóa kết luận AI');
assert.strictEqual(warned.drugs[0].doseAssessment.status, 'cao hơn khuyến cáo');
assert.strictEqual(warned.drugs[0].infusionRate.applicable, true);

const correctAiResult = {
  drugs: [{
    name: catalogEntry.brand,
    identity: {
      rawName: rawNameFromImage, status: 'exact', catalogId: catalogEntry.catalogId,
      activeIngredient: catalogEntry.activeIngredient
    },
    doseAssessment: { status: 'phù hợp', detail: 'Đã dùng đúng hoạt chất từ danh mục', source: 'nguồn thử' },
    infusionRate: { applicable: false }, renalAdjustment: { applicable: false }
  }], interactions: [], unclear: []
};
const accepted = api.reconcileResult(correctAiResult);
assert.ok(!accepted.drugs[0].safetyBlocked, 'Khớp catalogId và hoạt chất thì giữ nguyên kết quả');
assert.strictEqual(accepted.drugs[0].identity.activeIngredient, catalogEntry.activeIngredient);

const unknown = api.reconcileResult({
  drugs: [{
    name: 'Biệt dược kiểm thử ngoài danh mục',
    identity: { rawName: 'Biệt dược kiểm thử ngoài danh mục', status: 'exact', brand: 'Biệt dược kiểm thử', activeIngredient: 'Hoạt chất kiểm thử' },
    doseAssessment: { status: 'phù hợp', detail: 'Kết quả AI được giữ nguyên' },
    usageNote: 'Cách dùng do AI phân tích',
    infusionRate: { applicable: true, rate: '30 mL/giờ' },
    renalAdjustment: { applicable: true, warning: 'Theo dõi chức năng thận' }
  }],
  interactions: [{ drugs: ['A', 'B'] }], unclear: []
});
assert.strictEqual(unknown.drugs[0].identity.catalogStatus, 'not_found');
assert.ok(!unknown.drugs[0].safetyBlocked, 'Thuốc ngoài danh mục không được khóa phân tích AI');
assert.strictEqual(unknown.drugs[0].doseAssessment.status, 'phù hợp');
assert.strictEqual(unknown.drugs[0].usageNote, 'Cách dùng do AI phân tích');
assert.strictEqual(unknown.drugs[0].infusionRate.applicable, true);
assert.strictEqual(unknown.drugs[0].renalAdjustment.applicable, true);
assert.strictEqual(unknown.interactions.length, 1, 'Thuốc ngoài danh mục không được xóa tương tác AI đã phân tích');

console.log('Inpatient drug identity safety tests: OK');
