const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const documentStub = {
  readyState: 'complete',
  addEventListener(){},
  querySelector(){ return null; }
};

const sandbox = {
  document: documentStub,
  window: {},
  URL: { createObjectURL(){ return ''; }, revokeObjectURL(){} },
  module: { exports: {} },
  console
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'data.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'inpatient-order-review.js'), 'utf8'), sandbox);

const hooks = sandbox.module.exports;
const catalog = hooks.buildVerifiedDrugCatalog();
const nerusyn = catalog.find(item => item.brand.includes('Nerusyn'));
assert.ok(nerusyn, 'Danh mục nội bộ phải có Nerusyn');
assert.strictEqual(nerusyn.active, 'Ampicilin + sulbactam');
assert.strictEqual(nerusyn.strength, '1g + 0,5g');

const note = hooks.buildVerifiedDrugCatalogNote(catalog);
assert.ok(note.includes('DANH MỤC THUỐC NỘI BỘ ĐÃ XÁC MINH'));
assert.ok(note.includes('Nerusyn 1,5g TTKN-25 => HOẠT CHẤT: Ampicilin + sulbactam'));

const wrong = {
  drugs: [{
    name: 'Nerusyn 1.5g (Cefoperazone 1g + Sulbactam 0.5g)',
    orderedDose: '1.5g/lần x 2 lần/ngày',
    doseAssessment: { status: 'cao hơn khuyến cáo', detail: 'sai hoạt chất' },
    infusionRate: { applicable: true, rate: '40 mL/h' },
    renalAdjustment: { applicable: true }
  }],
  interactions: [{ drugs: ['Cefoperazone', 'Warfarin'] }],
  unclear: []
};

const guarded = hooks.applyVerifiedCatalogGuard(wrong, catalog);
assert.strictEqual(guarded.conflicts.length, 1, 'Phải phát hiện AI nhận Nerusyn sai hoạt chất');
assert.strictEqual(guarded.result.drugs[0].identity.catalogStatus, 'conflict');
assert.strictEqual(guarded.result.drugs[0].identity.catalogReference.activeIngredient, 'Ampicilin + sulbactam');

hooks.annotateIdentityConflicts(guarded.result, guarded.conflicts);
assert.strictEqual(guarded.result.drugs[0].doseAssessment.status, 'cao hơn khuyến cáo');
assert.strictEqual(guarded.result.drugs[0].infusionRate.applicable, true);
assert.strictEqual(guarded.result.drugs[0].renalAdjustment.applicable, true);
assert.strictEqual(guarded.result.interactions.length, 1, 'Cảnh báo danh mục không được xóa tương tác AI');
assert.ok(guarded.result.unclear.some(item => item.includes('Nerusyn')));

const correct = {
  drugs: [{
    name: 'Nerusyn 1.5g',
    brand: 'Nerusyn 1.5g',
    activeIngredient: 'Ampicillin + Sulbactam',
    orderedDose: '1.5g/lần x 2 lần/ngày'
  }]
};
const correctGuard = hooks.applyVerifiedCatalogGuard(correct, catalog);
assert.strictEqual(correctGuard.conflicts.length, 0, 'Ampicillin/Ampicilin phải được coi là cùng hoạt chất');
assert.strictEqual(correctGuard.result.drugs[0].activeIngredient, 'Ampicillin + Sulbactam', 'Danh mục không được ghi đè cách ghi hoạt chất AI đã nhận');

const noIdentityApiResult = hooks.reconcileServerResult({
  drugs: [{ name: 'Nerusyn 1.5g', brand: 'Nerusyn 1.5g', activeIngredient: 'Ampicillin + Sulbactam' }],
  interactions: [], unclear: []
}, catalog);
assert.strictEqual(noIdentityApiResult.drugs[0].activeIngredient, 'Ampicillin + Sulbactam', 'Không có identityApi vẫn phải giữ kết quả AI và chỉ gắn tham chiếu danh mục');
assert.strictEqual(
  hooks.drugDisplayName({
    name: 'Tên sai không được hiển thị',
    identity: { brand: 'Trade Alpha I.V', activeIngredient: 'Levofloxacin', strength: '5mg/ml' }
  }),
  'Trade Alpha I.V (Levofloxacin; 5mg/ml)',
  'Tiêu đề thuốc phải lấy từ identity đã kiểm chứng, không lấy drug.name có thể đã bị ghi đè'
);

console.log('Inpatient drug identity guard tests: OK');
