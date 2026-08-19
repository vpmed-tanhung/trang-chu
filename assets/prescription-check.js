/*
 * Rà soát đơn thuốc BHYT & dịch vụ
 * - Đối chiếu tương tác theo VPMED_INTERACTIONS (QĐ 5948/QĐ-BYT)
 * - Bổ sung lớp cảnh giác dược quốc gia VPMED_RX_INTERACTION_SUPPLEMENTAL
 *   nhưng không tự động quy cảnh báo bổ sung thành chống chỉ định pháp lý
 * - Phân biệt thuốc BHYT thiếu mã bệnh với trường hợp đã có chẩn đoán liên quan nhưng mã chưa thật sự phù hợp
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
    if(normalized==='dv')return 'Dịch vụ';
    if(PAYMENT_SERVICE_PATTERN.test(normalized))return 'Dịch vụ';
    if(PAYMENT_BHYT_PATTERN.test(normalized)||BHYT_CARD_NUMBER_PATTERN.test(normalized))return 'BHYT';
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
      loadScript('assets/service_medicines_20260818.js',()=>Array.isArray(window.VPMED_SERVICE_MEDICINES_20260818)),
      loadScript('assets/drug_profiles_305_vpmed_20260710.js',()=>Array.isArray(window.VPMED_FULL_DRUG_PROFILES_305)),
      loadScript('assets/icd10_verified_profiles_20260710.js',()=>Array.isArray(window.VPMED_VERIFIED_DRUG_PROFILES)),
      loadScript('assets/icd10_code_index_2026.js',()=>Array.isArray(window.VPMED_ICD10_CODE_INDEX_2026)),
      loadScript('assets/icd10_name_map_2026.js',()=>window.VPMED_ICD10_NAME_MAP_2026&&typeof window.VPMED_ICD10_NAME_MAP_2026==='object')
    ]).then(()=>{
      const meds=getMeds();
      const profiles=getProfiles();
      const interactions=getInteractions();
      populateDrugOptions();
      renderRuleSources();
      setDataState('ready','Dữ liệu sẵn sàng','');
      return {meds,profiles,interactions};
    }).catch(error=>{
      dataPromise=null;
      setDataState('error','Không tải đủ dữ liệu',error.message||'Vui lòng tải lại trang');
      throw error;
    });
    return dataPromise;
  }

  let mergedMedsCache=null;
  function getMeds(){
    if(mergedMedsCache)return mergedMedsCache;
    const inpatient=Array.isArray(window.VPMED_INPATIENT_MEDICINES_20260707)?window.VPMED_INPATIENT_MEDICINES_20260707:[];
    const service=Array.isArray(window.VPMED_SERVICE_MEDICINES_20260818)?window.VPMED_SERVICE_MEDICINES_20260818:[];
    const seen=new Set(inpatient.map(med=>norm(med.name)));
    const extraService=service.filter(med=>{
      const key=norm(med.name);
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
    mergedMedsCache=[...inpatient,...extraService];
    return mergedMedsCache;
  }
  function getProfiles(){return window.VPMED_FULL_DRUG_PROFILES_305||[]}
  function getVerifiedProfiles(){return window.VPMED_VERIFIED_DRUG_PROFILES||[]}
  function getInteractions(){
    const base=Array.isArray(window.VPMED_INTERACTIONS)?window.VPMED_INTERACTIONS:[];
    const supplemental=Array.isArray(window.VPMED_RX_INTERACTION_SUPPLEMENTAL)?window.VPMED_RX_INTERACTION_SUPPLEMENTAL:[];
    return [...base,...supplemental];
  }

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
      orderText:String(source.orderText||'').trim(),
      med,
      profile,
      resolved:Boolean(med)
    };
  }

  function refreshDrug(drug,newName){
    const payment=drug.payment;
    const next=resolvedDrug(newName,payment,{sourceId:drug.sourceId,sourceName:drug.sourceName,sourceTitle:drug.sourceTitle,orderText:drug.orderText});
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
    if(PAYMENT_SERVICE_PATTERN.test(normalized)||/(^|[|;\t\s])dv($|[|;\t\s])/.test(normalized))return 'Dịch vụ';
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

  function interactionNameVariants(value){
    const full=String(value||'').trim();
    if(!full)return [];
    const noParen=full.replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim();
    const slashParts=full.split('/').map(part=>part.replace(/\([^)]*\)/g,' ').trim()).filter(Boolean);
    return unique([full,noParen,...slashParts]).filter(item=>norm(item).length>=5);
  }

  function bestInteractionDrugInLine(line){
    const normalized=norm(line);
    let best='',bestLength=0;
    getInteractions().forEach(rule=>{
      [rule.drug1,rule.drug2].flatMap(interactionNameVariants).forEach(value=>{
        const key=norm(value);
        if(key.length>=5&&normalized.includes(key)&&key.length>bestLength){best=value;bestLength=key.length}
      });
    });
    return best;
  }

  function parseDrugLines(text,source={sourceId:'his-paste',sourceName:'Dữ liệu HIS'}){
    return String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).slice(0,100).map(line=>{
      const payment=parsePayment(line);
      const found=bestMedicineInLine(line);
      const interactionName=found?'':bestInteractionDrugInLine(line);
      if(!found&&!interactionName&&source.sourceId==='his-paste')return null;
      let raw=found?.name||interactionName||line.split(/[|;\t]/)[0];
      raw=raw.replace(/^\s*(?:[-–—•*]|\d+[.)-])\s*/,'').trim();
      return raw?resolvedDrug(raw,payment,{...source,orderText:line}):null;
    }).filter(Boolean);
  }

  const SERVICE_HOSPITAL_PHARMACY_PATTERN=/\bnha\s+thuoc\s+benh\s+vien\b/;
  // “Đơn thuốc” (không kèm dấu hiệu BHYT rõ ràng) được hiểu trực tiếp là đơn dịch vụ:
  // bệnh nhân nhận đơn để mua thuốc tại Nhà thuốc Bệnh viện. Đây KHÔNG phải tín hiệu yếu/fallback.
  const SERVICE_GENERIC_PRESCRIPTION_PATTERN=/\b(?:don\s+thuoc|phieu\s+thuoc)\b/;
  const BHYT_STRONG_MARKER_PATTERN=/\b(?:don\s+thuoc\s+(?:bhyt|bao\s+hiem(?:\s+y\s+te)?)|quay\s+(?:phat\s+)?thuoc\s+(?:bhyt|bao\s+hiem(?:\s+y\s+te)?)|phat\s+thuoc\s+(?:bhyt|bao\s+hiem(?:\s+y\s+te)?))\b/;

  function hasHospitalPharmacyServiceMarker(value){
    // Dấu hiệu mạnh của đơn dịch vụ. Quét toàn bộ OCR vì cụm này có thể nằm
    // ở dòng liên hệ, dưới tên phòng khám hoặc ở phần cuối đơn.
    return SERVICE_HOSPITAL_PHARMACY_PATTERN.test(norm(value));
  }

  function hasBhytPrescriptionMarker(value){
    // Dấu hiệu mạnh của đơn BHYT: “ĐƠN THUỐC BHYT”, “Quầy Phát Thuốc Bảo Hiểm”…
    // norm() giúp nhận chữ hoa/thường, dấu tiếng Việt và dấu câu khác nhau.
    return BHYT_STRONG_MARKER_PATTERN.test(norm(value));
  }

  function extractPrescriptionTitle(text){
    const fullText=String(text||'');
    const header=norm(fullText.split(/\r?\n/).slice(0,14).join(' '));
    const full=norm(fullText);

    // Quét TOÀN BỘ OCR trước khi kết luận “Không xác định”.
    // Quy tắc loại đơn theo mẫu thực tế:
    // - “Đơn thuốc BHYT” / “Quầy Phát Thuốc Bảo Hiểm” => BHYT.
    // - “Đơn thuốc” / “Nhà thuốc Bệnh Viện” => Dịch vụ.
    // BHYT rõ ràng phải được xét trước vì cụm “Đơn thuốc BHYT” cũng chứa “Đơn thuốc”.
    if(hasBhytPrescriptionMarker(fullText))return 'Đơn thuốc BHYT';
    if(hasHospitalPharmacyServiceMarker(fullText))return 'Đơn thuốc dịch vụ';
    if(SERVICE_GENERIC_PRESCRIPTION_PATTERN.test(full))return 'Đơn thuốc dịch vụ';
    if(/\b(ngoai bhyt|khong bhyt|khong bao hiem)\b/.test(full))return 'Đơn thuốc dịch vụ';
    if(PAYMENT_SERVICE_PATTERN.test(header))return 'Đơn thuốc dịch vụ';
    if(PAYMENT_BHYT_PATTERN.test(header)||BHYT_CARD_NUMBER_PATTERN.test(header))return 'Đơn thuốc BHYT';
    if(PAYMENT_SERVICE_PATTERN.test(full))return 'Đơn thuốc dịch vụ';
    if(PAYMENT_BHYT_PATTERN.test(full)||BHYT_CARD_NUMBER_PATTERN.test(full))return 'Đơn thuốc BHYT';
    return 'Không xác định tiêu đề';
  }

  const PAYMENT_SERVICE_PATTERN=/\b(ngoai bhyt|khong bhyt|khong bao hiem|dich vu|tu tuc|tu nguyen|thu phi|thu tien|vien phi|yeu cau|ngoai danh muc|service)\b/;
  const PAYMENT_BHYT_PATTERN=/\b(bhyt|bao hiem y te|bao hiem|the bhyt|so the|ma the|doi tuong bhyt|dien bhyt)\b/;
  const BHYT_CARD_NUMBER_PATTERN=/\b[a-z]{2}\d{1}\s?\d{2}\s?\d{3}\s?\d{5}\b|\b[a-z]{2}\d{13}\b/;

  function detectPaymentFromTitle(title,text=''){
    const fullText=String(text||'');
    const header=norm([title,fullText.split(/\r?\n/).slice(0,14).join(' ')].join(' '));
    const full=norm([title,fullText].join(' '));

    // Quét TOÀN BỘ văn bản OCR trước khi trả về “Chưa xác định”.
    // Quy tắc ưu tiên:
    // 1) Dấu hiệu BHYT rõ ràng thắng trước, vì “Đơn thuốc BHYT” có chứa “Đơn thuốc”.
    if(hasBhytPrescriptionMarker(fullText)||hasBhytPrescriptionMarker(title))return 'BHYT';
    // 2) “Nhà thuốc Bệnh Viện” hoặc “Đơn thuốc” là dấu hiệu trực tiếp của đơn Dịch vụ,
    //    không phải fallback yếu.
    if(hasHospitalPharmacyServiceMarker(fullText)||hasHospitalPharmacyServiceMarker(title))return 'Dịch vụ';
    if(SERVICE_GENERIC_PRESCRIPTION_PATTERN.test(full))return 'Dịch vụ';
    // 3) Các cụm loại trừ BHYT là dịch vụ rõ ràng.
    if(/\b(ngoai bhyt|khong bhyt|khong bao hiem)\b/.test(full))return 'Dịch vụ';
    // 4) Sau các mẫu loại đơn ở trên mới dùng các từ khóa thanh toán còn lại.
    if(PAYMENT_SERVICE_PATTERN.test(header))return 'Dịch vụ';
    if(PAYMENT_BHYT_PATTERN.test(header)||BHYT_CARD_NUMBER_PATTERN.test(header))return 'BHYT';
    if(PAYMENT_SERVICE_PATTERN.test(full))return 'Dịch vụ';
    if(PAYMENT_BHYT_PATTERN.test(full)||BHYT_CARD_NUMBER_PATTERN.test(full))return 'BHYT';
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

  function compactOrderText(value){
    return String(value||'').replace(/\s+/g,' ').trim().slice(0,320);
  }

  function findOrderTextForMedicine(text,med){
    const lines=String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    const name=norm(med?.name);
    const active=norm(med?.active);
    const instruction=/\b(uong|tiem|truyen|ngam|nho|boi|xit|khi dung|vien|ong|lo|ml|mg|mcg|iu|ui|don vi|lan|ngay|gio|phut|sang|trua|chieu|toi|toc do|pha)\b/;
    let best='',bestScore=-1;
    lines.forEach((line,index)=>{
      const key=norm(line);
      const nameHit=name.length>=5&&key.includes(name);
      const activeHit=active.length>=7&&key.includes(active);
      if(!nameHit&&!activeHit)return;
      const context=[line];
      for(let offset=1;offset<=2;offset+=1){
        const next=lines[index+offset];
        if(!next)break;
        if(instruction.test(norm(next)))context.push(next);
        else break;
      }
      const joined=compactOrderText(context.join(' · '));
      const score=(nameHit?100:60)+(instruction.test(norm(joined))?20:0)+Math.min(joined.length,120)/20;
      if(score>bestScore){best=joined;bestScore=score}
    });
    return best;
  }

  function matchDrugsFromText(text,entry,providedDrugs=[]){
    const source={sourceId:entry.id,sourceName:entry.name,sourceTitle:entry.title};
    if(Array.isArray(providedDrugs)&&providedDrugs.length){
      return providedDrugs.map(item=>{
        const name=typeof item==='string'?item:(item.name||item.drug||'');
        const orderText=typeof item==='string'?'':(item.orderText||item.instruction||item.dose||item.sig||'');
        return name?resolvedDrug(name,entry.payment,{...source,orderText}):null;
      }).filter(Boolean);
    }
    const normalized=norm(text);
    const matches=[];
    getMeds().forEach(med=>{
      // Chỉ đối chiếu tên thuốc trong danh mục với nội dung OCR. Không quét theo
      // hoạt chất vì một hoạt chất có thể tương ứng nhiều biệt dược/hàm lượng.
      const medicineName=norm(med.name);
      if(medicineName.length<5)return;
      let from=0;
      while(from<normalized.length){
        const start=normalized.indexOf(medicineName,from);
        if(start<0)break;
        matches.push({med,start,end:start+medicineName.length,length:medicineName.length});
        from=start+Math.max(1,medicineName.length);
      }
    });

    // Nếu nhiều tên danh mục cùng khớp vào một đoạn OCR, giữ tên đầy đủ nhất.
    // Việc này loại bản ghi con/biến thể chồng lấn mà không dựa vào tên thuốc cụ thể.
    matches.sort((a,b)=>a.start-b.start||b.length-a.length);
    const selected=[];
    matches.forEach(candidate=>{
      const overlaps=selected.some(current=>candidate.start<current.end&&candidate.end>current.start);
      if(!overlaps)selected.push(candidate);
    });

    const seen=new Set();
    return selected.map(({med})=>{
      const key=String(med.code||med.name||'');
      if(seen.has(key))return null;
      seen.add(key);
      return resolvedDrug(med.name,entry.payment,{...source,orderText:findOrderTextForMedicine(text,med)});
    }).filter(Boolean);
  }

  function diagnosisOcr(){
    const parser=window.VPMED_PRESCRIPTION_DIAGNOSIS_OCR;
    if(!parser)throw new Error('Không tải được bộ nhận diện mã bệnh chính xác.');
    return parser;
  }

  function exactIcdCatalog(){return window.VPMED_ICD10_CODE_INDEX_2026||[]}

  function icdKey(value){
    return String(value||'').trim().toUpperCase().replace(/[†*]/g,'').replace(/\s+/g,'');
  }

  function icdName(code){
    const map=window.VPMED_ICD10_NAME_MAP_2026||{};
    const raw=String(code||'').trim().toUpperCase();
    return map[raw]||map[icdKey(raw)]||'';
  }

  function icdLabel(code){
    const raw=String(code||'').trim().toUpperCase();
    const name=icdName(raw);
    return name?`${raw} — ${name}`:raw;
  }

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
      entry.paymentSource=detected==='Chưa xác định'
        ?'unresolved'
        :(detected==='BHYT'&&hasBhytPrescriptionMarker(text)
          ?'bhyt-marker'
          :(detected==='Dịch vụ'&&hasHospitalPharmacyServiceMarker(text)?'hospital-pharmacy':'title'));
    }
    const drugs=matchDrugsFromText(text,entry,providedDrugs);
    const structured=normalizeProvidedDiagnosis(providedDiagnosis);
    entry.diagnosis=structured.primary.length||structured.secondary.length?structured:extractDiagnosisFromText(text);
    entry.drugCount=drugs.length;
    entry.status=entry.payment==='Chưa xác định'||!drugs.length?'review':'done';
    entry.note=entry.payment==='Chưa xác định'
      ?'Không chắc loại đơn — cần chọn thủ công'
      :(entry.paymentSource==='bhyt-marker'
        ?`BHYT theo mẫu Đơn thuốc/Quầy phát thuốc Bảo Hiểm · ${drugs.length} thuốc`
        :(entry.paymentSource==='hospital-pharmacy'
          ?`Dịch vụ theo mẫu Nhà thuốc Bệnh Viện · ${drugs.length} thuốc`
          :(entry.payment==='Dịch vụ'&&SERVICE_GENERIC_PRESCRIPTION_PATTERN.test(norm(text))
            ?`Dịch vụ theo mẫu Đơn thuốc · ${drugs.length} thuốc`
            :`${entry.payment} theo tiêu đề · ${drugs.length} thuốc`)));
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
      source:withDiagnosis.length?'':'OCR chưa tìm thấy vùng chẩn đoán',
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
    if(primary)primary.textContent=state.diagnosis.primary.length?state.diagnosis.primary.map(icdLabel).join(' · '):'Chưa nhận diện';
    const diagnosisSource=rx$('#rxPrimaryDiagnosisSource');
    if(diagnosisSource){diagnosisSource.textContent=state.diagnosis.source||'';diagnosisSource.hidden=!state.diagnosis.source;}
    if(secondary)secondary.innerHTML=state.diagnosis.secondary.length?state.diagnosis.secondary.map(code=>`<span>${esc(icdLabel(code))}</span>`).join(''):'<em>Chưa nhận diện</em>';
    const box=rx$('#rxDiagnosisChips');
    if(box)box.innerHTML=codes.length
      ?`${state.diagnosis.primary.map(code=>`<span class="is-code">Chính: ${esc(icdLabel(code))}</span>`).join('')}${state.diagnosis.secondary.map(code=>`<span class="is-code">Kèm: ${esc(icdLabel(code))}</span>`).join('')}${state.diagnosis.conflicts.length?`<span>⚠ Có nhiều mã bệnh chính trên các đơn: ${esc(state.diagnosis.conflicts.map(icdLabel).join(' · '))}</span>`:''}`
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
      else{
        const observedLabels=codes.map(code=>icdName(code)||code);
        const targetTexts=[...mappings.map(mapping=>mapping.term),...(drug.profile?.indications||[])];
        const related=Boolean(matcher?.isClinicalTextRelated?.(observedLabels,targetTexts));
        missing.push({drug,mappings,allowed,related});
      }
    });
    return {missing,unmapped,matched};
  }

  function interactionVisualSeverity(rule){
    const explicit=norm(rule?.visualSeverity);
    if(explicit==='critical')return {key:'critical',className:'rx-interaction-critical'};
    if(explicit==='high')return {key:'high',className:'rx-interaction-high'};
    if(explicit==='moderate')return {key:'moderate',className:'rx-interaction-moderate'};
    if(explicit==='low')return {key:'low',className:'rx-interaction-low'};

    const level=norm(rule?.level);
    const detail=norm(`${rule?.level||''} ${rule?.management||''} ${rule?.consequence||''}`);
    if(rule?.sourceType==='moh-contraindication-list'&&!rule?.conditional){
      return {key:'critical',className:'rx-interaction-critical'};
    }
    if(rule?.conditional||/co dieu kien|uu tien tranh|tranh phoi hop/.test(level)){
      return {key:'high',className:'rx-interaction-high'};
    }
    if(/chong chi dinh|tuyet doi|rat nghiem trong|critical/.test(level)){
      return {key:'critical',className:'rx-interaction-critical'};
    }
    if(/nghiem trong|nguy co cao|major|severe/.test(detail)){
      return {key:'high',className:'rx-interaction-high'};
    }
    if(/trung binh|can than|theo doi|dieu chinh|moderate/.test(detail)){
      return {key:'moderate',className:'rx-interaction-moderate'};
    }
    return {key:'low',className:'rx-interaction-low'};
  }

  function interactionSourceTier(rule){
    if(rule?.sourceType==='moh-contraindication-list'||/5948\/qd byt/.test(norm(rule?.legalBasis||rule?.source))){
      return {key:'moh',label:'Bộ Y tế · QĐ 5948',note:'Danh mục chống chỉ định'};
    }
    if(rule?.sourceType==='national-pharmacovigilance'){
      return {key:'diadr',label:'DI&ADR Quốc gia',note:'Cảnh báo chuyên môn bổ sung'};
    }
    return {key:'other',label:'Nguồn chuyên môn',note:'Cần đối chiếu nguồn'};
  }

  function safeSourceUrl(value){
    const url=String(value||'').trim();
    return /^(https?:\/\/|sources\/)/i.test(url)?url:'';
  }

  function interactionHtml(hit){
    const {rule,first,second}=hit;
    const cross=first.payment!==second.payment;
    const severity=interactionVisualSeverity(rule);
    const tier=interactionSourceTier(rule);
    const sourceUrl=safeSourceUrl(rule.sourceUrl||rule.url);
    const sourceText=esc(rule.source||'QĐ 5948/QĐ-BYT');
    const sourceHtml=sourceUrl?`<a class="rx-source-link" href="${esc(sourceUrl)}" target="_blank" rel="noopener">${sourceText} ↗</a>`:sourceText;
    return `<article class="rx-alert rx-alert-interaction ${severity.className}" data-interaction-severity="${severity.key}" data-source-tier="${tier.key}">
      <div class="rx-source-tier rx-source-tier-${tier.key}"><b>${esc(tier.label)}</b><span>${esc(tier.note)}</span></div>
      <div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><small>${esc(rule.level||'Tương tác cần xử trí')}</small><h3>${esc(first.name)} + ${esc(second.name)}</h3></div></div>
      <div class="rx-cross-payment"><span class="${paymentTagClass(first.payment)}">${esc(first.payment)}</span><em>${cross?'↔ kiểm tra chéo ↔':'↔ cùng nguồn ↔'}</em><span class="${paymentTagClass(second.payment)}">${esc(second.payment)}</span></div>
      <dl>
        <div><dt>Trạng thái</dt><dd>${esc(rule.regulatoryStatus||rule.level||'Cảnh báo tương tác')}</dd></div>
        <div><dt>Cơ chế</dt><dd>${esc(rule.mechanism||'Chưa có mô tả.')}</dd></div>
        <div><dt>Hậu quả</dt><dd>${esc(rule.consequence||'Cần đánh giá nguy cơ lâm sàng.')}</dd></div>
        <div><dt>Xử trí</dt><dd>${esc(rule.management||'Đối chiếu nguồn và trao đổi bác sĩ điều trị.')}</dd></div>
        <div><dt>Căn cứ</dt><dd>${esc(rule.legalBasis||'Quyết định 5948/QĐ-BYT ngày 30/12/2021')}</dd></div>
        <div><dt>Nguồn</dt><dd>${sourceHtml}</dd></div>
      </dl>
    </article>`;
  }

  function missingIcdHtml(item){
    const drugName=item.drug?.name||item.drug?.rawName||'Thuốc BHYT';
    const terms=item.mappings.map(mapping=>{
      const labels=(mapping.codes||[]).map(icdLabel).join(', ');
      return `${mapping.term}: ${labels}`;
    }).join(' · ');
    const related=Boolean(item.related);
    const status=related?'mã bệnh chưa thật sự phù hợp':'thiếu mã bệnh';
    const eyebrow=related?'Mã bệnh chưa thật sự phù hợp':'Thiếu mã bệnh BHYT';
    return `<article class="rx-alert rx-alert-warning rx-alert-missing-icd" data-icd-status="${related?'related':'missing'}">
      <div class="rx-alert-header"><span class="rx-alert-icon">ICD</span><div><small>${eyebrow}</small><h3>${esc(drugName)}: ${status}</h3></div></div>
      <dl><div><dt>Gợi ý</dt><dd>${esc(terms||item.allowed.map(icdLabel).join(', '))}</dd></div></dl>
    </article>`;
  }

  function familyMatchesHtml(items){
    const rows=items.filter(item=>item.match?.mode==='category');
    if(!rows.length)return '';
    return `<article class="rx-alert rx-alert-success">
      <div class="rx-alert-header"><span class="rx-alert-icon">✓</span><div><h3>Chưa ghi nhận tương tác thuốc hoặc thiếu mã bệnh</h3></div></div>
    </article>`;
  }

  function isInpatientOrder(){
    return norm(rx$('#rxEncounterType')?.value)==='y lenh noi tru';
  }

  function shorten(value,max=190){
    const text=compactOrderText(value);
    return text.length>max?`${text.slice(0,max-1).trim()}…`:text;
  }

  function num(value){
    const parsed=Number(String(value||'').replace(',','.'));
    return Number.isFinite(parsed)?parsed:null;
  }

  function prettyNumber(value){
    if(!Number.isFinite(value))return '';
    return Number.isInteger(value)?String(value):String(Math.round(value*100)/100).replace('.',',');
  }

  function parseStrengthAmount(strength){
    const text=String(strength||'').replace(/,/g,'.');
    if(/[+;]/.test(text))return null;
    const match=text.match(/(\d+(?:\.\d+)?)\s*(mcg|µg|mg|g|iu|ui)\b/i);
    if(!match)return null;
    let value=num(match[1]);
    let unit=match[2].toLowerCase();
    if(unit==='µg')unit='mcg';
    if(unit==='ui')unit='IU';
    else if(unit==='iu')unit='IU';
    return {value,unit};
  }

  function parseFrequencyPerDay(text){
    const key=norm(text);
    let match=key.match(/(?:ngay|24 gio)[^0-9]{0,18}(\d+(?:[.,]\d+)?)\s*lan\b/);
    if(!match)match=key.match(/\b(\d+(?:[.,]\d+)?)\s*lan\s*(?:\/|moi)?\s*ngay\b/);
    if(match)return num(match[1]);
    match=key.match(/\bmoi\s*(\d+(?:[.,]\d+)?)\s*gio\b/);
    if(match){const hours=num(match[1]);return hours?24/hours:null}
    match=key.match(/\bq\s*(\d+(?:[.,]\d+)?)\s*h\b/);
    if(match){const hours=num(match[1]);return hours?24/hours:null}
    return null;
  }

  function parseUnitPerDose(text){
    const key=norm(text);
    let match=key.match(/(?:moi lan|lan)[^0-9]{0,14}(\d+(?:[.,]\d+)?)\s*(vien|ong|lo|goi|ml)\b/);
    if(!match)match=key.match(/\b(\d+(?:[.,]\d+)?)\s*(vien|ong|lo|goi|ml)\s*(?:\/|moi)?\s*lan\b/);
    if(!match)return null;
    return {value:num(match[1]),unit:match[2]};
  }

  function parseExplicitDose(text){
    const raw=String(text||'').replace(/,/g,'.');
    const patterns=[
      /(?:liều|lieu|mỗi lần|moi lan|tiêm|tiem|truyền|truyen|uống|uong|dùng|dung)\D{0,24}(\d+(?:\.\d+)?)\s*(mcg|µg|mg|g|iu|ui)\b/i,
      /\b(\d+(?:\.\d+)?)\s*(mcg|µg|mg|g|iu|ui)\s*(?:\/|mỗi|moi)\s*(?:lần|lan)\b/i
    ];
    for(const pattern of patterns){
      const match=raw.match(pattern);
      if(match){
        let unit=match[2].toLowerCase();
        if(unit==='µg')unit='mcg';
        if(unit==='ui'||unit==='iu')unit='IU';
        return {value:num(match[1]),unit};
      }
    }
    return null;
  }

  function doseUnitLabel(unit){
    return ({vien:'viên',ong:'ống',lo:'lọ',goi:'gói',ml:'mL'})[unit]||unit;
  }

  function doseCalculation(drug){
    const order=drug.orderText||'';
    if(!order)return {text:'Chưa đọc được liều/tần suất từ y lệnh.',complete:false};
    const frequency=parseFrequencyPerDay(order);
    const units=parseUnitPerDose(order);
    const strength=parseStrengthAmount(drug.strength);
    const explicit=parseExplicitDose(order);
    const parts=[];
    if(units&&Number.isFinite(units.value))parts.push(`${prettyNumber(units.value)} ${doseUnitLabel(units.unit)}/lần`);
    if(explicit&&Number.isFinite(explicit.value))parts.push(`${prettyNumber(explicit.value)} ${explicit.unit}/lần`);
    if(frequency&&Number.isFinite(frequency))parts.push(`${prettyNumber(frequency)} lần/ngày`);
    if(units&&strength&&frequency&&Number.isFinite(units.value)&&Number.isFinite(strength.value)){
      parts.push(`≈ ${prettyNumber(units.value*strength.value*frequency)} ${strength.unit}/ngày`);
    }else if(explicit&&frequency&&Number.isFinite(explicit.value)){
      parts.push(`≈ ${prettyNumber(explicit.value*frequency)} ${explicit.unit}/ngày`);
    }else if(units&&frequency&&Number.isFinite(units.value)){
      parts.push(`≈ ${prettyNumber(units.value*frequency)} ${doseUnitLabel(units.unit)}/ngày`);
    }
    return {text:parts.length?parts.join(' · '):'Chưa đủ dữ liệu để tính tổng liều/ngày.',complete:Boolean(frequency&&(units||explicit))};
  }

  function infusionCalculation(drug){
    const routeKey=norm([drug.route,drug.profile?.productRoute,drug.orderText].join(' '));
    if(!/\b(truyen|ttm|tinh mach)\b/.test(routeKey))return null;
    const raw=String(drug.orderText||'').replace(/,/g,'.');
    const durationMatch=raw.match(/(?:trong|truyền trong|truyen trong)\s*(\d+(?:\.\d+)?)\s*(phút|phut|giờ|gio|h)\b/i);
    const volumes=[...raw.matchAll(/(\d+(?:\.\d+)?)\s*ml\b/ig)].map(match=>num(match[1])).filter(Number.isFinite);
    const volume=volumes.length?Math.max(...volumes):null;
    if(!durationMatch)return {text:'Chưa có thời gian truyền để tính tốc độ.',complete:false};
    const durationValue=num(durationMatch[1]);
    const unit=norm(durationMatch[2]);
    const hours=/phut/.test(unit)?durationValue/60:durationValue;
    if(!hours)return {text:'Chưa đủ dữ liệu để tính tốc độ truyền.',complete:false};
    const parts=[];
    if(volume)parts.push(`${prettyNumber(volume/hours)} mL/giờ`);
    const dose=parseExplicitDose(raw);
    if(dose&&Number.isFinite(dose.value))parts.push(`${prettyNumber(dose.value/hours)} ${dose.unit}/giờ`);
    return {text:parts.length?parts.join(' · '):`Thời gian truyền ${prettyNumber(durationValue)} ${/phut/.test(unit)?'phút':'giờ'}; chưa có thể tích/liều để tính tốc độ.`,complete:Boolean(parts.length)};
  }

  function officialSourceApi(){
    return window.VPMED_RX_OFFICIAL_SOURCE_API||null;
  }

  function renderRuleSources(){
    const api=officialSourceApi();
    const labels=api?.footerLabels?.();
    const items=[...document.querySelectorAll('#rxRuleVersion .rx-rule-item')];
    if(!labels||items.length<4)return;
    const values=[labels.interaction,labels.icd,labels.prescribing,labels.bhyt];
    items.slice(0,4).forEach((item,index)=>{
      const span=item.querySelector('span');
      if(span&&values[index])span.textContent=values[index];
    });
  }

  function profileSourceLabel(profile){
    const titles=unique((profile?.sources||[]).map(source=>source?.title).filter(Boolean));
    const clinical=titles.filter(title=>/Dược thư|Duoc thu|Hướng dẫn|Huong dan/i.test(title));
    const approved=titles.filter(title=>/HDSD|Quản lý Dược|Quan ly Duoc/i.test(title));
    const preferred=unique([...clinical,...approved]);
    if(preferred.length||titles.length)return shorten((preferred.length?preferred:titles).slice(0,3).join(' · '),150);
    const external=officialSourceApi()?.profileEvidence?.(profile)||[];
    const externalTitles=unique(external.map(source=>source.short||source.title).filter(Boolean));
    return shorten(externalTitles.slice(0,3).join(' · '),150)||'HDSD/SPC Cục QLD · Dược thư QGVN III · Phác đồ/Hướng dẫn BYT';
  }

  function inpatientDuplicateActives(){
    const groups=new Map();
    state.drugs.forEach(drug=>{
      const key=tokenKey(drug.active);
      if(!key)return;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(drug);
    });
    return [...groups.values()].filter(group=>group.length>1);
  }

  function inpatientInteractionHtml(hit){
    const {rule,first,second}=hit;
    const severity=interactionVisualSeverity(rule);
    const tier=interactionSourceTier(rule);
    return `<article class="rx-alert rx-alert-interaction ${severity.className}" data-interaction-severity="${severity.key}" data-source-tier="${tier.key}"><div class="rx-source-tier rx-source-tier-${tier.key}"><b>${esc(tier.label)}</b><span>${esc(tier.note)}</span></div><div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><small>${esc(rule.level||'Tương tác cần xử trí')}</small><h3>${esc(first.name)} + ${esc(second.name)}</h3></div></div><p>• <b>Trạng thái:</b> ${esc(rule.regulatoryStatus||rule.level||'Cảnh báo tương tác')}</p><p>• <b>Hậu quả:</b> ${esc(shorten(rule.consequence||'Cần đánh giá nguy cơ lâm sàng.',170))}</p><p>• <b>Xử trí:</b> ${esc(shorten(rule.management||'Trao đổi bác sĩ điều trị.',190))}</p><p>• <b>Căn cứ:</b> ${esc(rule.legalBasis||'QĐ 5948/QĐ-BYT')}</p></article>`;
  }

  function inpatientDrugHtml(drug){
    const dose=doseCalculation(drug);
    const infusion=infusionCalculation(drug);
    const standard=shorten(drug.profile?.standard||'Chưa có liều tham chiếu đã xác minh trong dữ liệu hiện có.',220);
    const order=shorten(drug.orderText||'OCR/HIS chưa đọc được câu y lệnh.',190);
    const indication=shorten((drug.profile?.indications||[])[0]||'Chưa có chỉ định cấu trúc trong hồ sơ thuốc.',170);
    const tone='rx-alert-info';
    return `<article class="rx-alert ${tone}"><div class="rx-alert-header"><span class="rx-alert-icon">Rx</span><div><h3>${esc(drug.name||drug.rawName)}</h3></div></div><p>• <b>Y lệnh:</b> ${esc(order)}</p><p>• <b>Liều tính:</b> ${esc(dose.text)}</p><p>• <b>Liều/cách dùng tham chiếu:</b> ${esc(standard)}</p>${infusion?`<p>• <b>Tốc độ truyền:</b> ${esc(infusion.text)}</p>`:''}<p>• <b>Chỉ định:</b> ${esc(indication)}</p><p>• <b>Nguồn:</b> ${esc(profileSourceLabel(drug.profile))}</p></article>`;
  }

  function inpatientBhytHtml(item){
    const status=item.related?'Mã bệnh chưa thật sự phù hợp':'Thiếu mã bệnh BHYT';
    return `<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">BHYT</span><div><h3>${esc(item.drug.name)}: ${status}</h3></div></div><p>• <b>Xuất toán BHYT:</b> ${item.related?'Đã có chẩn đoán liên quan nhưng mã hiện tại chưa khớp chỉ định đã đối chiếu.':'Chưa có mã bệnh tương ứng với chỉ định đã đối chiếu.'}</p><p>• <b>Xử trí:</b> Kiểm tra chẩn đoán, hồ sơ bệnh án và điều kiện thanh toán hiện hành.</p></article>`;
  }

  function checkInpatientOrder(){
    if(!state.drugs.length){alert('Vui lòng thêm ít nhất một thuốc vào y lệnh.');return}
    const codes=diagnosisCodes();
    const interactions=findInteractions();
    const {missing,unmapped,matched}=icdReview(codes);
    const unknown=state.drugs.filter(drug=>!drug.resolved);
    const duplicates=inpatientDuplicateActives();
    const doseIssues=state.drugs.filter(drug=>{
      const dose=doseCalculation(drug);
      const infusion=infusionCalculation(drug);
      return !dose.complete||Boolean(infusion&&!infusion.complete);
    });
    const bhytIssues=missing.length+(state.drugs.some(drug=>drug.payment==='BHYT')&&!codes.length?1:0);
    const critical=interactions.length+duplicates.length+unknown.length+bhytIssues;
    state.lastCheck={mode:'inpatient',interactions,missing,unmapped,matched,unknown,duplicates,doseIssues,checkedAt:new Date()};
    rx$('#rxResetPrescription').disabled=false;
    rx$('#rxResetPrescription').title='Xóa dữ liệu y lệnh hiện tại để kiểm tra y lệnh mới';
    rx$('#rxResultTitle').textContent='Phân tích y lệnh nội trú';
    rx$('#rxScore').innerHTML='<b>—</b><small></small>';
    rx$('#rxSummary').innerHTML=`<div><b>${doseIssues.length}</b><span>Liều/cách dùng</span></div><div><b>${interactions.length}</b><span>Tương tác</span></div><div><b>${bhytIssues}</b><span>BHYT</span></div>`;
    const blocks=[];
    interactions.forEach(hit=>blocks.push(inpatientInteractionHtml(hit)));
    duplicates.forEach(group=>blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><h3>Trùng hoạt chất trong y lệnh</h3></div></div><p>• <b>Thuốc:</b> ${esc(group.map(drug=>drug.name).join(' + '))}</p><p>• <b>Xử trí:</b> Kiểm tra trùng điều trị và tổng liều trước khi thực hiện.</p></article>`));
    state.drugs.forEach(drug=>blocks.push(inpatientDrugHtml(drug)));
    if(state.drugs.some(drug=>drug.payment==='BHYT')&&!codes.length)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">BHYT</span><div><h3>Thiếu mã bệnh để kiểm tra BHYT</h3></div></div><p>• <b>Xuất toán BHYT:</b> Chưa đủ dữ liệu mã ICD để đối chiếu.</p></article>`);
    missing.forEach(item=>blocks.push(inpatientBhytHtml(item)));
    if(unmapped.length)blocks.push(`<article class="rx-alert rx-alert-info"><div class="rx-alert-header"><span class="rx-alert-icon">i</span><div><h3>Chưa đủ dữ liệu BHYT</h3></div></div><p>• <b>Thuốc:</b> ${esc(unmapped.map(drug=>drug.name).join(', '))}</p><p>• <b>Xử trí:</b> Đối chiếu HDSD/SPC Cục QLD, Dược thư QGVN III, phác đồ/hướng dẫn Bộ Y tế và quy định BHYT hiện hành.</p></article>`);
    if(unknown.length)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">?</span><div><h3>Có thuốc chưa chuẩn hóa</h3></div></div><p>• <b>Thuốc:</b> ${esc(unknown.map(drug=>drug.rawName||drug.name).join(', '))}</p><p>• <b>Xử trí:</b> Xác nhận tên/hàm lượng trước khi kết luận.</p></article>`);
    const conclusionTone=critical?'rx-alert-warning':doseIssues.length?'rx-alert-info':'rx-alert-success';
    const conclusion=critical?'Cần rà soát và xử trí các mục cảnh báo trước khi thực hiện y lệnh.':doseIssues.length?'Chưa thấy cảnh báo nghiêm trọng; cần bổ sung dữ liệu liều/cách dùng còn thiếu.':'Chưa ghi nhận vấn đề nổi bật trên dữ liệu y lệnh hiện có.';
    const conclusionIcon=critical||doseIssues.length?'!':'✓';
    blocks.push(`<article class="rx-alert ${conclusionTone}"><div class="rx-alert-header"><span class="rx-alert-icon">${conclusionIcon}</span><div><h3>Kết luận</h3></div></div><p>• <b>Kết luận:</b> ${esc(conclusion)}</p></article>`);
    rx$('#rxResultBody').innerHTML=blocks.join('');
    rx$('#rxResultCard').scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
  }

  function checkPrescription(){
    if(isInpatientOrder()){checkInpatientOrder();return}
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

    const title=interactions.length?'Có tương tác chống chỉ định/cần xử trí':unclassifiedCount?'Cần xác nhận loại đơn':icdIssueCount?'Cần bổ sung kiểm tra mã bệnh':'Đơn thuốc đã được rà soát';
    rx$('#rxResultTitle').textContent=title;
    rx$('#rxScore').innerHTML=`<b>${score}</b><small>/100</small>`;
    rx$('#rxSummary').innerHTML=`<div><b>${interactions.length}</b><span>Tương tác</span></div><div><b>${icdIssueCount}</b><span>Mã bệnh</span></div><div><b>${state.drugs.length}</b><span>Đã đối chiếu</span></div>`;

    const blocks=[];
    interactions.forEach(hit=>blocks.push(interactionHtml(hit)));
    if(missingPrimary)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><small>OCR chẩn đoán chưa hoàn tất</small><h3>${noDiagnosis?'Chưa nhận diện được mã bệnh trên các đơn':'Đã thấy mã bệnh kèm theo nhưng chưa xác định được mã bệnh chính'}</h3></div></div><p>Hệ thống đã tự tìm vùng chẩn đoán nhưng chưa xác định chắc MA_BENH_CHINH. Hãy kiểm tra chất lượng ảnh hoặc dùng mục “Chỉnh lại nếu OCR đọc sai”; không tự thêm mã khi hồ sơ không có chẩn đoán tương ứng.</p></article>`);
    if(diagnosisConflict)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">!</span><div><small>Nhiều ứng viên mã bệnh chính</small><h3>${esc(state.diagnosis.conflicts.map(icdLabel).join(' · '))}</h3></div></div><p>Các đơn trong cùng lượt có mã bệnh chính OCR khác nhau. Cần xác nhận đúng mã chính trước khi gửi dữ liệu giám định.</p></article>`);
    missing.forEach(item=>blocks.push(missingIcdHtml(item)));
    const familyMatchBlock=icdIssueCount===0?familyMatchesHtml(matched):'';
    if(familyMatchBlock)blocks.push(familyMatchBlock);
    if(unclassifiedCount)blocks.push(`<article class="rx-alert rx-alert-warning"><div class="rx-alert-header"><span class="rx-alert-icon">?</span><div><small>OCR tiêu đề chưa chắc chắn</small><h3>${unclassifiedCount} đơn/nhóm thuốc chưa xác định BHYT hay dịch vụ</h3></div></div><p>${esc(unclassifiedFiles.length?unclassifiedFiles.map(entry=>entry.name).join(', '):unclassifiedDrugs.map(drug=>drug.sourceName||drug.name).join(', '))}. Vui lòng chọn lại loại đơn trong hàng đợi hoặc bảng thuốc rồi kiểm tra lại.</p></article>`);
    if(unmapped.length)blocks.push(`<article class="rx-alert rx-alert-info"><div class="rx-alert-header"><span class="rx-alert-icon">i</span><div><small>Chưa đủ dữ liệu đối chiếu</small><h3>${unmapped.length} thuốc BHYT chưa có ánh xạ ICD cấu trúc</h3></div></div><p>${esc(unmapped.map(drug=>drug.name).join(', '))}. Đối chiếu HDSD/SPC được Cục Quản lý Dược phê duyệt, Dược thư QGVN III, phác đồ/hướng dẫn Bộ Y tế và quy định BHYT hiện hành trước khi kết luận.</p></article>`);
    if(unknown.length)blocks.push(`<article class="rx-alert rx-alert-info"><div class="rx-alert-header"><span class="rx-alert-icon">?</span><div><small>Cần nhân viên y tế xác nhận</small><h3>${unknown.length} tên thuốc chưa chuẩn hóa</h3></div></div><p>${esc(unknown.map(drug=>drug.rawName||drug.name).join(', '))}. Các thuốc này chưa được dùng để kết luận tương tác hoặc ICD.</p></article>`);
    if(!blocks.length)blocks.push('<article class="rx-alert rx-alert-success"><div class="rx-alert-header"><span class="rx-alert-icon">✓</span><div><h3>Chưa ghi nhận tương tác thuốc hoặc thiếu mã bệnh</h3></div></div></article>');
    rx$('#rxResultBody').innerHTML=blocks.join('');
    rx$('#rxResultCard').scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
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

  function resetPrescription(options={}){
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
    if(options.scroll!==false)rx$('#view-prescription-check')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
  }

  function showRxToast(message){
    let toast=rx$('#rxToast');
    if(!toast){
      toast=document.createElement('div');
      toast.id='rxToast';
      toast.className='rx-toast';
      toast.setAttribute('role','status');
      toast.setAttribute('aria-live','polite');
      document.body.appendChild(toast);
    }
    toast.textContent=message;
    clearTimeout(toast._hideTimer);
    toast.classList.remove('is-visible');
    requestAnimationFrame(()=>toast.classList.add('is-visible'));
    toast._hideTimer=setTimeout(()=>toast.classList.remove('is-visible'),2800);
  }

  function bindEvents(){
    document.querySelectorAll('[data-open="prescription-check"]').forEach(button=>button.addEventListener('click',()=>ensureData().catch(()=>{})));
    rx$('#rxResetPrescription')?.addEventListener('click',resetPrescription);
    rx$('#rxEncounterType')?.addEventListener('change',markStale);
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
    rx$('#rxPrescriptionFile')?.addEventListener('change',event=>{onFilesSelected(event.target.files);event.target.value=''});
    rx$('#rxRunOcr')?.addEventListener('click',runOcr);
    rx$('#rxPrintResult')?.addEventListener('click',()=>window.print());
    rx$('#rxClearSession')?.addEventListener('click',()=>{
      // Xóa ngay dữ liệu tra cứu trên màn hình, không hỏi xác nhận.
      // Không cuộn trang để người dùng vẫn giữ đúng vị trí vừa thao tác.
      resetPrescription({scroll:false});
      showRxToast('Đã xóa toàn bộ dữ liệu tra cứu');
    });
  }

  bindEvents();
  renderDiagnosisChips();
  renderFileQueue();
  renderRows();
  if(location.hash==='#prescription-check')ensureData().catch(()=>{});
})();
