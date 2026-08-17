/*
 * Rà soát đơn thuốc BHYT & dịch vụ
 * - Đối chiếu tương tác theo VPMED_INTERACTIONS (QĐ 5948/QĐ-BYT)
 * - Cảnh báo thuốc BHYT chưa có mã bệnh nằm trong hồ sơ ICD gợi ý của thuốc
 * - OCR ảnh chỉ hỗ trợ nhập liệu; nhân viên y tế phải xác nhận tên thuốc
 */
(function prescriptionCheckModule(){
  'use strict';

  const rx$=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const norm=value=>String(value||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .replace(/[^a-z0-9]+/g,' ')
    .trim();
  const unique=items=>[...new Set((items||[]).filter(Boolean))];
  const state={
    drugs:[],files:[],lastCheck:null,nextId:1,nextFileId:1,
    diagnosis:{primary:[],secondary:[],source:'Chờ OCR',conflicts:[],manual:false}
  };
  let dataPromise=null;

  function normalizePayment(value){
    const normalized=norm(value);
    if(/\b(dich vu|service|tu tuc|thu phi|ngoai bhyt|khong bhyt)\b/.test(normalized)||normalized==='dv')return 'Dịch vụ';
    if(/\b(bhyt|bao hiem y te|bao hiem)\b/.test(normalized))return 'BHYT';
    return 'Chưa xác định';
  }

  function paymentClass(payment){
    if(payment==='BHYT')return 'rx-payment-bhyt';
    if(payment==='Dịch vụ')return 'rx-payment-service';
    return 'rx-payment-unknown';
  }

  function paymentTagClass(payment){
    if(payment==='BHYT')return 'bhyt';
    if(payment==='Dịch vụ')return 'service';
    return 'unknown';
  }

  function setDataState(kind,title,note){
    const box=rx$('#rxDataState');
    if(!box)return;
    box.className=`rx-data-state ${kind||''}`.trim();
    box.innerHTML=`<span class="rx-data-dot"></span><div><b>${esc(title)}</b>${note?`<small>${esc(note)}</small>`:''}</div>`;
  }

  function loadScript(src,ready){
    if(ready())return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(script=>script.src.endsWith(src));
      if(existing){
        existing.addEventListener('load',()=>ready()?resolve():reject(new Error(`Không đọc được ${src}`)),{once:true});
        existing.addEventListener('error',()=>reject(new Error(`Không tải được ${src}`)),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;
      script.defer=true;
      script.onload=()=>ready()?resolve():reject(new Error(`Không đọc được ${src}`));
      script.onerror=()=>reject(new Error(`Không tải được ${src}`));
      document.head.appendChild(script);
    });
  }

  function ensureData(){
    if(dataPromise)return dataPromise;
    setDataState('','Đang chuẩn bị dữ liệu','');
    dataPromise=Promise.all([
      loadScript('assets/inpatient_medicines_20260707.js',()=>Array.isArray(window.VPMED_INPATIENT_MEDICINES_20260707)),
      loadScript('assets/drug_profiles_305_vpmed_20260710.js',()=>Array.isArray(window.VPMED_FULL_DRUG_PROFILES_305)),
      loadScript('assets/icd10_verified_profiles_20260710.js',()=>Array.isArray(window.VPMED_VERIFIED_DRUG_PROFILES)),
      loadScript('assets/icd10_code_index_2026.js',()=>Array.isArray(window.VPMED_ICD10_CODE_INDEX_2026))
    ]).then(()=>{
      const meds=getMeds();
      const profiles=getProfiles();
      const interactions=getInteractions();
      populateDrugOptions();
      setDataState('ready','Dữ liệu sẵn sàng','');
      return {meds,profiles,interactions};
    }).catch(error=>{
      dataPromise=null;
      setDataState('error','Không tải đủ dữ liệu',error.message||'Vui lòng tải lại trang');
      throw error;
    });
    return dataPromise;
  }

  function getMeds(){return window.VPMED_INPATIENT_MEDICINES_20260707||[]}
  function getProfiles(){return window.VPMED_FULL_DRUG_PROFILES_305||[]}
  function getVerifiedProfiles(){return window.VPMED_VERIFIED_DRUG_PROFILES||[]}
  function getInteractions(){return window.VPMED_INTERACTIONS||[]}

  function populateDrugOptions(){
    const list=rx$('#rxDrugOptions');
    if(!list)return;
    list.innerHTML=getMeds().map(med=>`<option value="${esc(med.name)}">${esc(med.active)} · ${esc(med.strength||med.regNumber||'')}</option>`).join('');
  }

  function scoreCandidate(query,candidate,weight){
    if(!query||!candidate)return 0;
    if(query===candidate)return 100+weight;
    if(query.startsWith(candidate+' ')||query.endsWith(' '+candidate))return 82+weight+Math.min(candidate.length,20)/10;
    if(query.includes(candidate))return 68+weight+Math.min(candidate.length,20)/10;
    if(candidate.includes(query)&&query.length>=5)return 48+weight+Math.min(query.length,20)/10;
    return 0;
  }

  function findMedicine(raw){
    const query=norm(raw);
    if(!query)return null;
    let best=null,bestScore=0;
    getMeds().forEach(med=>{
      const fields=[
        [med.name,16],[med.code,12],[med.regNumber,12],[med.active,5]
      ];
      fields.forEach(([value,weight])=>{
        const score=scoreCandidate(query,norm(value),weight);
        if(score>bestScore){best=med;bestScore=score}
      });
    });
    return bestScore>=55?best:null;
  }

  function tokenKey(value){return norm(value).split(' ').filter(Boolean).sort().join(' ')}

  function findBaseProfile(med,raw){
    const reg=norm(med?.regNumber);
    if(reg){
      const byRegistration=getProfiles().find(profile=>(profile.regNumbers||[]).some(number=>norm(number)===reg));
      if(byRegistration)return byRegistration;
    }
    const names=unique([med?.name,raw]).map(norm).filter(Boolean);
    const byBrand=getProfiles().find(profile=>(profile.brands||[]).some(brand=>names.includes(norm(brand))));
    if(byBrand)return byBrand;
    const active=norm(med?.active);
    if(active)return getProfiles().find(profile=>norm(profile.active)===active)||null;
    return null;
  }

  function findVerifiedProfile(med,base){
    const reg=norm(med?.regNumber);
    if(reg){
      const byRegistration=getVerifiedProfiles().find(profile=>(profile.regNumbers||[]).some(number=>norm(number)===reg));
      if(byRegistration)return byRegistration;
    }
    const activeKeys=unique([med?.active,base?.active]).map(tokenKey).filter(Boolean);
    return getVerifiedProfiles().find(profile=>(profile.aliases||[]).some(alias=>activeKeys.includes(tokenKey(alias))))||null;
  }

  function findProfile(med,raw){
    const base=findBaseProfile(med,raw);
    const verified=findVerifiedProfile(med,base);
    if(!verified)return base;
    return {
      ...(base||{}),
      ...verified,
      active:base?.active||med?.active||verified.key||'',
      brands:base?.brands||[],
      regNumbers:unique([...(base?.regNumbers||[]),...(verified.regNumbers||[])]),
      verifiedSourcePack:true
    };
  }

  function resolvedDrug(rawName,payment,source={}){
    const med=findMedicine(rawName);
    const profile=findProfile(med,rawName);
    return {
      id:state.nextId++,
      rawName:String(rawName||'').trim(),
      name:med?.name||String(rawName||'').trim(),
      active:med?.active||profile?.active||'',
      strength:med?.strength||profile?.strength||'',
      route:med?.route||profile?.route||'',
      payment:normalizePayment(payment),
      sourceId:source.sourceId||'',
      sourceName:source.sourceName||'Nhập thủ công',
      sourceTitle:source.sourceTitle||'',
      med,
      profile,
      resolved:Boolean(med)
    };
  }

  function refreshDrug(drug,newName){
    const payment=drug.payment;
    const next=resolvedDrug(newName,payment,{sourceId:drug.sourceId,sourceName:drug.sourceName,sourceTitle:drug.sourceTitle});
    next.id=drug.id;
    return next;
  }

  function markStale(){
    if(!state.lastCheck)return;
    state.lastCheck=null;
    rx$('#rxResultTitle').textContent='Dữ liệu đã thay đổi';
    rx$('#rxScore').innerHTML='<b>—</b><small>/100</small>';
    rx$('#rxResultBody').innerHTML='<div class="rx-result-empty"><span>↻</span><b>Cần kiểm tra lại</b><p>Danh sách thuốc hoặc mã bệnh đã thay đổi từ lần rà soát gần nhất.</p></div>';
  }

  function renderRows(){
    const body=rx$('#rxDrugRows');
    if(!body)return;
    if(!state.drugs.length){
      body.innerHTML='<tr><td colspan="6" class="rx-empty-row">Chưa có thuốc. Tải đơn, dán dữ liệu HIS hoặc thêm thủ công.</td></tr>';
    }else{
      body.innerHTML=state.drugs.map((drug,index)=>`
        <tr data-rx-row="${drug.id}">
          <td><input class="rx-drug-name-input" data-rx-name="${drug.id}" list="rxDrugOptions" value="${esc(drug.name||drug.rawName)}" aria-label="Tên thuốc dòng ${index+1}"><span class="rx-active-name">${esc(drug.active||'Chưa xác định hoạt chất')}</span></td>
          <td>${esc(drug.strength||'—')}</td>
          <td>${esc(drug.route||'—')}</td>
          <td><select class="${paymentClass(drug.payment)}" data-rx-payment="${drug.id}" aria-label="Nguồn chi trả dòng ${index+1}"><option${drug.payment==='BHYT'?' selected':''}>BHYT</option><option${drug.payment==='Dịch vụ'?' selected':''}>Dịch vụ</option><option${drug.payment==='Chưa xác định'?' selected':''}>Chưa xác định</option></select></td>
          <td><span class="rx-resolve-state ${drug.resolved?'ok':'review'}">${drug.resolved?'✓ Đã chuẩn hóa':'! Cần xác nhận'}</span></td>
          <td><button class="rx-remove-drug" data-rx-remove="${drug.id}" type="button" title="Xóa thuốc" aria-label="Xóa thuốc dòng ${index+1}">×</button></td>
        </tr>`).join('');
    }
    const unclassified=state.drugs.filter(drug=>drug.payment==='Chưa xác định').length;
    rx$('#rxDrugCount').textContent=`${state.drugs.length} thuốc · ${state.drugs.filter(drug=>drug.payment==='BHYT').length} BHYT · ${state.drugs.filter(drug=>drug.payment==='Dịch vụ').length} dịch vụ${unclassified?` · ${unclassified} chưa xác định`:''}`;
  }

  function parsePayment(line){
    const normalized=norm(line);
    if(/\b(dich vu|service|tu tuc)\b/.test(normalized)||/(^|[|;\t\s])dv($|[|;\t\s])/.test(normalized))return 'Dịch vụ';
    return 'BHYT';
  }

  function bestMedicineInLine(line){
    const normalized=norm(line);
    let best=null,bestLength=0;
    getMeds().forEach(med=>{
      [med.name,med.active].forEach((value,index)=>{
        const key=norm(value);
        const min=index===0?4:7;
        if(key.length>=min&&normalized.includes(key)&&key.length>bestLength){best=med;bestLength=key.length}
      });
    });
    return best;
  }

  function parseDrugLines(text,source={sourceId:'his-paste',sourceName:'Dữ liệu HIS'}){
    return String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).slice(0,100).map(line=>{
      const payment=parsePayment(line);
      const found=bestMedicineInLine(line);
      if(!found&&source.sourceId==='his-paste')return null;
      let raw=found?.name||line.split(/[|;\t]/)[0];
      raw=raw.replace(/^\s*(?:[-–—•*]|\d+[.)-])\s*/,'').trim();
      return raw?resolvedDrug(raw,payment,source):null;
    }).filter(Boolean);
  }

  function extractPrescriptionTitle(text){
    const header=norm(String(text||'').split(/\r?\n/).slice(0,14).join(' '));
    if(/\b(ngoai bhyt|khong bhyt|dich vu|tu tuc|thu phi|service)\b/.test(header))return 'Đơn thuốc dịch vụ';
    if(/\b(bhyt|bao hiem y te|bao hiem)\b/.test(header))return 'Đơn thuốc BHYT';
    if(/\b(don thuoc|phieu thuoc)\b/.test(header))return 'Đơn thuốc — chưa rõ loại';
    return 'Không xác định tiêu đề';
  }

  function detectPaymentFromTitle(title,text=''){
    const header=norm([title,String(text||'').split(/\r?\n/).slice(0,14).join(' ')].join(' '));
    if(/\b(ngoai bhyt|khong bhyt|dich vu|tu tuc|thu phi|service)\b/.test(header))return 'Dịch vụ';
    if(/\b(bhyt|bao hiem y te|bao hiem)\b/.test(header))return 'BHYT';
    return 'Chưa xác định';
  }

  function createFileEntry(file){
    const number=state.nextFileId++;
    return {
      id:`rx-file-${number}`,
      file,
      fileType:file.type||'image/*',
      fingerprint:`${file.type||'image/*'}|${file.size}|${file.lastModified}`,
      name:`Đơn ${String(number).padStart(2,'0')}`,
      payment:'Chưa xác định',
      paymentSource:'pending',
      title:'',
      status:'pending',
      note:'Chờ đọc tiêu đề',
      drugCount:0,
      diagnosis:{primary:[],secondary:[]},
      error:''
    };
  }

  function renderFileQueue(){
    const box=rx$('#rxFileState');
    const queue=rx$('#rxFileQueue');
    const count=state.files.length;
    box.hidden=!count;
    queue.hidden=!count;
    if(!count){queue.innerHTML='';return}
    const done=state.files.filter(entry=>entry.status==='done'||entry.status==='review').length;
    const unresolved=state.files.filter(entry=>entry.payment==='Chưa xác định').length;
    rx$('#rxFileIcon').textContent='▦';
    rx$('#rxFileName').textContent=`${count} đơn đã chọn`;
    rx$('#rxFileNote').textContent=done?`${done}/${count} đã đọc${unresolved?` · ${unresolved} cần xác nhận loại đơn`:''}`:'Sẵn sàng đọc tiêu đề và danh sách thuốc';
    queue.innerHTML=state.files.map(entry=>{
      const tone=entry.status==='error'?'is-error':entry.status==='review'?'is-review':entry.status==='done'?'is-done':'';
      const status=entry.status==='processing'?'Đang OCR…':entry.status==='error'?entry.error:entry.title?`${entry.title} · ${entry.note}`:entry.note;
      const icon=entry.fileType.startsWith('image/')?'IMG':'TỆP';
      return `<div class="rx-file-item ${tone}" data-rx-file-row="${entry.id}">
        <span class="rx-file-item-icon">${icon}</span>
        <div class="rx-file-item-main"><b title="${esc(entry.name)}">${esc(entry.name)}</b><small title="${esc(status)}">${esc(status)}</small></div>
        <select class="${paymentClass(entry.payment)}" data-rx-file-payment="${entry.id}" aria-label="Loại đơn ${esc(entry.name)}"><option${entry.payment==='BHYT'?' selected':''}>BHYT</option><option${entry.payment==='Dịch vụ'?' selected':''}>Dịch vụ</option><option${entry.payment==='Chưa xác định'?' selected':''}>Chưa xác định</option></select>
        <button type="button" class="rx-file-remove" data-rx-file-remove="${entry.id}" aria-label="Bỏ tệp ${esc(entry.name)}" title="Bỏ tệp">×</button>
      </div>`;
    }).join('');
  }

  function matchDrugsFromText(text,entry,providedDrugs=[]){
    const source={sourceId:entry.id,sourceName:entry.name,sourceTitle:entry.title};
    if(Array.isArray(providedDrugs)&&providedDrugs.length){
      return providedDrugs.map(item=>{
        const name=typeof item==='string'?item:(item.name||item.drug||'');
        return name?resolvedDrug(name,entry.payment,source):null;
      }).filter(Boolean);
    }
    const normalized=norm(text);
    const found=[];
    getMeds().forEach(med=>{
      const keys=[norm(med.name),norm(med.active)].filter(key=>key.length>=5);
      if(keys.some(key=>normalized.includes(key))&&!found.some(item=>item.med?.code===med.code))found.push(resolvedDrug(med.name,entry.payment,source));
    });
    return found;
  }

  function diagnosisOcr(){
    const parser=window.VPMED_PRESCRIPTION_DIAGNOSIS_OCR;
    if(!parser)throw new Error('Không tải được bộ nhận diện mã bệnh chính xác.');
    return parser;
  }

  function exactIcdCatalog(){return window.VPMED_ICD10_CODE_INDEX_2026||[]}

  function extractIcdCodes(value){
    return diagnosisOcr().extractIcdCodes(value,exactIcdCatalog());
  }

  function normalizeProvidedDiagnosis(raw){
    return diagnosisOcr().normalizeProvidedDiagnosis(raw,exactIcdCatalog());
  }

  function extractDiagnosisFromText(text){
    return diagnosisOcr().extractDiagnosisFromText(text,exactIcdCatalog());
  }

  function applyRecognizedText(entry,text,providedDrugs=[],providedDiagnosis=null){
    entry.title=extractPrescriptionTitle(text)||'Không đọc rõ tiêu đề';
    const detected=detectPaymentFromTitle(entry.title,text);
    if(entry.paymentSource!=='manual'){
      entry.payment=detected;
      entry.paymentSource=detected==='Chưa xác định'?'unresolved':'title';
    }
    const drugs=matchDrugsFromText(text,entry,providedDrugs);
    const structured=normalizeProvidedDiagnosis(providedDiagnosis);
    entry.diagnosis=structured.primary.length||structured.secondary.length?structured:extractDiagnosisFromText(text);
    entry.drugCount=drugs.length;
    entry.status=entry.payment==='Chưa xác định'||!drugs.length?'review':'done';
    entry.note=entry.payment==='Chưa xác định'
      ?'Không chắc loại đơn — cần chọn thủ công'
      :`${entry.payment} theo tiêu đề · ${drugs.length} thuốc`;
    return drugs;
  }

  function diagnosisCodes(){
    return unique([...state.diagnosis.primary,...state.diagnosis.secondary]);
  }

  function mergeDiagnosisFromFiles(force=false){
    if(state.diagnosis.manual&&!force){renderDiagnosisChips();return}
    const withDiagnosis=state.files.filter(entry=>(entry.diagnosis?.primary||[]).length||(entry.diagnosis?.secondary||[]).length);
    const primary=unique(state.files.flatMap(entry=>entry.diagnosis?.primary||[]));
    const secondary=unique(state.files.flatMap(entry=>entry.diagnosis?.secondary||[]));
    state.diagnosis={
      primary,
      secondary,
      source:withDiagnosis.length?`OCR từ ${withDiagnosis.length} đơn · ${primary.length} mã chính, ${secondary.length} mã kèm theo · không gộp theo nhóm ICD`:'OCR chưa tìm thấy vùng chẩn đoán',
      conflicts:primary.length>1?primary:[],
      manual:false
    };
    rx$('#rxDiagnosisCodes').value=diagnosisCodes().join(', ');
    renderDiagnosisChips();
  }

  function syncDiagnosisFromEdit(){
    const codes=extractIcdCodes(rx$('#rxDiagnosisCodes').value);
    state.diagnosis={primary:codes.length?[codes[0]]:[],secondary:codes.slice(1),source:'Nhân viên đã chỉnh sau OCR',conflicts:[],manual:true};
    renderDiagnosisChips();
  }

  function renderDiagnosisChips(){
    const codes=diagnosisCodes();
    const primary=rx$('#rxPrimaryDiagnosisCode');
    const secondary=rx$('#rxSecondaryDiagnosisCodes');
    if(primary)primary.textContent=state.diagnosis.primary.length?state.diagnosis.primary.join(' · '):'Chưa nhận diện';
    if(rx$('#rxPrimaryDiagnosisSource'))rx$('#rxPrimaryDiagnosisSource').textContent=state.diagnosis.source||'Chờ đọc đơn thuốc';
    if(secondary)secondary.innerHTML=state.diagnosis.secondary.length?state.diagnosis.secondary.map(code=>`<span>${esc(code)}</span>`).join(''):'<em>Chưa nhận diện</em>';
    const box=rx$('#rxDiagnosisChips');
    if(box)box.innerHTML=codes.length
      ?`${state.diagnosis.primary.map(code=>`<span class="is-code">Chính: ${esc(code)}</span>`).join('')}${state.diagnosis.secondary.map(code=>`<span class="is-code">Kèm: ${esc(code)}</span>`).join('')}${state.diagnosis.conflicts.length?`<span>⚠ Có nhiều mã bệnh chính trên các đơn: ${esc(state.diagnosis.conflicts.join(', '))}</span>`:''}`
      :'<span>OCR chưa nhận diện được mã bệnh</span>';
  }

  function drugAliases(drug){
    const raw=unique([
      drug.name,drug.rawName,drug.active,drug.med?.name,drug.med?.active,drug.profile?.active,...(drug.profile?.brands||[])
    ]).map(norm).filter(alias=>alias.length>=4);
    const split=raw.flatMap(alias=>alias.split(/\s+\+\s+/).map(part=>part.trim()).filter(part=>part.length>=4));
    return unique([...raw,...split]);
  }

  function interactionSideMatches(side,aliases){
    const key=norm(side);
    if(key.length<4)return false;
    return aliases.some(alias=>alias===key||alias.includes(key)||key.includes(alias));
  }

  function findInteractions(){
    const hits=[];
    for(let i=0;i<state.drugs.length;i+=1){
      for(let j=i+1;j<state.drugs.length;j+=1){
        const first=state.drugs[i],second=state.drugs[j];
        const aliasesFirst=drugAliases(first),aliasesSecond=drugAliases(second);
        getInteractions().forEach(rule=>{
          const direct=interactionSideMatches(rule.drug1,aliasesFirst)&&interactionSideMatches(rule.drug2,aliasesSecond);
          const reverse=interactionSideMatches(rule.drug2,aliasesFirst)&&interactionSideMatches(rule.drug1,aliasesSecond);
          if(direct||reverse)hits.push({rule,first,second});
        });
      }
    }
    const seen=new Set();
    return hits.filter(hit=>{
      const key=`${hit.rule.stt}|${Math.min(hit.first.id,hit.second.id)}|${Math.max(hit.first.id,hit.second.id)}`;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  function icdReview(codes){
    const missing=[],unmapped=[],matched=[];
    const matcher=window.VPMED_ICD_CLINICAL_MATCH;
    state.drugs.filter(drug=>drug.payment==='BHYT').forEach(drug=>{
      const mappings=drug.profile?.icdMappings||[];
      const allowed=unique(mappings.flatMap(mapping=>mapping.codes||[]).map(code=>String(code).toUpperCase()));
      if(!allowed.length){unmapped.push(drug);return}
      const match=matcher?.matchAny
        ?matcher.matchAny(codes,allowed)
        :{matched:allowed.some(code=>codes.includes(code)),mode:'exact'};
      if(match.matched)matched.push({drug,mappings,allowed,match});
      else missing.push({drug,mappings,allowed});
    });
    return {missing,unmapped,matched};
  }

  function interactionHtml(hit){
    const {rule,first,second}=hit;
    const cross=first.payment!==second.payment;
    return `<article class="rx-alert rx-alert-danger">
      <div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><small>${esc(rule.level||'Tương tác cần xử trí')}${rule.conditional?' · Có điều kiện':''}</small><h3>${esc(first.name)} + ${esc(second.name)}</h3></div></div>
      <div class="rx-cross-payment"><span class="${paymentTagClass(first.payment)}">${esc(first.payment)}</span><em>${cross?'↔ kiểm tra chéo ↔':'↔ cùng nguồn ↔'}</em><span class="${paymentTagClass(second.payment)}">${esc(second.payment)}</span></div>
      <dl>
        <div><dt>Cơ chế</dt><dd>${esc(rule.mechanism||'Chưa có mô tả.')}</dd></div>
        <div><dt>Hậu quả</dt><dd>${esc(rule.consequence||'Cần đánh giá nguy cơ lâm sàng.')}</dd></div>
        <div><dt>Xử trí</dt><dd>${esc(rule.management||'Đối chiếu nguồn và trao đổi bác sĩ điều trị.')}</dd></div>
        <div><dt>Nguồn</dt><dd>${esc(rule.source||'QĐ 5948/QĐ-BYT')}</dd></div>
      </dl>
    </article>`;
  }

  function missingIcdHtml(item){
    const terms=item.mappings.map(mapping=>`${mapping.term}: ${(mapping.codes||[]).join(', ')}`).join(' · ');
    return `<article class="rx-alert rx-alert-warning">
      <div class="rx-alert-header"><span class="rx-alert-icon">ICD</span><div><small>Thuốc BHYT · ${esc(item.drug.sourceName||'Đơn chưa đặt tên')} · Chưa tìm thấy mã bệnh thuộc nhóm chỉ định đã xác minh</small><h3>${esc(item.drug.name)}</h3></div></div>
      <p>Chưa có mã ICD khớp trực tiếp hoặc cùng nhóm ICD đã được hồ sơ nguồn xác nhận cho thuốc. Cần kiểm tra hồ sơ bệnh án và điều kiện thanh toán hiện hành; không tự thêm mã bệnh nếu không có chẩn đoán lâm sàng.</p>
      <dl><div><dt>Gợi ý</dt><dd>${esc(terms)}</dd></div></dl>
      <div class="rx-suggested-codes">${item.allowed.slice(0,8).map(code=>`<button type="button" data-rx-add-code="${esc(code)}" title="Chỉ thêm khi hồ sơ có chẩn đoán tương ứng">+ ${esc(code)}</button>`).join('')}</div>
    </article>`;
  }

  function familyMatchesHtml(items){
    const rows=items.filter(item=>item.match?.mode==='category');
    if(!rows.length)return '';
    return `<article class="rx-alert rx-alert-success">
      <div class="rx-alert-header"><span class="rx-alert-icon">✓</span><div><small>Đối chiếu theo cấu trúc ICD-10</small><h3>${rows.length} thuốc đã nhận mã bệnh cùng nhóm chỉ định</h3></div></div>
      <p>${rows.map(item=>`${esc(item.drug.name)}: ${esc(item.match.observed)} thuộc nhóm ${esc(item.match.category)}`).join(' · ')}.</p>
    </article>`;
  }

  function checkPrescription(){
    if(!state.drugs.length){alert('Vui lòng thêm ít nhất một thuốc vào đơn.');return}
    const codes=diagnosisCodes();
    const interactions=findInteractions();
    const {missing,unmapped,matched}=icdReview(codes);
    const unknown=state.drugs.filter(drug=>!drug.resolved);
    const unclassifiedFiles=state.files.filter(entry=>entry.payment==='Chưa xác định');
    const unclassifiedDrugs=state.drugs.filter(drug=>drug.payment==='Chưa xác định');
    const hasBhyt=state.drugs.some(drug=>drug.payment==='BHYT');
    const noDiagnosis=hasBhyt&&!codes.length;
    const missingPrimary=hasBhyt&&!state.diagnosis.primary.length;
    const diagnosisConflict=state.diagnosis.conflicts.length>1;
    const icdIssueCount=missing.length+(missingPrimary?1:0)+(diagnosisConflict?1:0);
    const unclassifiedCount=unclassifiedFiles.length||unclassifiedDrugs.length;
    const score=Math.max(15,100-interactions.length*25-missing.length*12-(missingPrimary?20:0)-(diagnosisConflict?12:0)-unknown.length*4-unclassifiedCount*8);
    state.lastCheck={interactions,missing,unmapped,matched,unknown,unclassifiedFiles,unclassifiedDrugs,noDiagnosis,missingPrimary,diagnosisConflict,score,checkedAt:new Date()};
    rx$('#rxResetPrescription').disabled=false;
    rx$('#rxResetPrescription').title='Xóa dữ liệu đơn hiện tại để kiểm tra đơn mới';

    const title=interactions.length?'Có tương tác chống chỉ định/cần xử trí':unclassifiedCount?'Cần xác nhận loại đơn':icdIssueCount?'Cần bổ sung kiểm tra mã bệnh':'Không phát hiện cảnh báo trong dữ liệu hiện có';
    rx$('#rxResultTitle').textContent=title;
    rx$('#rxScore').innerHTML=`<b>${score}</b><small>/100</small>`;
    rx$('#rxSummary').innerHTML=`<div><b>${interactions.length}</b><span>Tương tác</span></div><div><b>${icdIssueCount}</b><span>Mã bệnh</span></div><div><b>${state.drugs.length}</b><span>Đã đối chiếu</span></div>`;

    const blocks=[];
    interactions.forEach(hit=>blocks.push(interactionHtml(hit)));
    if(missingPrimary)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><small>OCR chẩn đoán chưa hoàn tất</small><h3>${noDiagnosis?'Chưa nhận diện được mã bệnh trên các đơn':'Đã thấy mã bệnh kèm theo nhưng chưa xác định được mã bệnh chính'}</h3></div></div><p>Hệ thống đã tự tìm vùng chẩn đoán nhưng chưa xác định chắc MA_BENH_CHINH. Hãy kiểm tra chất lượng ảnh hoặc dùng mục “Chỉnh lại nếu OCR đọc sai”; không tự thêm mã khi hồ sơ không có chẩn đoán tương ứng.</p></article>`);
    if(diagnosisConflict)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><small>Nhiều ứng viên mã bệnh chính</small><h3>${esc(state.diagnosis.conflicts.join(' · '))}</h3></div></div><p>Các đơn trong cùng lượt có mã bệnh chính OCR khác nhau. Cần xác nhận đúng mã chính trước khi gửi dữ liệu giám định.</p></article>`);
    missing.forEach(item=>blocks.push(missingIcdHtml(item)));
    const familyMatchBlock=familyMatchesHtml(matched);
    if(familyMatchBlock)blocks.push(familyMatchBlock);
    if(unclassifiedCount)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">?</span><div><small>OCR tiêu đề chưa chắc chắn</small><h3>${unclassifiedCount} đơn/nhóm thuốc chưa xác định BHYT hay dịch vụ</h3></div></div><p>${esc(unclassifiedFiles.length?unclassifiedFiles.map(entry=>entry.name).join(', '):unclassifiedDrugs.map(drug=>drug.sourceName||drug.name).join(', '))}. Vui lòng chọn lại loại đơn trong hàng đợi hoặc bảng thuốc rồi kiểm tra lại.</p></article>`);
    if(unmapped.length)blocks.push(`<article class="rx-alert rx-alert-info"><div class="rx-alert-header"><span class="rx-alert-icon">i</span><div><small>Chưa đủ dữ liệu đối chiếu</small><h3>${unmapped.length} thuốc BHYT chưa có bản đồ ICD gợi ý</h3></div></div><p>${esc(unmapped.map(drug=>drug.name).join(', '))}. Cần đối chiếu chỉ định, tờ hướng dẫn sử dụng và quy định thanh toán hiện hành.</p></article>`);
    if(unknown.length)blocks.push(`<article class="rx-alert rx-alert-info"><div class="rx-alert-header"><span class="rx-alert-icon">?</span><div><small>Cần nhân viên y tế xác nhận</small><h3>${unknown.length} tên thuốc chưa chuẩn hóa</h3></div></div><p>${esc(unknown.map(drug=>drug.rawName||drug.name).join(', '))}. Các thuốc này chưa được dùng để kết luận tương tác hoặc ICD.</p></article>`);
    if(!blocks.length)blocks.push('<article class="rx-alert rx-alert-success"><div class="rx-alert-header"><span class="rx-alert-icon">✓</span><div><small>Đã rà soát dữ liệu hiện có</small><h3>Không phát hiện cặp tương tác hoặc thiếu mã ICD gợi ý</h3></div></div><p>Kết quả không loại trừ các tương tác ngoài danh mục, chống chỉ định theo bệnh nền, dị ứng, liều, xét nghiệm hoặc quy định thanh toán khác.</p></article>');
    rx$('#rxResultBody').innerHTML=blocks.join('');
    rx$('#rxResultCard').scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
  }

  function addSuggestedCode(code){
    if(!state.diagnosis.primary.length)state.diagnosis.primary.push(code);
    else if(!state.diagnosis.primary.includes(code)&&!state.diagnosis.secondary.includes(code))state.diagnosis.secondary.push(code);
    state.diagnosis.source='Nhân viên đã xác nhận sau cảnh báo';
    state.diagnosis.conflicts=[];
    state.diagnosis.manual=true;
    rx$('#rxDiagnosisCodes').value=diagnosisCodes().join(', ');
    renderDiagnosisChips();
    checkPrescription();
  }

  function setOcrProgress(percent,text){
    rx$('#rxOcrProgress').hidden=false;
    rx$('#rxOcrBar').style.width=`${Math.max(4,Math.min(100,Math.round(percent||0)))}%`;
    rx$('#rxOcrText').textContent=text||'Đang nhận dạng…';
  }

  async function loadTesseract(){
    if(window.Tesseract)return window.Tesseract;
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',()=>Boolean(window.Tesseract));
    return window.Tesseract;
  }

  async function createEnhancedOcrImage(file){
    let image=null,release=()=>{};
    if(typeof createImageBitmap==='function'){
      image=await createImageBitmap(file);
      release=()=>image.close?.();
    }else{
      const url=URL.createObjectURL(file);
      image=new Image();
      image.decoding='async';
      image.src=url;
      await image.decode();
      release=()=>URL.revokeObjectURL(url);
    }
    const width=image.width||image.naturalWidth;
    const height=image.height||image.naturalHeight;
    const longest=Math.max(width,height);
    const scale=longest<2400?Math.min(2.5,2800/Math.max(1,longest)):1;
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale));
    canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d',{willReadFrequently:true});
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.drawImage(image,0,0,canvas.width,canvas.height);
    release();
    const pixels=context.getImageData(0,0,canvas.width,canvas.height);
    for(let index=0;index<pixels.data.length;index+=4){
      const gray=Math.round(pixels.data[index]*.299+pixels.data[index+1]*.587+pixels.data[index+2]*.114);
      const contrasted=Math.max(0,Math.min(255,Math.round((gray-190)*1.85+190)));
      const value=contrasted>238?255:contrasted;
      pixels.data[index]=value;
      pixels.data[index+1]=value;
      pixels.data[index+2]=value;
      pixels.data[index+3]=255;
    }
    context.putImageData(pixels,0,0);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    context.clearRect(0,0,canvas.width,canvas.height);
    canvas.width=1;
    canvas.height=1;
    return blob||file;
  }

  async function runOcr(){
    const pending=state.files.filter(entry=>entry.file);
    if(!pending.length){alert(state.files.length?'Các ảnh đã được xử lý và giải phóng khỏi bộ nhớ. Hãy chọn thêm ảnh nếu cần.':'Vui lòng chọn ít nhất một ảnh đơn thuốc.');return}
    const button=rx$('#rxRunOcr');
    button.disabled=true;
    let worker=null;
    try{
      await ensureData();
      const sourceIds=new Set(pending.map(entry=>entry.id));
      state.drugs=state.drugs.filter(drug=>!sourceIds.has(drug.sourceId));
      state.diagnosis={primary:[],secondary:[],source:'Đang OCR chẩn đoán',conflicts:[],manual:false};
      let currentIndex=0,ocrPass=0;
      const ocrPassCount=3;
      setOcrProgress(8,'Đang nạp bộ OCR cục bộ…');
      const Tesseract=await loadTesseract();
      worker=await Tesseract.createWorker(['vie','eng'],1,{logger:message=>{
        const within=(ocrPass+(message.progress||0))/ocrPassCount;
        const progress=8+((currentIndex+within)/pending.length)*88;
        setOcrProgress(progress,`Đang OCR đơn ${currentIndex+1}/${pending.length} · lượt ${ocrPass+1}/${ocrPassCount} trên thiết bị…`);
      }});
      for(currentIndex=0;currentIndex<pending.length;currentIndex+=1){
        const entry=pending[currentIndex];
        entry.status='processing';
        entry.error='';
        entry.diagnosis={primary:[],secondary:[]};
        renderFileQueue();
        setOcrProgress(8+(currentIndex/pending.length)*88,`Đang đọc ${entry.name} cục bộ — không tải ảnh lên máy chủ`);
        try{
          if(!entry.fileType.startsWith('image/'))throw new Error('Chỉ chấp nhận tệp ảnh để OCR cục bộ.');
          if(worker.setParameters)await worker.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1',user_defined_dpi:'300'}).catch(()=>{});
          ocrPass=0;
          const pagePass=await worker.recognize(entry.file);
          const enhancedImage=await createEnhancedOcrImage(entry.file).catch(()=>entry.file);
          if(worker.setParameters)await worker.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1',user_defined_dpi:'300'}).catch(()=>{});
          ocrPass=1;
          const densePass=await worker.recognize(enhancedImage);
          if(worker.setParameters)await worker.setParameters({tessedit_pageseg_mode:'11',preserve_interword_spaces:'1',user_defined_dpi:'300'}).catch(()=>{});
          ocrPass=2;
          const sparsePass=await worker.recognize(enhancedImage);
          const text=[pagePass.data?.text||'',densePass.data?.text||'',sparsePass.data?.text||''].join('\n');
          const drugs=applyRecognizedText(entry,text);
          state.drugs.push(...drugs);
        }catch(error){
          entry.status='error';
          entry.error=error.message||'Không thể đọc tệp';
          entry.note=entry.error;
          entry.drugCount=0;
        }finally{
          entry.file=null;
        }
        renderFileQueue();
        renderRows();
        mergeDiagnosisFromFiles();
      }
      markStale();
      rx$('#rxOcrProgress').hidden=true;
      rx$('#rxOcrBar').style.width='4%';
      rx$('#rxOcrText').textContent='Đang nhận dạng…';
    }catch(error){
      setOcrProgress(100,error.message||'Không thể đọc đơn thuốc.');
    }finally{
      if(worker)await worker.terminate().catch(()=>{});
      button.disabled=false;
    }
  }

  function onFilesSelected(fileList){
    const incoming=[...(fileList||[])];
    if(!incoming.length)return;
    const available=Math.max(0,20-state.files.length);
    if(!available){alert('Mỗi lượt kiểm tra nhận tối đa 20 tệp.');return}
    const images=incoming.filter(file=>String(file.type||'').startsWith('image/'));
    const existing=new Set(state.files.map(entry=>entry.fingerprint));
    const accepted=images.filter(file=>!existing.has(`${file.type||'image/*'}|${file.size}|${file.lastModified}`)).slice(0,available);
    state.files.push(...accepted.map(createFileEntry));
    if(incoming.length>accepted.length)alert('Một số tệp không phải ảnh, bị trùng hoặc vượt giới hạn 20 ảnh nên không được thêm.');
    renderFileQueue();
    rx$('#rxOcrProgress').hidden=true;
    markStale();
  }

  function resetPrescription(){
    if(!confirm('Xóa dữ liệu đơn hiện tại để kiểm tra đơn mới?'))return;
    state.drugs=[];
    state.files=[];
    state.lastCheck=null;
    state.nextId=1;
    state.nextFileId=1;
    state.diagnosis={primary:[],secondary:[],source:'Chờ OCR',conflicts:[],manual:false};
    rx$('#rxEncounterType').selectedIndex=0;
    rx$('#rxDiagnosisCodes').value='';
    rx$('#rxDiagnosisCodes').hidden=true;
    rx$('#rxEditDiagnosis').textContent='Chỉnh lại nếu OCR đọc sai';
    rx$('#rxPasteDrugs').value='';
    rx$('#rxPrescriptionFile').value='';
    rx$('#rxFileState').hidden=true;
    rx$('#rxFileQueue').hidden=true;
    rx$('#rxFileQueue').innerHTML='';
    rx$('#rxOcrProgress').hidden=true;
    rx$('#rxOcrBar').style.width='4%';
    rx$('#rxOcrText').textContent='Đang nhận dạng…';
    rx$('#rxResultTitle').textContent='Chưa kiểm tra';
    rx$('#rxScore').innerHTML='<b>—</b><small>/100</small>';
    rx$('#rxSummary').innerHTML='<div><b>—</b><span>Tương tác</span></div><div><b>—</b><span>Mã bệnh</span></div><div><b>—</b><span>Đã đối chiếu</span></div>';
    rx$('#rxResultBody').innerHTML='<div class="rx-result-empty"><span>✓</span><b>Sẵn sàng nhận dữ liệu</b><p>Tải các đơn của cùng lượt khám; hệ thống sẽ tự đọc loại đơn, mã bệnh và danh sách thuốc.</p></div>';
    rx$('#rxResetPrescription').disabled=true;
    rx$('#rxResetPrescription').title='Nút được bật sau khi kiểm tra đơn';
    renderDiagnosisChips();
    renderFileQueue();
    renderRows();
    rx$('#view-prescription-check')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
  }

  function bindEvents(){
    document.querySelectorAll('[data-open="prescription-check"]').forEach(button=>button.addEventListener('click',()=>ensureData().catch(()=>{})));
    rx$('#rxResetPrescription')?.addEventListener('click',resetPrescription);
    rx$('#rxDiagnosisCodes')?.addEventListener('input',()=>{syncDiagnosisFromEdit();markStale()});
    rx$('#rxEditDiagnosis')?.addEventListener('click',()=>{
      const input=rx$('#rxDiagnosisCodes');
      input.hidden=!input.hidden;
      rx$('#rxEditDiagnosis').textContent=input.hidden?'Chỉnh lại nếu OCR đọc sai':'Đóng phần chỉnh sửa';
      if(!input.hidden){input.value=diagnosisCodes().join(', ');input.focus()}
    });
    rx$('#rxAddDrug')?.addEventListener('click',async()=>{try{await ensureData();state.drugs.push(resolvedDrug('','BHYT',{sourceName:'Nhập thủ công'}));renderRows();markStale();setTimeout(()=>rx$(`[data-rx-name="${state.drugs.at(-1).id}"]`)?.focus(),0)}catch{}});
    rx$('#rxApplyPaste')?.addEventListener('click',async()=>{
      try{
        await ensureData();
        const parsed=parseDrugLines(rx$('#rxPasteDrugs').value);
        if(!parsed.length){alert('Chưa có danh sách thuốc để nhận. Mỗi thuốc nên nằm trên một dòng.');return}
        state.drugs=state.drugs.filter(drug=>drug.sourceId!=='his-paste');
        state.drugs.push(...parsed);
        renderRows();
        markStale();
      }catch{}
    });
    rx$('#rxDrugRows')?.addEventListener('change',event=>{
      const nameId=Number(event.target.dataset.rxName);
      const paymentId=Number(event.target.dataset.rxPayment);
      if(nameId){
        const index=state.drugs.findIndex(drug=>drug.id===nameId);
        if(index>=0)state.drugs[index]=refreshDrug(state.drugs[index],event.target.value);
      }
      if(paymentId){
        const drug=state.drugs.find(item=>item.id===paymentId);
        if(drug)drug.payment=normalizePayment(event.target.value);
      }
      renderRows();
      markStale();
    });
    rx$('#rxDrugRows')?.addEventListener('input',event=>{if(event.target.dataset.rxName)markStale()});
    rx$('#rxDrugRows')?.addEventListener('click',event=>{
      const id=Number(event.target.dataset.rxRemove);
      if(!id)return;
      state.drugs=state.drugs.filter(drug=>drug.id!==id);
      renderRows();
      markStale();
    });
    rx$('#rxFileQueue')?.addEventListener('change',event=>{
      const fileId=event.target.dataset.rxFilePayment;
      if(!fileId)return;
      const entry=state.files.find(item=>item.id===fileId);
      if(!entry)return;
      entry.payment=normalizePayment(event.target.value);
      entry.paymentSource='manual';
      entry.status=entry.payment==='Chưa xác định'||!entry.drugCount?'review':'done';
      entry.note=entry.payment==='Chưa xác định'?'Cần chọn BHYT hoặc dịch vụ':`${entry.payment} · nhân viên đã xác nhận · ${entry.drugCount} thuốc`;
      state.drugs.filter(drug=>drug.sourceId===fileId).forEach(drug=>{drug.payment=entry.payment;drug.sourceTitle=entry.title});
      mergeDiagnosisFromFiles();
      renderFileQueue();
      renderRows();
      markStale();
    });
    rx$('#rxFileQueue')?.addEventListener('click',event=>{
      const fileId=event.target.dataset.rxFileRemove;
      if(!fileId)return;
      state.files=state.files.filter(entry=>entry.id!==fileId);
      state.drugs=state.drugs.filter(drug=>drug.sourceId!==fileId);
      mergeDiagnosisFromFiles();
      renderFileQueue();
      renderRows();
      markStale();
    });
    rx$('#rxCheckPrescription')?.addEventListener('click',async event=>{
      const button=event.currentTarget;
      button.disabled=true;
      try{await ensureData();checkPrescription()}catch{alert('Không thể tải đủ dữ liệu để kiểm tra. Vui lòng tải lại trang.')}finally{button.disabled=false}
    });
    rx$('#rxResultBody')?.addEventListener('click',event=>{const code=event.target.dataset.rxAddCode;if(code)addSuggestedCode(code)});
    rx$('#rxPrescriptionFile')?.addEventListener('change',event=>{onFilesSelected(event.target.files);event.target.value=''});
    rx$('#rxRunOcr')?.addEventListener('click',runOcr);
    rx$('#rxPrintResult')?.addEventListener('click',()=>window.print());
  }

  bindEvents();
  renderDiagnosisChips();
  renderFileQueue();
  renderRows();
  if(location.hash==='#prescription-check')ensureData().catch(()=>{});
})();
