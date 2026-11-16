export const REPO='vpmed-tanhung/trang-chu';
export const AUDIENCE='vpmed-admin-publisher';
export async function verifyGithubToken(token,fetchKeys=async()=>{const r=await fetch('https://token.actions.githubusercontent.com/.well-known/jwks');if(!r.ok)throw Error('OIDC_KEYS_UNAVAILABLE');return r.json();}){
 if(typeof token!=='string'||token.length>18000)throw Error('INVALID_OIDC');
 const parts=token.split('.');if(parts.length!==3)throw Error('INVALID_OIDC');
 const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const head=JSON.parse(new TextDecoder().decode(bytes(parts[0]))),p=JSON.parse(new TextDecoder().decode(bytes(parts[1])));
 if(head.alg!=='RS256'||typeof head.kid!=='string')throw Error('INVALID_OIDC_ALGORITHM');
 const set=await fetchKeys(),jwk=set.keys.find(x=>x.kid===head.kid);if(!jwk)throw Error('INVALID_OIDC_KEY');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error('INVALID_OIDC_SIGNATURE');
 const now=Date.now()/1000;
 if(!Number.isFinite(p.exp)||p.exp<now||!Number.isFinite(p.iat)||p.iat>now+60||p.nbf&&p.nbf>now+60)throw Error('OIDC_EXPIRED');
 if(p.iss!=='https://token.actions.githubusercontent.com'||p.aud!==AUDIENCE||p.repository!==REPO||String(p.repository_id)!=='1319795292'||p.ref!=='refs/heads/main')throw Error('OIDC_SCOPE_DENIED');
 const expected=REPO+'/.github/workflows/admin-ai-publish.yml@refs/heads/main';
 if((p.workflow_ref||p.job_workflow_ref)!==expected||!['schedule','workflow_dispatch'].includes(p.event_name))throw Error('OIDC_WORKFLOW_DENIED');
 return {run_id:p.run_id,repository:p.repository};
}
