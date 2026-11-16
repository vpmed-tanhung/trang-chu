/* Metadata only: no OCR text, patient/staff identifiers, medicine values or files. */
(function(){'use strict';let sent=0,last=0;
window.addEventListener('vpmed:ocr-correction',async event=>{
 const v=event.detail||{};if(v.module_id!=='prescription'||v.field_name!=='drug_name'||!['changed','removed'].includes(v.error_kind))return;
 if(sent>=10||Date.now()-last<2000)return;
 const client=window.VPMED_AUTH?.client;if(!client)return;
 last=Date.now();sent++;
 try{const {data}=await client.auth.getSession();if(!data.session)return;
  await fetch('https://jaswtdcgrfbygmdxvumu.supabase.co/functions/v1/admin-ai/feedback',{method:'POST',headers:{'Content-Type':'application/json',apikey:'sb_publishable_O6LzzHIKE9nWoSxhLQNlsw_shxEqdLC',Authorization:'Bearer '+data.session.access_token},
   body:JSON.stringify({module_id:'prescription',field_name:'drug_name',error_kind:v.error_kind}),signal:AbortSignal.timeout(5000)});
 }catch{/* Feedback never blocks clinical work. */}
});})();
