export const FIELDS=['code','name','active','pack','route','routeBHYT','regNumber','concentration','strength','manufacturer','country','unit','dosageForm','category','note','ids','lots','expiry','id','lotCount'];
const required=['code','name','active','strength','route'];
const identity=['name','active','strength','route','regNumber'];
const clone=x=>JSON.parse(JSON.stringify(x));
export const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export async function sha256(value){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function mergeLots(old,incoming){
 const result=clone(old),seen=new Map();
 for(const lot of incoming){
  const key=JSON.stringify([lot.idThuoc,lot.lot||'']);
  if(seen.has(key)&&!same(seen.get(key),lot))throw Error('SOURCE_LOT_CONFLICT');seen.set(key,lot);
  const matches=result.map((x,i)=>[x,i]).filter(([x])=>x.idThuoc===lot.idThuoc&&(!lot.lot||x.lot===lot.lot));
  if(matches.length>1)throw Error('LOT_IDENTITY_AMBIGUOUS');
  if(matches.length)Object.assign(result[matches[0][1]],lot);else result.push(clone(lot));
 }return result;
}
export function normalizeCatalog(rows,baseline){
 if(!Array.isArray(baseline)||!baseline.length||baseline.length>20000)throw Error('INVALID_BASELINE');
 const old=new Map(),ids=new Set();
 for(const item of baseline){if(!item.code||!Number.isSafeInteger(item.id)||old.has(item.code)||ids.has(item.id))throw Error('BASELINE_ID_CONFLICT');old.set(item.code,clone(item));ids.add(item.id);}
 const groups=new Map(),issues=[],held=new Set();
 for(const {row,values:v} of rows){const code=v.code||'';if(code){if(!groups.has(code))groups.set(code,[]);groups.get(code).push({row,values:v});}
  const missing=[...required,'idThuoc'].filter(f=>!v[f]);if(missing.length){if(code)held.add(code);issues.push({type:'REQUIRED_VALUE_MISSING',row,code,name:v.name||'',fields:missing});}}
 for(const [code,entries] of groups){
  for(const field of identity){const values=new Set(entries.filter(x=>field in x.values).map(x=>x.values[field]));if(values.size>1){held.add(code);issues.push({type:'IDENTITY_CONFLICT',code,fields:[field],rows:entries.map(x=>x.row)});}}
  const incoming=[];
  for(const {values:v} of entries){const lot={idThuoc:v.idThuoc||''};for(const f of ['lot','expiry'])if(v[f])lot[f]=v[f];if(!incoming.some(x=>same(x,lot)))incoming.push(lot);}
  if(!held.has(code)){try{mergeLots(old.get(code)?.lots||[],incoming);}catch(e){held.add(code);issues.push({type:e.message,code,fields:['lots'],rows:entries.map(x=>x.row)});}}
 }
 const records=new Map([...old].map(([k,v])=>[k,clone(v)]));let next=Math.max(...ids)+1;const eligible=[];
 for(const code of [...groups.keys()].sort()){
  if(held.has(code))continue;const entries=groups.get(code),existing=old.get(code);
  const item=existing?clone(existing):Object.fromEntries(FIELDS.map(f=>[f,['ids','lots'].includes(f)?[]:f==='id'||f==='lotCount'?0:'']));
  const first=entries[0].values;
  for(const [f,v] of Object.entries(first))if(FIELDS.includes(f)&&!['id','ids','lots','lotCount','expiry'].includes(f))item[f]=v;
  if(!existing)item.id=next++;
  const lots=[];for(const {values:v} of entries){const lot={idThuoc:v.idThuoc};for(const f of ['lot','expiry'])if(v[f])lot[f]=v[f];if(!lots.some(x=>same(x,lot)))lots.push(lot);}
  item.lots=mergeLots(existing?.lots||[],lots);item.ids=[...new Set([...(existing?.ids||[]),...lots.map(x=>x.idThuoc)])];item.lotCount=item.lots.length;
  const expires=[...new Set(item.lots.map(x=>x.expiry).filter(Boolean))];item.expiry=expires.length===1?expires[0]:'';
  records.set(code,item);eligible.push(code);
 }
 const output=[...records.values()].sort((a,b)=>a.id-b.id),diff=[];
 for(const code of eligible){const a=old.get(code)||{},b=records.get(code);const fields=FIELDS.filter(f=>!same(a[f],b[f]));if(fields.length)diff.push({code,name:b.name,action:old.has(code)?'update':'add',fields,before:a,after:b});}
 const quarantine=rows.filter(x=>!x.values.code||held.has(x.values.code)).map(x=>({row:x.row,code:x.values.code||'',name:x.values.name||'',fields:issues.filter(i=>i.row===x.row||i.rows?.includes(x.row)).flatMap(i=>i.fields||[]),state:'needs_source_verification'}));
 return {import_scope:'partial_overlay',records:output,diff,eligible_update_codes:eligible,quarantined_rows:quarantine,quarantine_issues:issues,
  retained_baseline_codes:[...old.keys()].filter(x=>!eligible.includes(x)),baseline_codes_absent_from_source:[...old.keys()].filter(x=>!groups.has(x)),
  blockers:eligible.length?[]:[{type:'NO_ELIGIBLE_SOURCE_ROWS'}],clinical_review_required:true,is_production_release:false};
}
export const HEADER_MAP={ID_THUOC:'idThuoc',MA_THUOC:'code',TEN_THUOC:'name',HSD:'expiry',HOAT_CHAT:'active',QUY_CACH:'pack',DUONG_DUNG:'route',HAM_LUONG:'strength',MA_DUONGDUNG_BHYT:'routeBHYT',SODANGKY:'regNumber',NONG_DO:'concentration',HANGSX:'manufacturer',NUOCSX:'country',DONVI:'unit',DANG_BAO_CHE:'dosageForm',GHI_CHU:'note',SOLO:'lot'};
export function rowsFromGrid(grid){
 const rowIndex=grid.slice(0,15).findIndex(r=>r.includes('MA_THUOC')&&r.includes('TEN_THUOC')&&r.includes('HOAT_CHAT'));
 if(rowIndex<0)throw Error('CATALOG_HEADER_NOT_FOUND');
 const headers=grid[rowIndex];for(const h of ['MA_THUOC','TEN_THUOC','HOAT_CHAT','HAM_LUONG','DUONG_DUNG','ID_THUOC'])if(headers.filter(x=>x===h).length!==1)throw Error('CATALOG_HEADER_AMBIGUOUS');
 const result=[];
 for(let i=rowIndex+1;i<grid.length;i++){const cells=grid[i];if(!cells.some(v=>v!==null&&v!==undefined&&String(v).trim()))continue;
  const values={};headers.forEach((h,c)=>{const field=HEADER_MAP[h];if(field)values[field]=String(cells[c]??'').normalize('NFC').trim();});
  result.push({row:i+1,values});
 }if(result.length>10000)throw Error('TOO_MANY_ROWS');return result;
}
const domains=['moh.gov.vn','dav.gov.vn','vanban.chinhphu.vn','congbao.chinhphu.vn','canhgiacduoc.org.vn'];
export function officialUrl(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!domains.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw Error('OFFICIAL_SOURCE_REQUIRED');return u.href;}
export function safeAiAdvice(data,rows){
 if(!data||typeof data.summary!=='string'||data.summary.length>4000)throw Error('INVALID_AI_OUTPUT');
 const permitted=new Set(rows.map(r=>r.row));const notes=Array.isArray(data.notes)?data.notes:[];
 for(const n of notes)if(!permitted.has(n.source_row)||typeof n.reason!=='string'||n.reason.length>1600)throw Error('AI_SOURCE_REFERENCE_INVALID');
 return {summary:data.summary,notes:notes.map(n=>({source_row:n.source_row,reason:n.reason,action:['verify_source','classify_item','keep_pending'].includes(n.action)?n.action:'keep_pending'}))};
}
