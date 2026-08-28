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
const blocked = api.reconcileResult(wrongAiResult);
assert.strictEqual(blocked.drugs[0].identity.catalogId, catalogEntry.catalogId);
assert.strictEqual(blocked.drugs[0].identity.activeIngredient, catalogEntry.activeIngredient);
assert.strictEqual(blocked.drugs[0].safetyBlocked, true, 'Sai hoạt chất phải khóa kết luận AI');
assert.strictEqual(blocked.drugs[0].doseAssessment.status, 'không đủ dữ liệu để đánh giá');
assert.strictEqual(blocked.drugs[0].infusionRate.applicable, false);

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
assert.ok(!accepted.drugs[0].safetyBlocked, 'Khớp catalogId và hoạt chất thì không bị khóa');
assert.strictEqual(accepted.drugs[0].identity.activeIngredient, catalogEntry.activeIngredient);

const unknown = api.reconcileResult({
  drugs: [{ name: 'Thuốc hoàn toàn không có trong danh mục', doseAssessment: { status: 'phù hợp' } }],
  interactions: [{ drugs: ['A', 'B'] }], unclear: []
});
assert.strictEqual(unknown.drugs[0].safetyBlocked, true);
assert.strictEqual(unknown.interactions.length, 0, 'Có thuốc chưa định danh thì phải khóa tương tác');

console.log('Inpatient drug identity safety tests: OK');
