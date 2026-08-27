'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const context={
  window:{VPMED_PRESCRIPTION_RESULT:{}},
  document:{querySelector(){return null}},
  location:{hash:''},
  console
};
vm.createContext(context);

for(const file of [
  'inpatient_medicines_20260707.js',
  'service_medicines_20260818.js',
  'drug_profiles_305_vpmed_20260710.js'
]){
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets',file),'utf8'),context);
}
context.window.VPMED_VERIFIED_DRUG_PROFILES=[];
context.window.VPMED_INTERACTIONS=[];
context.window.VPMED_RX_INTERACTION_SUPPLEMENTAL=[];

const sourcePath=path.join(__dirname,'..','assets','prescription-check.js');
let source=fs.readFileSync(sourcePath,'utf8');
const initBlock=`  bindEvents();\n  renderDiagnosisChips();\n  renderFileQueue();\n  renderRows();\n  if(location.hash==='#prescription-check')ensureData().catch(()=>{});\n})();`;
assert(source.includes(initBlock),'Không tìm thấy khối khởi tạo prescription-check.js');
source=source.replace(initBlock,`  window.__rxOcrDrugTest={matchDrugsFromText};\n})();`);
vm.runInContext(source,context);

const printedHisTable=`
Insulin human (recombinant) (30% soluble
insulin neutral và 70% isophane insulin)
(Wosulin 30 / 70 TTK N - 25) 100IU/ml x 3ml
Metformin (Metformin Stella 850mg TTK N-25) 850mg
Atorvastatin (Atoris 10mg) 10mg
Metoprolol (Betaloc Zok 50mg) 50mg
`;
const entry={
  id:'rx-file-test',name:'Đơn thử nghiệm',title:'Đơn thuốc BHYT',payment:'BHYT'
};
const drugs=context.window.__rxOcrDrugTest.matchDrugsFromText(printedHisTable,entry);
const names=drugs.map(drug=>drug.name);

assert.deepStrictEqual(Array.from(names),[
  'Wosulin 30/70 TTKN-25',
  'Metformin Stella 850 mg TTKN-25',
  'Atoris 10mg',
  'Betaloc Zok 50mg'
]);
assert.strictEqual(new Set(names).size,4,'Ba lượt OCR không được tạo thuốc trùng');
console.log('Prescription OCR drug completeness tests: OK');
