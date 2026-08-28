const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const verifiedCatalog = [{
  catalogId: 'verified-1',
  brand: 'Thuốc kiểm thử',
  activeIngredient: 'Hoạt chất từ danh mục',
  strength: '1 g',
  route: 'Tiêm',
  registrationNumber: 'VD-1'
}];
const sandbox = {
  window: {
    VPMED_INPATIENT_IDENTITY: {
      getCatalogForAi: () => verifiedCatalog
    }
  },
  document: {
    readyState: 'loading',
    addEventListener: () => {},
    querySelector: () => null
  },
  console,
  module: { exports: {} }
};

vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(root, 'assets', 'inpatient-order-review.js'), 'utf8'),
  sandbox
);

const hooks = sandbox.module.exports;
assert.strictEqual(typeof hooks.buildVerifiedDrugCatalog, 'function');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(hooks.buildVerifiedDrugCatalog())),
  verifiedCatalog,
  'Module y lệnh phải lấy nguyên danh mục đã xác minh, không tự dựng hoạt chất'
);

delete sandbox.window.VPMED_INPATIENT_IDENTITY;
sandbox.window.VPMED_INPATIENT_MEDICINES_20260707 = [{
  code: 'inventory-verified-2',
  name: 'Biệt dược từ danh mục',
  active: 'Hoạt chất chính thức',
  strength: '500 mg',
  route: 'Uống'
}];
const fallback = hooks.buildVerifiedDrugCatalog();
assert.strictEqual(fallback.length, 1);
assert.strictEqual(fallback[0].activeIngredient, 'Hoạt chất chính thức');

console.log('Inpatient order verified catalog contract tests: OK');
