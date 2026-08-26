'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const matcher=require('../assets/icd-clinical-match.js');

const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve('../assets/icd10_name_map_2026.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(require.resolve('../assets/drug_profiles_305_vpmed_20260710.js'),'utf8'),context);

const nameMap=context.window.VPMED_ICD10_NAME_MAP_2026;
const profiles=context.window.VPMED_FULL_DRUG_PROFILES_305;

function classify(brand,codes){
  const profile=profiles.find(item=>(item.brands||[]).includes(brand));
  assert(profile,`Không tìm thấy hồ sơ ${brand}`);
  const mappings=profile.icdMappings||[];
  const allowed=[...new Set(mappings.flatMap(mapping=>mapping.codes||[]))];
  const match=matcher.matchAny(codes,allowed);
  if(match.matched)return 'matched';
  const observedLabels=codes.map(code=>nameMap[code]||code);
  const targets=[...mappings.map(mapping=>mapping.term),...(profile.indications||[])];
  return matcher.isClinicalTextRelated(observedLabels,targets)?'related':'missing';
}

// Ca ảnh 1+2: có mã bệnh trong đơn nhưng không có mã tương ứng với Vorifend 500.
assert.strictEqual(
  classify('Vorifend 500',['I10','R07.3','I67.9','R00.0','E78.2']),
  'missing'
);

// Ca ảnh 3: Ceginkton có chẩn đoán mạch máu não liên quan, nhưng chưa khớp R42/R41.8.
assert.strictEqual(
  classify('Ceginkton',['E11.7','I10','R00.0','E78.2','I67.9']),
  'related'
);

// Khi có mã được đối chiếu phù hợp thì không được cảnh báo thiếu/chưa phù hợp.
assert.strictEqual(classify('Ceginkton',['R42','I10']),'matched');
assert.strictEqual(classify('Vorifend 500',['M17.9','I10']),'matched');

console.log('Prescription ICD status tests: OK');
