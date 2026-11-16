const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
(async()=>{const listeners={};let body,calls=0;const window={VPMED_AUTH:{client:{auth:{getSession:async()=>({data:{session:{access_token:'test-token'}}})}}}};
vm.runInNewContext(fs.readFileSync('assets/admin-ai-feedback.js','utf8'),{window,document:{addEventListener:(name,fn)=>listeners[name]=fn},Date,AbortSignal,fetch:async(url,opts)=>{calls++;body=JSON.parse(opts.body);return {ok:true};}});
listeners.change({target:{matches:()=>true,get value(){throw Error('Clinical field must not be read');}}});await new Promise(resolve=>setImmediate(resolve));
assert.equal(calls,1);assert.deepEqual(body,{module_id:'prescription',field_name:'drug_name',error_kind:'changed'});
listeners.change({target:{matches:()=>false}});assert.equal(calls,1);
console.log('Admin AI: edit telemetry never reads or sends medical field values.');
})().catch(e=>{console.error(e);process.exitCode=1;});
