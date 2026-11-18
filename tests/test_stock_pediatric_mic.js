'use strict';

const assert=require('node:assert/strict');
require('../assets/stock_pediatric_mic.js');
const {assess,groupForDrug}=globalThis.VPMED_PEDIATRIC_MIC;

assert.equal(groupForDrug('amoxicillin-clavulanate'),'beta');
assert.equal(groupForDrug('amikacin'),'peak');
assert.equal(groupForDrug('ciprofloxacin'),'auc');
assert.equal(groupForDrug('vancomycin'),'vancomycin');
assert.equal(groupForDrug('trimethoprim-sulfamethoxazole'),'other');

const beta={drugId:'meropenem',mic:'0,5',exposure:'6',interval:'8'};
assert.equal(assess(beta).value,75);
assert.equal(assess({...beta,exposure:'0'}).value,0);
assert.equal(assess({...beta,exposure:'8'}).value,100);
assert.equal(assess({...beta,exposure:'9'}).value,undefined);
assert.equal(assess({...beta,interval:'0'}).value,undefined);
assert.equal(assess({...beta,operator:'≤'}).value,undefined);
assert.equal(assess({...beta,mic:'≤0,5'}).value,undefined);
assert.equal(assess({...beta,mic:'-1'}).value,undefined);
assert.equal(assess({...beta,mic:'0'}).value,undefined);
assert.equal(assess({...beta,category:'R',mic:''}).block,true);
assert.equal(assess({...beta,category:'no-breakpoint'}).block,true);
assert.match(assess({...beta,category:'I-eucast'}).categoryNotice,/tăng phơi nhiễm/);
assert.match(assess({...beta,category:'I-clsi'}).categoryNotice,/CLSI/);
assert.equal(assess({...beta,category:'SDD'}).estimate,undefined);

assert.equal(assess({drugId:'amikacin',mic:'2',exposure:'18'}).value,9);
assert.equal(assess({drugId:'ciprofloxacin',mic:'0.25',exposure:'25'}).value,100);
assert.equal(assess({drugId:'metronidazole',mic:'1',exposure:'10'}).value,undefined);

const vanco={drugId:'vancomycin',category:'S',mic:'1',exposure:'375',currentDaily:'900',
  severeMrsaBmd:true,stableMaintenance:true,ageMode:'child',ageMonths:24,weight:20};
assert.equal(assess(vanco).value,375);
assert.equal(assess(vanco).estimate,1200);
assert.equal(assess({...vanco,exposure:'750'}).estimate,600);
assert.equal(assess({...vanco,exposure:'400'}).estimate,undefined);
assert.equal(assess({...vanco,exposure:'600'}).estimate,undefined);
assert.equal(assess({...vanco,mic:'2'}).value,187.5);
for(const scenario of [
  {mic:'2'},{mic:'0.5'},{operator:'≤'},{category:'I-eucast'},{category:''},{severeMrsaBmd:false},
  {stableMaintenance:false},{ageMode:'neonate'},{ageMonths:2},{weight:10},{exposure:'100'},
  {currentDaily:'3001',weight:80},{currentDaily:'0'},{currentDaily:''}
]){
  assert.equal(assess({...vanco,...scenario}).estimate,undefined,JSON.stringify(scenario));
}
console.log('Pediatric MIC and TDM tests passed.');
