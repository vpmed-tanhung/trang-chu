(async()=>{
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),url=require('node:url');
const root=path.resolve(__dirname,'..'),mod=p=>import(url.pathToFileURL(path.join(root,p)));
const core=await mod('supabase/functions/admin-ai/core.mjs'),XLSX=await mod('supabase/functions/admin-ai/xlsx.mjs');
const sheet=XLSX.read(fs.readFileSync(path.join(root,'sources/danh_muc_thuoc_kho_noi_tru_20260814.xls')),{type:'buffer'});
const rows=core.rowsFromGrid(XLSX.utils.sheet_to_json(sheet.Sheets.Data,{header:1,raw:false,defval:''}));
let baseline;
try {baseline=require('node:child_process').execFileSync('git',['show','175274a5825c96c3db09b74f83931add68cf9313:data/inpatient_medicines_20260707.json'],{cwd:root,stdio:['ignore','pipe','pipe']}).toString('utf8');}
catch {baseline=fs.readFileSync(path.join(root,'data/inpatient_medicines_20260707.json'),'utf8');}
const base=JSON.parse(baseline);assert.equal(base.length,309,'Pinned baseline history is required');
const c=core.normalizeCatalog(rows,base);
assert.equal(c.records.length,336);assert.equal(c.diff.length,127);assert.equal(c.quarantined_rows.length,10);
assert.equal(c.retained_baseline_codes.length,37);assert.equal(c.baseline_codes_absent_from_source.length,29);
const kept=new Map(base.map(x=>[x.code,x]));for(const r of c.records)if(c.retained_baseline_codes.includes(r.code))assert.deepEqual(r,kept.get(r.code));
assert.throws(()=>core.officialUrl('https://moh.gov.vn.evil.example/file'));assert.throws(()=>core.officialUrl('http://moh.gov.vn/file'));
assert.throws(()=>core.safeAiAdvice({summary:'x',notes:[{source_row:999,reason:'x'}]},[{row:10}]));
const {verifyGithubToken}=await mod('supabase/functions/admin-ai/security.mjs');
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='test';
const sign=async claims=>{const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');const input=enc({alg:'RS256',kid:'test'})+'.'+enc(claims);return input+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,Buffer.from(input))).toString('base64url');};
const now=Math.floor(Date.now()/1000),claims={iss:'https://token.actions.githubusercontent.com',aud:'vpmed-admin-publisher',repository:'vpmed-tanhung/trang-chu',repository_id:'1319795292',ref:'refs/heads/main',event_name:'schedule',workflow_ref:'vpmed-tanhung/trang-chu/.github/workflows/admin-ai-publish.yml@refs/heads/main',iat:now,exp:now+300};
const keys=async()=>({keys:[jwk]});await verifyGithubToken(await sign(claims),keys);
for(const bad of [{repository:'wrong/repo'},{ref:'refs/heads/attacker'},{event_name:'pull_request'},{workflow_ref:'wrong'},{exp:now-1},{aud:'wrong'}])await assert.rejects(()=>sign({...claims,...bad}).then(t=>verifyGithubToken(t,keys)));
const token=await sign(claims);await assert.rejects(()=>verifyGithubToken(token.slice(0,-5)+'AAAAA',keys));
console.log('Admin AI: real XLS scope A, retained baseline, source allowlist, AI references and signed publisher authorization passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
