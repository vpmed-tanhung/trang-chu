'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const clientSandbox = {
  document: {readyState: 'complete', addEventListener() {}, querySelector() { return null; }},
  window: {},
  URL: {createObjectURL() { return ''; }, revokeObjectURL() {}},
  module: {exports: {}},
  console
};
vm.createContext(clientSandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'inpatient-order-review.js'), 'utf8'), clientSandbox);

const normalized = clientSandbox.module.exports.normalizeServerResult({
  medications: [
    '1. Paracetamol 500 mg uống 1 viên x 2 lần/ngày',
    {
      drug_name: 'Ceftriaxon',
      active_ingredient: 'Ceftriaxon',
      ordered_text: 'Ceftriaxon 1 g tiêm tĩnh mạch mỗi 24 giờ',
      dose_evaluation: {status: 'phù hợp', detail: 'Đã đối chiếu'}
    }
  ]
});
assert.strictEqual(normalized.drugs[0].identity.rawName, 'Paracetamol');
assert.strictEqual(normalized.drugs[0].identity.strength, '500 mg');
assert.strictEqual(normalized.drugs[0].orderedDose, '1. Paracetamol 500 mg uống 1 viên x 2 lần/ngày');
assert.strictEqual(normalized.drugs[1].identity.rawName, 'Ceftriaxon');
assert.strictEqual(normalized.drugs[1].identity.activeIngredient, 'Ceftriaxon');
assert.strictEqual(normalized.drugs[1].doseAssessment.status, 'phù hợp');

const serverSandbox = {console};
vm.createContext(serverSandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', 'inpatient-order-review.gs'), 'utf8'), serverSandbox);
const serverNormalized = serverSandbox.normalizeAnalysisResult({
  medicines: [{
    raw_name: 'Meropenem',
    ordered_text: 'Meropenem 1 g truyền tĩnh mạch mỗi 8 giờ',
    dose_evaluation: 'phù hợp'
  }]
});
assert.strictEqual(serverNormalized.drugs[0].identity.rawName, 'Meropenem');
assert.strictEqual(serverNormalized.drugs[0].identity.strength, '1 g');
assert.strictEqual(serverNormalized.drugs[0].orderedDose, 'Meropenem 1 g truyền tĩnh mạch mỗi 8 giờ');
assert.strictEqual(serverNormalized.drugs[0].doseAssessment.status, 'phù hợp');

console.log('Inpatient order mapping regression tests: OK');
