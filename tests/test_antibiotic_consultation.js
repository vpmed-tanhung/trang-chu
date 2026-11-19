'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function element(value = '') {
  return {
    value,
    handlers: {},
    addEventListener(event, handler) {
      this.handlers[event] = handler;
    }
  };
}

function load(extraDrugs = []) {
  const elements = Object.fromEntries([
    'consultationNationalCount', 'consultationPriorityCount', 'consultationOutsideCount',
    'consultationTotalCount', 'consultationMonitoringCount', 'consultationQ',
    'consultationAvailability', 'consultationCategory', 'consultationList',
    'consultationMonitoringList'
  ].map(id => [id, element()]));
  const monitoringDetails = {open: false};
  elements.consultationMonitoringList.closest = () => monitoringDetails;
  elements.consultationAvailability.value = 'all';
  elements.consultationCategory.value = 'all';
  const main = {appendChild(view) { elements[view.id] = view; }};
  const context = vm.createContext({
    document: {
      readyState: 'complete',
      head: {appendChild() {}},
      createElement: () => ({querySelector: () => element()}),
      getElementById: id => elements[id],
      querySelector: selector => selector === 'main' ? main : null
    },
    location: {hash: ''},
    window: {addEventListener() {}}
  });

  function run(path) {
    vm.runInContext(fs.readFileSync(require.resolve(path), 'utf8'), context);
  }
  run('../assets/data.js');
  run('../assets/antibiotic_38_complete.js');
  context.window.VPMED_DRUGS.push(...extraDrugs);
  run('../assets/antibiotic_consultation.js');
  return {elements, monitoringDetails};
}

const {elements, monitoringDetails} = load();
assert.equal(elements.consultationNationalCount.textContent, 33);
assert.equal(elements.consultationTotalCount.textContent, 38);
assert.equal(elements.consultationPriorityCount.textContent, 8);
assert.equal(elements.consultationMonitoringCount.textContent, 8);
assert.equal(elements.consultationOutsideCount.textContent, 28);
assert.match(elements.consultationList.innerHTML, /Cepemid.*Meronem/s);
assert.match(elements.consultationList.innerHTML, /Fosmicin for I.V.USE/);
assert.match(elements.consultationList.innerHTML, /Vecmid 500mg/);
assert.match(elements.consultationList.innerHTML, /QD-2147-QD-BYT-Huong-dan-viem-phoi-cong-dong-2026.pdf#page=40/);
assert.doesNotMatch(elements.consultationMonitoringList.innerHTML, /Oflovid/);

elements.consultationQ.value = 'levofloxacin';
elements.consultationQ.handlers.input();
assert.equal(monitoringDetails.open, true);
assert.match(elements.consultationMonitoringList.innerHTML, /Ozanier/);
assert.doesNotMatch(elements.consultationMonitoringList.innerHTML, /Tamisynt/);

elements.consultationAvailability.value = 'reference';
elements.consultationAvailability.handlers.change();
assert.doesNotMatch(elements.consultationMonitoringList.innerHTML, /Ozanier/);

const fixtures = load([
  {brand: 'Fosfomycin oral fixture', active: 'Fosfomycin', route: 'Uống'},
  {brand: 'Fosfomycin IV fixture', active: 'Fosfomycin natri', route: 'Truyền TM'},
  {brand: 'Fosfomycin unspecified fixture', active: 'Fosfomycin'},
  {brand: 'Vancomycin oral fixture', active: 'Vancomycin', route: 'Uống'},
  {brand: 'Carbapenem combination fixture', active: 'Meropenem + vaborbactam', route: 'Tiêm truyền'},
  {brand: 'Ceftazidime combination fixture', active: 'Avibactam natri + Ceftazidim', route: 'Tiêm truyền'},
  {brand: 'Ofloxacin ophthalmic fixture', active: 'Ofloxacin', route: 'Nhỏ mắt'},
  {brand: 'Ofloxacin oral fixture', active: 'Ofloxacin', route: 'Uống'},
  {brand: 'Gentamicin topical fixture', active: 'Gentamicin', route: 'Bôi'},
  {brand: 'Gentamicin IM fixture', active: 'Gentamicin sulfat', route: 'Tiêm bắp'}
]).elements;
assert.match(fixtures.consultationList.innerHTML, /Fosfomycin IV fixture/);
assert.match(fixtures.consultationList.innerHTML, /Ceftazidime combination fixture/);
assert.doesNotMatch(fixtures.consultationList.innerHTML, /Fosfomycin oral fixture|Fosfomycin unspecified fixture|Vancomycin oral fixture|Carbapenem combination fixture/);
assert.match(fixtures.consultationMonitoringList.innerHTML, /Ofloxacin oral fixture/);
assert.match(fixtures.consultationMonitoringList.innerHTML, /Gentamicin IM fixture/);
assert.doesNotMatch(fixtures.consultationMonitoringList.innerHTML, /Ofloxacin ophthalmic fixture|Gentamicin topical fixture/);

console.log('Antibiotic consultation source and stock matching tests passed.');
