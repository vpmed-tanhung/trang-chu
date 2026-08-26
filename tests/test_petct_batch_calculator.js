'use strict';

const assert = require('node:assert/strict');
const calculator = require('../assets/petct_batch_calculator.js');

function nearlyEqual(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`);
}

assert.equal(calculator.parseTime('08:05'), 485);
assert.ok(Number.isNaN(calculator.parseTime('24:00')));
assert.ok(Number.isNaN(calculator.parseTime('8:5')));

nearlyEqual(calculator.calculateTargetDose({ weight: 60, factor: 0.15, unit: 'mCiKg', diabetes: false }), 9);
nearlyEqual(calculator.calculateTargetDose({ weight: 60, factor: 0.15, unit: 'mCiKg', diabetes: true }), 10);
nearlyEqual(calculator.calculateTargetDose({ weight: 50, factor: 3.7, unit: 'MBqKg', diabetes: true }), 6);

const fiveCasePlan = calculator.computePlan({
  orderedActivity: 40,
  hospitalReceiveMinute: calculator.parseTime('08:00'),
  halfLife: 110,
  patients: ['08:10', '08:11', '08:13', '08:33', '08:53'].map(time => ({
    targetDose: 5,
    injectionMinute: calculator.parseTime(time)
  }))
});

assert.equal(fiveCasePlan.patientCount, 5);
nearlyEqual(fiveCasePlan.totalTarget, 25);
nearlyEqual(fiveCasePlan.averageSurplus, 3);
nearlyEqual(fiveCasePlan.allocationsSum, 40);
assert.deepEqual(fiveCasePlan.rows.map(row => row.waitMinutes), [10, 11, 13, 33, 53]);
const expectedMinimum = [10, 11, 13, 33, 53].reduce((sum, wait) => sum + 5 * Math.pow(2, wait / 110), 0);
nearlyEqual(fiveCasePlan.totalMinimumAtHospital, expectedMinimum);
assert.equal(fiveCasePlan.totalSufficient, 40 >= expectedMinimum);

let nextRequiredBefore = 0;
for (let index = fiveCasePlan.rows.length - 1; index >= 0; index -= 1) {
  const row = fiveCasePlan.rows[index];
  const nextRow = fiveCasePlan.rows[index + 1];
  const requiredAfter = nextRow
    ? nextRequiredBefore * Math.pow(2, (nextRow.injectionMinute - row.injectionMinute) / 110)
    : 0;
  const requiredBefore = row.targetDose + requiredAfter;
  nearlyEqual(row.requiredAfterInjection, requiredAfter);
  nearlyEqual(row.requiredBeforeInjection, requiredBefore);
  nextRequiredBefore = requiredBefore;
}
nearlyEqual(
  fiveCasePlan.totalMinimumAtHospital,
  fiveCasePlan.rows[0].requiredBeforeInjection * Math.pow(2, 10 / 110)
);

const roundedAllocation = calculator.excelStyleAllocation([5.03, 5.07], 12, 0.1);
nearlyEqual(roundedAllocation.averageSurplus, 0.95);
nearlyEqual(roundedAllocation.allocations[1], 6.1);
nearlyEqual(roundedAllocation.allocations[0], 5.9);
nearlyEqual(roundedAllocation.allocations.reduce((sum, dose) => sum + dose, 0), 12);

const twelveCasePlan = calculator.computePlan({
  orderedActivity: 30,
  hospitalReceiveMinute: 420,
  halfLife: 110,
  patients: Array.from({ length: 12 }, (_, index) => ({
    targetDose: 1,
    injectionMinute: 430 + index * 2
  }))
});
assert.equal(twelveCasePlan.patientCount, 12);

assert.throws(() => calculator.computePlan({
  orderedActivity: 30,
  hospitalReceiveMinute: 420,
  halfLife: 110,
  patients: Array.from({ length: 13 }, (_, index) => ({ targetDose: 1, injectionMinute: 430 + index }))
}), /MAX_PATIENTS/);

assert.throws(() => calculator.computePlan({
  orderedActivity: 20,
  hospitalReceiveMinute: 480,
  halfLife: 110,
  patients: [{ targetDose: 5, injectionMinute: 479 }]
}), /INJECTION_BEFORE_RECEIPT/);

assert.throws(() => calculator.computePlan({
  orderedActivity: 20,
  hospitalReceiveMinute: 480,
  halfLife: 110,
  patients: [
    { targetDose: 5, injectionMinute: 500 },
    { targetDose: 5, injectionMinute: 499 }
  ]
}), /NON_CHRONOLOGICAL/);

console.log('PET/CT batch calculator tests passed.');
