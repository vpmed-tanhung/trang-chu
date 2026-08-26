'use strict';

const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const root=path.resolve(__dirname,'..');
const ctx={window:{}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/rx-official-sources.js'),'utf8'),ctx);

const sources=ctx.window.VPMED_RX_OFFICIAL_SOURCES;
const api=ctx.window.VPMED_RX_OFFICIAL_SOURCE_API;
assert(Array.isArray(sources)&&sources.length>=11,'Registry nguồn chính thức chưa đầy đủ');
assert(api&&typeof api.footerLabels==='function'&&typeof api.profileEvidence==='function','Thiếu API nguồn chính thức');

for(const id of ['DAV-APPROVED-LABELS','DTQGVN-III-QD3445','KCB-GUIDELINES','QD5948-QD-BYT','TT06-2026-TT-BYT','TT26-2025-TT-BYT','TT20-2022-TT-BYT','TT37-2024-TT-BYT','TT01-2025-TT-BYT','ND188-2025-ND-CP']){
  assert(sources.some(source=>source.id===id),`Thiếu nguồn ${id}`);
}

const labels=api.footerLabels();
assert(labels.interaction.includes('QĐ 5948/QĐ-BYT'));
assert(labels.icd.includes('TT06/2026/TT-BYT'));
assert(labels.icd.includes('HDSD/SPC Cục QLD'));
assert(labels.icd.includes('Dược thư QGVN III'));
assert(labels.prescribing.includes('TT26/2025/TT-BYT'));
assert(labels.bhyt.includes('TT20/2022/TT-BYT'));
assert(labels.bhyt.includes('TT37/2024/TT-BYT'));
assert(labels.bhyt.includes('TT01/2025/TT-BYT'));
assert(labels.bhyt.includes('NĐ188/2025/NĐ-CP'));

console.log('OK: official source registry',sources.length);
