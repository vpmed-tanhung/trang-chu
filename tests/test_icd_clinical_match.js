'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const matcher=require('../assets/icd-clinical-match.js');

assert.strictEqual(matcher.matchAny(['E11.7'],['E10.9','E11.9']).matched,true);
assert.strictEqual(matcher.matchAny(['E11.7'],['E10.9','E11.9']).mode,'category');
assert.strictEqual(matcher.matchAny(['E78.2'],['I25.1','E78.0','E78.5']).matched,true);
assert.strictEqual(matcher.matchAny(['E78.2'],['I25.1','E78.0','E78.5']).mode,'category');
assert.strictEqual(matcher.matchAny(['E78.2'],['E78.2']).mode,'exact');

// Không mở rộng thiếu kiểm soát chỉ vì có cùng ba ký tự đầu.
assert.strictEqual(matcher.matchAny(['I25.0'],['I25.1']).matched,false);
assert.strictEqual(matcher.matchAny(['B18.2'],['B18.1']).matched,false);

assert.ok(matcher.SOURCES.some(source=>source.authority==='Bộ Y tế'));
assert.ok(matcher.SOURCES.some(source=>source.authority.includes('Cục Quản lý Dược')));
assert.ok(matcher.SOURCES.some(source=>source.id==='TT06-2026-TT-BYT'&&source.url==='https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt.pdf'));
assert.ok(matcher.SOURCES.some(source=>source.id==='TT06-2026-ICD10-APPENDIX'&&source.url==='https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt-kem.pdf'));
assert.ok(!matcher.SOURCES.some(source=>/moh\.gov\.vn\/index\.jsp|asset_publisher/i.test(source.url||'')));

const context={window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve('../assets/icd10_verified_profiles_20260710.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(require.resolve('../assets/drug_profiles_305_vpmed_20260710.js'),'utf8'),context);
const verified=context.window.VPMED_VERIFIED_DRUG_PROFILES;
const full=context.window.VPMED_FULL_DRUG_PROFILES_305;
const lipidProfile=verified.find(profile=>profile.key==='atorvastatin');
const antiplateletProfile=verified.find(profile=>profile.key==='acetylsalicylic_acid');
const insulinProfile=verified.find(profile=>profile.key==='human_insulin_biphasic_30_70');
const losartanProfile=verified.find(profile=>profile.key==='losartan');
assert.ok(lipidProfile.icdMappings.flatMap(mapping=>mapping.codes).includes('E78.2'));
assert.ok(antiplateletProfile.icdMappings.flatMap(mapping=>mapping.codes).includes('I63.9'));
assert.strictEqual(matcher.matchAny(['E11.7'],insulinProfile.icdMappings.flatMap(mapping=>mapping.codes)).matched,true);
assert.ok(!losartanProfile.icdMappings.flatMap(mapping=>mapping.codes).includes('A22.9'));

const profilesToReview=[
  lipidProfile,
  antiplateletProfile,
  insulinProfile,
  losartanProfile,
  full.find(profile=>(profile.brands||[]).includes('Amlodipine 5 mg Cap'))
];
const syntheticDiagnosisCodes=['E11.7','E78.2','I10','I25.0','I63.9'];
for(const profile of profilesToReview){
  const allowed=profile.icdMappings.flatMap(mapping=>mapping.codes||[]);
  assert.strictEqual(matcher.matchAny(syntheticDiagnosisCodes,allowed).matched,true,profile.key||profile.active);
}
console.log('ICD clinical match tests: OK');
