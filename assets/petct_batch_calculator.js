(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PetctBatchCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_PATIENTS = 12;
  const EPSILON = 1e-9;

  function isPositiveNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  function parseTime(value) {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return NaN;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
    return hours * 60 + minutes;
  }

  function formatTime(totalMinutes) {
    if (!Number.isFinite(totalMinutes)) return '--';
    const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  }

  function roundUpToStep(value, step) {
    if (!Number.isFinite(value) || !isPositiveNumber(step)) return NaN;
    return Math.ceil((value - EPSILON) / step) * step;
  }

  function calculateTargetDose(options) {
    const weight = Number(options && options.weight);
    const factor = Number(options && options.factor);
    const unit = options && options.unit === 'MBqKg' ? 'MBqKg' : 'mCiKg';
    const diabetes = Boolean(options && options.diabetes);
    if (!isPositiveNumber(weight) || !isPositiveNumber(factor)) return NaN;
    const baseDoseMci = unit === 'MBqKg' ? weight * factor / 37 : weight * factor;
    return baseDoseMci + (diabetes ? 1 : 0);
  }

  function excelStyleAllocation(targetDoses, orderedActivity, step) {
    const roundingStep = isPositiveNumber(step) ? step : 0.1;
    const totalTarget = targetDoses.reduce((sum, dose) => sum + dose, 0);
    const averageSurplus = (orderedActivity - totalTarget) / targetDoses.length;
    const allocations = targetDoses.map((target, index) => index === 0 ? 0 : roundUpToStep(target + averageSurplus, roundingStep));
    const laterTotal = allocations.slice(1).reduce((sum, dose) => sum + dose, 0);
    allocations[0] = orderedActivity - laterTotal;
    return {
      totalTarget,
      totalSurplus: orderedActivity - totalTarget,
      averageSurplus,
      allocations,
      allocatedSurplus: allocations.map((dose, index) => dose - targetDoses[index])
    };
  }

  function computePlan(options) {
    const orderedActivity = Number(options && options.orderedActivity);
    const hospitalReceiveMinute = Number(options && options.hospitalReceiveMinute);
    const halfLife = Number(options && options.halfLife);
    const patients = Array.isArray(options && options.patients) ? options.patients : [];
    const roundingStep = Number(options && options.roundingStep) || 0.1;

    if (patients.length === 0) throw new Error('EMPTY_PATIENTS');
    if (patients.length > MAX_PATIENTS) throw new Error('MAX_PATIENTS');
    if (!isPositiveNumber(orderedActivity)) throw new Error('INVALID_ORDERED_ACTIVITY');
    if (!Number.isFinite(hospitalReceiveMinute)) throw new Error('INVALID_RECEIVE_TIME');
    if (!isPositiveNumber(halfLife)) throw new Error('INVALID_HALF_LIFE');

    let previousInjectionMinute = hospitalReceiveMinute;
    const normalizedPatients = patients.map((patient, index) => {
      const targetDose = Number(patient && patient.targetDose);
      const injectionMinute = Number(patient && patient.injectionMinute);
      if (!isPositiveNumber(targetDose)) throw new Error('INVALID_PATIENT_TARGET:' + index);
      if (!Number.isFinite(injectionMinute)) throw new Error('INVALID_INJECTION_TIME:' + index);
      if (injectionMinute < hospitalReceiveMinute) throw new Error('INJECTION_BEFORE_RECEIPT:' + index);
      if (injectionMinute < previousInjectionMinute) throw new Error('NON_CHRONOLOGICAL:' + index);
      previousInjectionMinute = injectionMinute;
      return { targetDose, injectionMinute };
    });

    const allocation = excelStyleAllocation(
      normalizedPatients.map(patient => patient.targetDose),
      orderedActivity,
      roundingStep
    );

    const rows = normalizedPatients.map((patient, index) => {
      const waitMinutes = patient.injectionMinute - hospitalReceiveMinute;
      const decayFactor = Math.pow(2, -waitMinutes / halfLife);
      const minimumAtHospital = patient.targetDose / decayFactor;
      const allocatedAtHospital = allocation.allocations[index];
      const availableAtInjection = allocatedAtHospital * decayFactor;
      return {
        index,
        targetDose: patient.targetDose,
        injectionMinute: patient.injectionMinute,
        waitMinutes,
        decayFactor,
        averageSurplus: allocation.averageSurplus,
        allocatedSurplus: allocation.allocatedSurplus[index],
        allocatedAtHospital,
        minimumAtHospital,
        availableAtInjection,
        marginAtHospital: allocatedAtHospital - minimumAtHospital,
        marginAtInjection: availableAtInjection - patient.targetDose,
        allocationSufficient: availableAtInjection + EPSILON >= patient.targetDose
      };
    });

    for (let index = rows.length - 1; index >= 0; index -= 1) {
      const nextRow = rows[index + 1];
      const intervalToNext = nextRow ? nextRow.injectionMinute - rows[index].injectionMinute : 0;
      const intervalDecayFactor = nextRow ? Math.pow(2, -intervalToNext / halfLife) : 1;
      const requiredAfterInjection = nextRow ? nextRow.requiredBeforeInjection / intervalDecayFactor : 0;
      rows[index].intervalToNext = intervalToNext;
      rows[index].intervalDecayFactor = intervalDecayFactor;
      rows[index].requiredAfterInjection = requiredAfterInjection;
      rows[index].requiredBeforeInjection = rows[index].targetDose + requiredAfterInjection;
    }

    const firstWaitMinutes = rows[0].injectionMinute - hospitalReceiveMinute;
    const firstDecayFactor = Math.pow(2, -firstWaitMinutes / halfLife);
    const totalMinimumAtHospital = rows[0].requiredBeforeInjection / firstDecayFactor;
    const marginAtHospital = orderedActivity - totalMinimumAtHospital;

    return {
      maxPatients: MAX_PATIENTS,
      patientCount: rows.length,
      orderedActivity,
      hospitalReceiveMinute,
      halfLife,
      totalTarget: allocation.totalTarget,
      totalSurplus: allocation.totalSurplus,
      averageSurplus: allocation.averageSurplus,
      totalMinimumAtHospital,
      marginAtHospital,
      totalSufficient: marginAtHospital + EPSILON >= 0,
      allocationsSum: allocation.allocations.reduce((sum, dose) => sum + dose, 0),
      rows
    };
  }

  return {
    MAX_PATIENTS,
    parseTime,
    formatTime,
    roundUpToStep,
    calculateTargetDose,
    excelStyleAllocation,
    computePlan
  };
});
