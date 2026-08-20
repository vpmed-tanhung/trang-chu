const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const documentStub = {
  readyState: 'complete',
  addEventListener(){},
  querySelector(){ return null; }
};

const code = fs.readFileSync(path.join(__dirname, '..', 'assets', 'inpatient-order-review.js'), 'utf8');
const sandbox = {
  document: documentStub,
  window: {},
  URL: { createObjectURL(){ return ''; }, revokeObjectURL(){} },
  module: { exports: {} },
  console
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const { calculateRenalAssessment, renalPriorityMeta, buildRenalNote, getLocalRenalRecommendation } = sandbox.module.exports;
assert.ok(calculateRenalAssessment, 'Phải export hàm tính thận để test thuần');

const stableMale = calculateRenalAssessment({
  mode: 'stable', ageYears: 65, sex: 'm', weightKg: 60,
  scrValue: 1, scrUnit: 'mgdl'
});
assert.ok(Math.abs(stableMale.calculatedCrcl - 62.5) < 0.01);
assert.ok(Math.abs(stableMale.doseCrcl - 62.5) < 0.01);
assert.strictEqual(stableMale.canApplyDoseBand, true);
assert.strictEqual(stableMale.weightMethod, 'cân nặng thực');

const stableFemale = calculateRenalAssessment({
  mode: 'stable', ageYears: 65, sex: 'f', weightKg: 60,
  scrValue: 88.4, scrUnit: 'umol'
});
assert.ok(Math.abs(stableFemale.calculatedCrcl - 53.125) < 0.01, 'Phải đổi µmol/L và áp hệ số nữ 0,85');

const obese = calculateRenalAssessment({
  mode: 'stable', ageYears: 60, sex: 'm', weightKg: 120, heightCm: 170,
  scrValue: 1, scrUnit: 'mgdl'
});
assert.ok(obese.adjustedWeightKg > obese.ibwKg && obese.adjustedWeightKg < obese.weightKg);
assert.ok(obese.weightMethod.includes('AdjBW'));
assert.ok(obese.warnings.some(item => item.includes('>120% IBW')));

const severe = calculateRenalAssessment({
  mode: 'stable', ageYears: 80, sex: 'm', weightKg: 50,
  scrValue: 2, scrUnit: 'mgdl'
});
assert.ok(severe.doseCrcl < 30);
assert.strictEqual(renalPriorityMeta(severe).label, 'Ưu tiên rà soát ngay');

const aki = calculateRenalAssessment({
  mode: 'aki', ageYears: 65, sex: 'm', weightKg: 60,
  scrValue: 2, scrUnit: 'mgdl'
});
assert.strictEqual(aki.canApplyDoseBand, false);
assert.strictEqual(aki.doseCrcl, null, 'AKI không được tự chọn dải liều tĩnh');
assert.ok(aki.calculatedCrcl !== null, 'Vẫn hiển thị phép tính kiểm chứng có cảnh báo');
assert.ok(aki.warnings.some(item => item.includes('AKI/creatinine biến động')));

const hd = calculateRenalAssessment({ mode: 'hd' });
assert.strictEqual(hd.canApplyDoseBand, false);
assert.strictEqual(hd.doseCrcl, null, 'IHD phải dùng phác đồ theo buổi lọc, không dùng dải CrCl');
assert.ok(hd.warnings.some(item => item.startsWith('IHD:')));

const withBsa = calculateRenalAssessment({
  mode: 'stable', ageYears: 65, sex: 'm', weightKg: 100, heightCm: 190,
  scrValue: 1, scrUnit: 'mgdl'
});
assert.ok(withBsa.egfr > 0 && withBsa.egfrAbsolute > 0);
assert.ok(Math.abs(withBsa.egfrAbsolute - withBsa.egfr) > 1, 'Phải quy đổi eGFR không chuẩn hóa khi BSA khác 1,73');

const note = buildRenalNote(stableMale);
assert.ok(note.includes('Dữ liệu thận do dược sĩ nhập'));
assert.ok(note.includes('CrCl Cockcroft–Gault kiểm chứng 62.5 mL/phút'));
assert.ok(!note.includes('họ tên'), 'Ghi chú gửi AI không chứa trường định danh');

sandbox.window.VPMED_GET_RENAL_DOSE = (active, crcl) => ({
  standard: 'liều chuẩn', hit: { label: `CrCl ${crcl}`, text: 'liều theo dải' },
  hd: 'liều HD', crrt: 'liều CRRT', verified: 'nguồn thử nghiệm'
});
const meropenem = getLocalRenalRecommendation({ name: 'Meropenem', route: 'IV' }, stableMale);
assert.strictEqual(meropenem.kind, 'stable');
assert.ok(meropenem.text.includes('liều theo dải'));

const vancomycin = getLocalRenalRecommendation({ name: 'Vancomycin', route: 'IV' }, stableMale);
assert.strictEqual(vancomycin.kind, 'tdm');
assert.ok(vancomycin.text.includes('TDM/AUC'), 'Vancomycin không được trả như dải liều CrCl cố định');

console.log('Inpatient renal assessment tests: OK');
