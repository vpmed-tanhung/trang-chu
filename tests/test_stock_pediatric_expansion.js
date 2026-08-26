const assert=require('assert');

global.window={};
require('../assets/stock_clinical_data_20260814.js');
const data=global.window.VPMED_STOCK_CLINICAL;

assert.strictEqual(data.meta.generatedAt,'2026-08-22');
assert.strictEqual(data.meta.counts.pediatricActives,16);
assert.strictEqual(data.meta.counts.pediatricStockProducts,26);

const expected={
  amikacin:'TD30-003208',
  cefixime:'TD29-000023',
  cefotaxime:'TD29-000014',
  cefpodoxime:'TD30-003873',
  'imipenem-cilastatin':'CEPE001'
};

for(const [id,code] of Object.entries(expected)){
  const drug=data.pediatric.find((item)=>item.id===id);
  assert.ok(drug,`Thiếu hoạt chất ${id}`);
  assert.ok(drug.stockCodes.includes(code),`${id} chưa nối đúng mã kho ${code}`);
  assert.ok(drug.stock.some((item)=>item.code===code),`${id} thiếu chi tiết thuốc kho ${code}`);
  assert.ok(drug.sources.length>0,`${id} thiếu nguồn tính liều trực tiếp`);
}

const amikacin=data.pediatric.find((item)=>item.id==='amikacin');
assert.strictEqual(amikacin.neonatalRules.length,6);
assert.ok(amikacin.neonatalNote.includes('Không kê đồng thời amikacin với gentamicin'));

const cefixime=data.pediatric.find((item)=>item.id==='cefixime');
assert.deepStrictEqual(cefixime.childRules.map((rule)=>[rule.doseMgKg,rule.intervalHours,rule.maxMg]),[[8,24,400],[4,12,200]]);

const cefotaxime=data.pediatric.find((item)=>item.id==='cefotaxime');
assert.deepStrictEqual(cefotaxime.childRules.map((rule)=>[rule.doseMgKg,rule.intervalHours]),[[50,8],[50,6]]);

const cefpodoxime=data.pediatric.find((item)=>item.id==='cefpodoxime');
assert.deepStrictEqual(cefpodoxime.childRules.map((rule)=>rule.maxMg),[200,100]);

const imipenem=data.pediatric.find((item)=>item.id==='imipenem-cilastatin');
assert.deepStrictEqual(imipenem.childRules.map((rule)=>[rule.doseMgKg,rule.intervalHours,rule.maxMg]),[[15,6,1000],[25,6,1000]]);
assert.ok(imipenem.contraindicationNote.includes('Không dùng cho viêm màng não'));

console.log('Pediatric antibiotic expansion tests passed.');
