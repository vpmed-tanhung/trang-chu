const D=window.VPMED_DRUGS||[],I=window.VPMED_INTERACTIONS||[];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function showView(name){if(name==='icd10-bhyt')name='home';$$('.view').forEach(v=>v.classList.remove('active'));$('#view-'+name)?.classList.add('active');$$('.main-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));history.replaceState(null,'','#'+name);$('#mainNav').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));$$('[data-open]').forEach(b=>b.onclick=()=>showView(b.dataset.open));$$('[data-go]').forEach(b=>b.onclick=e=>{e.preventDefault();showView(b.dataset.go)});$('#menuBtn').onclick=()=>$('#mainNav').classList.toggle('open');
const initial=location.hash.replace('#','');if(['home','dose','petct-dose','antibiotics','diseases','prescription-check','interactions','hepatotoxicity','pregnancy-lactation','icd10-bhyt','pediatric-dose','injectable-guide','sources'].includes(initial))showView(initial);
const statDrugs=$('#statDrugs'),statInteractions=$('#statInteractions');if(statDrugs)statDrugs.textContent=D.length;if(statInteractions)statInteractions.textContent=I.length;

// Antibiotics
let selected=D[0]?.id;
function groups(){const g=[...new Set(D.map(x=>x.group).filter(Boolean))].sort();$('#group').innerHTML='<option value="">Tất cả nhóm</option>'+g.map(x=>`<option>${esc(x)}</option>`).join('')}
function filtered(){const q=norm($('#q').value),g=$('#group').value;return D.filter(x=>(!g||x.group===g)&&(!q||norm([x.brand,x.active,x.group,x.strength,x.route].join(' ')).includes(q)))}
function renderDrugList(){const f=filtered();$('#drugList').innerHTML=f.map(x=>`<div class="drug-item ${x.id===selected?'active':''}" data-id="${x.id}"><b>${esc(x.brand)}</b><small>${esc(x.active)}</small><small>${esc(x.strength)} · ${esc(x.route)}</small></div>`).join('')||'<div class="alert">Không tìm thấy thuốc phù hợp.</div>';$$('.drug-item').forEach(e=>e.onclick=()=>{selected=+e.dataset.id;renderDrugList();renderProfile()})}
const ul=a=>`<ul>${(a||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
function renalDoseTableHtml(drug){
  const bands=[],notes=[];
  (drug.renal||[]).forEach(item=>{
    const match=String(item).match(/^(CrCl\s+[^:]+):\s*(.+)$/i);
    if(match)bands.push({label:match[1],dose:match[2]});
    else notes.push(item);
  });
  if(!bands.length)return ul(drug.renal);
  return `<div class="renal-dose-table">
    <div class="renal-dose-table-grid">${bands.map(band=>`<div class="renal-dose-cell"><span class="renal-dose-label">${esc(band.label)}</span><span class="renal-dose-value">${esc(band.dose)}</span></div>`).join('')}</div>
  </div>${notes.length?`<div class="renal-dose-notes">${ul(notes)}</div>`:''}`;
}
const sourceHtml=a=>`<div class="source-list">${(a||[]).map(x=>`<div class="source-line"><b>${esc(x.title)}</b><br><small>${esc(x.note)}</small>${x.url?`<br><a href="${esc(x.url)}" target="_blank" rel="noopener">Mở nguồn ↗</a>`:''}</div>`).join('')}</div>`;
const directDoseSources=d=>`<div class="direct-dose-sources">${(d.doseSources||[]).map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a>`).join('')||'<span>Chưa có liên kết nguồn trực tiếp.</span>'}</div>`;

function drugInteractionMatches(d){
  const raw=norm(String(d.active||'').replace(/\*/g,'').replace(/hydrochloride/g,'').replace(/acid clavulanic|acid clavulanic/g,'clavulanat'));
  const keys=raw.split(/\s+\+\s+/).map(x=>x.trim()).filter(x=>x.length>3);
  const brand=norm(d.brand||'');
  return I.filter(i=>{const z=norm(i.name||'');return keys.some(k=>z.includes(k)||k.includes(z))||z.includes(brand)});
}
function conciseDDI(d,limit=4){
  const found=drugInteractionMatches(d);
  const fromList=found.slice(0,limit).map(i=>`${i.name}: ${i.management||i.consequence||'Cần kiểm tra và xử trí theo nguồn.'}`);
  return fromList.length?fromList:(d.clinicalDDI||[]).slice(0,limit);
}
function detailList(items){return `<ul class="clinical-list">${(items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}

function infusionSections(d){
  const f=d.infusionStructured;
  if(!f)return `<div class="infusion-grid"><section><h4>Hoàn nguyên</h4><p>${esc((d.infusionDetails||[d.infusion])[0]||'Chưa có dữ liệu hoàn nguyên đã xác minh.')}</p></section><section><h4>Pha loãng</h4><p>Chưa có dữ liệu pha loãng đã xác minh.</p></section><section><h4>Cách dùng / tốc độ</h4><p>${esc((d.infusionDetails||[])[1]||'Chưa có tốc độ truyền đã xác minh.')}</p></section><section><h4>Đường truyền / tương hợp</h4><p>Dùng đường riêng và súc rửa dây truyền trước, sau khi dùng.</p></section><section><h4>Ổn định sau pha</h4><p>Không lưu dung dịch sau pha khi chưa có dữ liệu ổn định cụ thể.</p></section></div>`;
  const rows=[['Hoàn nguyên',f.reconstitution],['Pha loãng',f.dilution],['Cách dùng / tốc độ',f.administration],['Đường truyền / tương hợp',f.line],['Ổn định sau pha',f.stability]];
  return `<div class="infusion-grid">${rows.map(([h,v])=>`<section><h4>${esc(h)}</h4><p>${esc(v)}</p></section>`).join('')}</div>`;
}



function calcEgfr2021(age,scrMgDl,sex){
  const female=sex==='f';
  const k=female?0.7:0.9;
  const alpha=female?-0.241:-0.302;
  const ratio=scrMgDl/k;
  return 142*Math.pow(Math.min(ratio,1),alpha)*Math.pow(Math.max(ratio,1),-1.2)*Math.pow(0.9938,age)*(female?1.012:1);
}
function calcBsaMosteller(heightCm,weightKg){
  if(!heightCm||!weightKg)return null;
  return Math.sqrt((heightCm*weightKg)/3600);
}
function egfrCategory(egfr){
  if(egfr>=90)return {key:'g1',stage:'G1',label:'Bình thường hoặc cao',tone:'preserved'};
  if(egfr>=60)return {key:'g2',stage:'G2',label:'Giảm nhẹ',tone:'mild'};
  if(egfr>=45)return {key:'g3a',stage:'G3a',label:'Giảm nhẹ đến trung bình',tone:'moderate'};
  if(egfr>=30)return {key:'g3b',stage:'G3b',label:'Giảm trung bình đến nặng',tone:'severe'};
  if(egfr>=15)return {key:'g4',stage:'G4',label:'Giảm nặng',tone:'severe'};
  return {key:'g5',stage:'G5',label:'Suy thận',tone:'critical'};
}
function egfrAlertHtml(egfr,egfrAbsolute){
  const g=egfrCategory(egfr);
  const absolute=egfrAbsolute?`<div class="egfr-absolute"><b>eGFR quy đổi theo diện tích cơ thể:</b> ${egfrAbsolute.toFixed(1)} mL/phút</div>`:'';
  return `<div class="renal-alert renal-${g.tone}"><div class="renal-alert-icon" aria-hidden="true">${g.stage}</div><div><span>Phân loại theo eGFR CKD-EPI 2021</span><strong>${g.stage} — ${esc(g.label)}</strong><p>eGFR: ${egfr.toFixed(1)} mL/phút/1,73 m².</p>${absolute}<small>Phân loại G1–G5 mô tả mức lọc cầu thận ước tính tại thời điểm xét nghiệm. Một giá trị eGFR đơn lẻ chưa đủ để chẩn đoán bệnh thận mạn. Với G1–G2, chỉ xác định bệnh thận mạn khi có dấu hiệu tổn thương thận và tình trạng kéo dài ít nhất 3 tháng; nên đánh giá thêm tỷ số albumin/creatinin niệu (ACR).</small></div></div>`;
}

function renalRiskByCrCl(crcl){
  if(crcl>=90)return {key:'preserved',label:'Chức năng thận theo CrCl còn bảo tồn',short:'Bảo tồn',warning:'Tiếp tục đối chiếu liều theo đúng thuốc và chỉ định; vẫn theo dõi creatinin khi có nguy cơ độc thận.'};
  if(crcl>=60)return {key:'mild',label:'Giảm chức năng thận mức độ nhẹ',short:'Giảm nhẹ',warning:'Rà soát thuốc cần hiệu chỉnh khi CrCl giảm; theo dõi diễn biến creatinin và lượng nước tiểu.'};
  if(crcl>=30)return {key:'moderate',label:'Giảm chức năng thận mức độ trung bình',short:'Giảm trung bình',warning:'Nhiều kháng sinh cần giảm liều hoặc kéo dài khoảng cách dùng. Hạn chế phối hợp thuốc độc thận và theo dõi sát.'};
  if(crcl>=15)return {key:'severe',label:'Giảm chức năng thận mức độ nặng',short:'Giảm nặng',warning:'Nguy cơ tích lũy và độc tính cao. Bắt buộc kiểm tra liều từng thuốc; cân nhắc hội chẩn Dược lâm sàng/Thận học.'};
  return {key:'critical',label:'Giảm chức năng thận rất nặng',short:'Rất nặng',warning:'Nguy cơ tích lũy thuốc rất cao. Đánh giá chỉ định lọc máu, tình trạng cấp hay mạn và hội chẩn chuyên khoa trước khi chốt liều.'};
}
function renalAlertHtml(crcl){
  const r=renalRiskByCrCl(crcl);
  return `<div class="renal-alert renal-${r.key}"><div class="renal-alert-icon" aria-hidden="true">${r.key==='preserved'?'✓':r.key==='mild'?'!':r.key==='moderate'?'!!':'⚠'}</div><div><span>Đánh giá chức năng thận theo CrCl</span><strong>${esc(r.label)}</strong><p>${esc(r.warning)}</p><small>Mức cảnh báo màu phản ánh mức giảm độ thanh thải creatinin ước tính và được dùng để hỗ trợ lựa chọn, hiệu chỉnh liều thuốc. CrCl không dùng để chẩn đoán hoặc phân giai đoạn bệnh thận mạn. Chẩn đoán bệnh thận mạn cần có bất thường chức năng hoặc cấu trúc thận kéo dài ít nhất 3 tháng, kết hợp eGFR và đánh giá tổn thương thận, đặc biệt albumin niệu.</small></div></div>`;
}

function ddiCards(d){
  const found=drugInteractionMatches(d);
  if(found.length)return found.map(x=>`<div class="clinical-item"><b>${esc(x.name)}</b><p><strong>Mức độ:</strong> ${esc(x.level)}</p><p><strong>Hậu quả:</strong> ${esc(x.consequence)}</p><p><strong>Cơ chế:</strong> ${esc(x.mechanism)}</p><p><strong>Xử trí:</strong> ${esc(x.management)}</p><small>Nguồn: ${esc(x.source)}</small></div>`).join('');
  return `<div class="clinical-item"><b>Các tương tác cần rà soát</b>${detailList(d.clinicalDDI||[])}<small>Chưa có cặp chống chỉ định tương ứng trong danh mục 5948 được nhập; không đồng nghĩa phối hợp an toàn.</small></div>`;
}
function renderProfile(){const x=D.find(v=>v.id===selected)||filtered()[0];if(!x){$('#profile').innerHTML='<div class="alert">Chưa có dữ liệu.</div>';return}selected=x.id;const indications=x.indicationsDetailed||x.indications||[];$('#profile').innerHTML=`<span class="kicker">STT nội trú ${x.id}</span><h2>${esc(x.brand)}</h2><p><b>Hoạt chất:</b> ${esc(x.active)}</p><div class="meta"><div class="pill"><b>Nhóm:</b> ${esc(x.group)}</div><div class="pill"><b>Hàm lượng:</b> ${esc(x.strength)}</div><div class="pill"><b>Đường dùng:</b> ${esc(x.route)}</div></div><div class="tabs">${['Tổng quan','Liều & CrCl','Pha truyền','Chống chỉ định & ADR','Tương tác','Theo dõi & TDM'].map((t,i)=>`<button class="tab ${i===0?'active':''}" data-tab="t${i}">${t}</button>`).join('')}</div>
<div class="tabpane active" id="t0"><div class="profile-grid"><div class="info-box"><h3>Cơ chế tác dụng</h3><p>${esc(x.mechanism)}</p><h3>Chỉ định</h3>${detailList(indications)}<div class="source-note"><b>Nguồn chỉ định:</b> ${esc(x.indicationSource||x.clinicalSourceNote||'Tờ HDSD của đúng chế phẩm.')}</div></div><div class="info-box"><h3>PK/PD</h3><p>${esc(x.pkpd)}</p><h3>Lưu ý sử dụng</h3><p>${esc(x.notes)}</p></div></div></div>
<div class="tabpane" id="t1"><div class="profile-grid"><div class="info-box"><h3>Liều chi tiết</h3><p>${esc(x.doseDetail||x.standard)}</p><h3>Liều tối đa</h3><p>${esc(x.maxDose)}</p><h3>Hiệu chỉnh theo CrCl</h3>${renalDoseTableHtml(x)}</div><div class="info-box"><h3>HD</h3><p>${esc(x.hd)}</p><h3>CRRT</h3><p>${esc(x.crrt)}</p><h3>Nguồn liều trực tiếp</h3>${directDoseSources(x)}</div></div></div>
<div class="tabpane" id="t2"><div class="info-box"><h3>Pha truyền</h3>${infusionSections(x)}<div class="source-note"><b>Nguồn áp dụng:</b> ${esc(x.infusionSourceNote||x.clinicalSourceNote||'Tờ HDSD của đúng chế phẩm.')}</div></div></div>
<div class="tabpane" id="t3">${window.VPMED_CONTRA_ADR_HTML?window.VPMED_CONTRA_ADR_HTML(x):''}</div>
<div class="tabpane" id="t4"><div class="profile-grid"><div class="info-box"><h3>Tương tác thuốc – thuốc</h3><div class="clinical-stack">${ddiCards(x)}</div></div><div class="info-box"><h3>Tương tác thuốc – bệnh lý</h3>${detailList(x.diseaseInteractions||[])}<button class="btn btn-primary" id="openInteractionFromDrug">Mở công cụ kiểm tra hai thuốc</button></div></div></div>
<div class="tabpane" id="t5"><div class="info-box"><h3>TDM/theo dõi</h3><p>${esc(x.tdm)}</p><p>Theo dõi chức năng thận, gan, huyết học, điện giải, ECG và độc tính đặc hiệu tùy thuốc.</p></div></div>`;$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab,.tabpane').forEach(z=>z.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active')});$('#openInteractionFromDrug')?.addEventListener('click',()=>{$('#a').value=x.brand;showView('interactions')})}
$('#q').oninput=()=>{renderDrugList();const f=filtered();if(f.length&&!f.some(x=>x.id===selected)){selected=f[0].id;renderProfile()}};$('#group').onchange=$('#q').oninput;groups();renderDrugList();renderProfile();

// Dose
$('#drug').innerHTML=D.map(x=>`<option value="${x.id}">${esc(x.brand)} — ${esc(x.active)}</option>`).join('');const KEY='vpmed_dose_history_v6';try{localStorage.removeItem('vpmed_dose_history_v5');localStorage.removeItem('vpmed_dose_history_v4');localStorage.removeItem('vpmed_dose_history_v3')}catch{}
function loadHist(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saveHist(a){localStorage.setItem(KEY,JSON.stringify(a.slice(0,100)))}
function renderHist(){const h=loadHist();$('#hist').innerHTML=h.map(x=>`<tr><td>${esc(x.time)}</td><td>${esc(x.patientCode||'—')}</td><td>${esc(x.crcl)} mL/ph</td><td>${esc(x.egfr||'—')}</td><td>${esc(x.drug)}</td><td>${esc(x.advice)}</td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center">Chưa có lịch sử</td></tr>'}
renderHist();$('#clear').onclick=()=>{if(confirm('Xóa toàn bộ lịch sử trên thiết bị này?')){saveHist([]);renderHist()}};
$('#exportHist').onclick=()=>{const h=loadHist();if(!h.length){alert('Chưa có lịch sử để xuất.');return}const rows=[['Thời gian','Mã bệnh nhân','CrCl','eGFR','Thuốc','Gợi ý'],...h.map(x=>[x.time,x.patientCode||'',x.crcl,x.egfr||'',x.drug,x.advice])];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='lich-su-tra-cuu-khang-sinh.csv';a.click();URL.revokeObjectURL(a.href)};
$('#drug').addEventListener('change',()=>{const d=D.find(x=>String(x.id)===String($('#drug').value));$('#output').className='empty-state';$('#output').innerHTML=`<div>💊</div><b>Đã chọn ${esc(d?.brand||'kháng sinh')}</b><span>Bấm “Tính CrCl và gợi ý liều” để cập nhật đúng thuốc đang chọn.</span>`});

// Bố cục kết quả tinh gọn: tóm tắt thuốc → chức năng thận → liều chính → liều/24 giờ → an toàn.
function scrollDoseResultIntoView(){
  const output=$('#output');
  if(!output?.classList.contains('result-card'))return;
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const stickyOffset=document.querySelector('.topbar')?.getBoundingClientRect().height||84;
  const top=Math.max(0,output.getBoundingClientRect().top+window.scrollY-stickyOffset-12);
  window.scrollTo({top,behavior:reduceMotion?'auto':'smooth'});
}
function administrationListHtml(d){
  const f=d.infusionStructured;
  const raw=f
    ?[f.reconstitution,f.dilution,f.administration,f.line,f.stability]
    :[...(d.infusionDetails||[]),d.infusion];
  const items=[...new Set(raw.map(x=>String(x||'').trim()).filter(Boolean))]
    .filter(x=>!norm(x).startsWith('chua co'))
    .slice(0,4);
  if(!items.length)items.push(d.route?`Đường dùng: ${d.route}`:'Đối chiếu cách dùng trong tờ HDSD của đúng chế phẩm.');
  return `<ul class="administration-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
}
$('#calc').onclick=()=>{
  const patientCode=String($('#patientCode')?.value||'').trim();
  const age=+$('#age').value,wt=+$('#wt').value,ht=+$('#ht').value,scru=+$('#scr').value;
  if(!patientCode){alert('Vui lòng nhập mã bệnh nhân trên HIS.');$('#patientCode')?.focus();return}
  if(!age||!wt||!scru){alert('Vui lòng nhập tuổi, cân nặng và creatinine.');return}
  const selectedId=String($('#drug').value),d=D.find(x=>String(x.id)===selectedId);
  if(!d){alert('Không tìm thấy dữ liệu của kháng sinh đang chọn. Vui lòng chọn lại.');return}
  const scr=scru/88.4;
  let crcl=((140-age)*wt)/(72*scr);
  if($('#sex').value==='f')crcl*=.85;
  crcl=Math.max(0,crcl);
  const egfr=Math.max(0,calcEgfr2021(age,scr,$('#sex').value));
  const bsa=calcBsaMosteller(ht,wt),egfrAbsolute=bsa?egfr*bsa/1.73:null;
  const rr=window.VPMED_GET_RENAL_DOSE?window.VPMED_GET_RENAL_DOSE(d.active,crcl):null;
  const chosen=rr?.hit?`${rr.hit.label}: ${rr.hit.text}`:(d.renal||[]).join(' ');
  const advice=$('#dialysis').checked?`HD: ${d.hd} | CRRT: ${d.crrt}`:chosen;
  const ddi=conciseDDI(d,4);
  const renalRisk=renalRiskByCrCl(crcl),egfrBand=egfrCategory(egfr);
  const dialysisNotice=$('#dialysis').checked?`<div class="dialysis-notice"><b>Đang lọc máu:</b> cần đối chiếu riêng lịch HD/CRRT và thời điểm dùng thuốc trước khi chốt liều.</div>`:'';
  $('#output').className='result-card clinical-result-flow';
  $('#output').innerHTML=`
    <section class="result-overview">
      <span class="result-eyebrow">Thuốc</span>
      <h2>${esc(d.brand)} — ${esc(d.active)}</h2>
      <p>${esc(d.strength)} · ${esc(d.route)}</p>
    </section>
    <div class="result-metric-grid">
      <section class="result-metric"><span>CrCl Cockcroft–Gault</span><div><strong>${crcl.toFixed(1)}</strong> <small>mL/phút</small></div><p>${esc(renalRisk.short)}</p></section>
      <section class="result-metric"><span>eGFR CKD-EPI 2021</span><div><strong>${egfr.toFixed(1)}</strong> <small>mL/phút/1,73 m²</small></div><p>${esc(egfrBand.stage)} · ${esc(egfrBand.label)}${egfrAbsolute?` · Quy đổi ${egfrAbsolute.toFixed(1)} mL/phút`:''}</p></section>
    </div>
    <div class="result-primary-grid">
      <section class="result-primary-card dose-primary">
        <span>Liều theo CrCl</span>
        <strong>${esc(chosen)}</strong>
        ${dialysisNotice}
        <details class="result-disclosure"><summary>Liều chi tiết và lọc máu</summary><div class="disclosure-body dose-detail-grid">
        <div><h4>Liều thường dùng</h4><p>${esc(d.doseDetail||d.standard)}</p><h4>Liều tối đa</h4><p>${esc(d.maxDose)}</p><h4>Các ngưỡng CrCl</h4>${renalDoseTableHtml(d)}</div>
        <div><h4>HD</h4><p>${esc(d.hd)}</p><h4>CRRT</h4><p>${esc(d.crrt)}</p></div>
      </div></details>
      </section>
      <section class="result-primary-card administration-primary">
        <span>Pha truyền / cách dùng</span>
        ${administrationListHtml(d)}
      </section>
    </div>
    <div id="dose24Anchor"></div>
    <details class="result-safety"><summary>Cảnh báo, ADR, theo dõi và tương tác</summary><div class="disclosure-body safety-detail-grid">
        <div><h4>Chống chỉ định/cảnh báo chính</h4><p>${esc(d.contra)}</p><h4>ADR quan trọng</h4><p>${esc(d.adr)}</p><h4>Theo dõi/TDM</h4><p>${esc(d.tdm)}</p></div>
        <div><h4>Pha truyền/cách dùng</h4>${infusionSections(d)}<h4>Tương tác thuốc – thuốc</h4>${detailList(ddi)}</div>
      </div><p class="safety-footnote">Chỉ áp dụng khi creatinin tương đối ổn định. Liều cuối cùng cần đối chiếu chỉ định, vi sinh/MIC, cân nặng, dạng bào chế và tờ HDSD đúng chế phẩm.</p></details>
    <section class="result-source-row"><span>Nguồn đối chiếu</span>${directDoseSources(d)}</section>`;
  const h=loadHist();
  h.unshift({time:new Date().toLocaleString('vi-VN'),patientCode,crcl:crcl.toFixed(1),egfr:`${egfr.toFixed(1)} (${egfrCategory(egfr).stage})`,drug:`${d.brand} — ${d.active}`,advice});
  saveHist(h);renderHist();
  setTimeout(scrollDoseResultIntoView,80);
};

// Interactions - dữ liệu Bảng 3.1 Quyết định 5948/QĐ-BYT
const aliases={};
D.forEach(x=>{
  aliases[norm(x.brand)]=x.active;
  aliases[norm(x.active)]=x.active;
});
const canonical=v=>aliases[norm(v)]||String(v||'').trim();
const interactionDrugNames=x=>[x.drug1||'',x.drug2||''];
function flexibleMatch(input,target){
  const a=norm(canonical(input)),b=norm(canonical(target));
  if(!a||!b)return false;
  return a===b||a.includes(b)||b.includes(a);
}
function matchPair(a,b,i){
  const d1=i.drug1||'',d2=i.drug2||'';
  return (flexibleMatch(a,d1)&&flexibleMatch(b,d2))||(flexibleMatch(a,d2)&&flexibleMatch(b,d1));
}
const meds=[...new Set([
  ...D.flatMap(x=>[x.brand,x.active]),
  ...I.flatMap(x=>interactionDrugNames(x))
].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
$('#meds').innerHTML=meds.map(x=>`<option value="${esc(x)}">`).join('');
$('#icount').textContent=I.length;
$('#mcount').textContent=new Set(I.flatMap(x=>interactionDrugNames(x).map(norm))).size;

function intCard(x){
  const levelClass=x.conditional?'conditional':'contra';
  return `<div class="int">
    <div class="int-title">
      <b><span class="int-stt">#${esc(x.stt||'')}</span> ${esc(x.drug1||'')} + ${esc(x.drug2||'')}</b>
      <span class="interaction-level ${levelClass}">${esc(x.level)}</span>
      <span class="hint">Xem chi tiết →</span>
    </div>
    <div class="detail">
      <p><b>Cơ chế:</b> ${esc(x.mechanism)}</p>
      <p><b>Hậu quả:</b> ${esc(x.consequence)}</p>
      <p><b>Xử trí:</b> ${esc(x.management)}</p>
      <p><b>Nguồn:</b> ${esc(x.source)}</p>
    </div>
  </div>`;
}
function attachInt(){$$('.int').forEach(e=>e.onclick=()=>e.classList.toggle('open'))}
function renderInteractions(){
  const q=norm($('#iq').value);
  const f=I.filter(x=>!q||norm([
    x.stt,x.drug1,x.drug2,x.level,x.mechanism,x.consequence,x.management,x.source
  ].join(' ')).includes(q));
  $('#ilist').innerHTML=f.map(intCard).join('')||'<div class="alert">Không có kết quả.</div>';
  attachInt();
}
$('#iq').oninput=renderInteractions;
renderInteractions();
$('#swap').onclick=()=>{const t=$('#a').value;$('#a').value=$('#b').value;$('#b').value=t};
$('#check').onclick=()=>{
  const a=$('#a').value,b=$('#b').value;
  if(!a||!b){$('#result').innerHTML='Vui lòng nhập đủ hai thuốc.';return}
  const m=I.filter(x=>matchPair(a,b,x));
  $('#result').innerHTML=m.length
    ?m.map(intCard).join('')
    :'<b>Không tìm thấy cặp này trong Bảng 3.1 của Quyết định 5948/QĐ-BYT.</b><br>Điều này không khẳng định phối hợp an toàn; cần tiếp tục kiểm tra tờ hướng dẫn sử dụng và nguồn chuyên môn hiện hành.';
  attachInt();
};

// Antibiotics by disease
const DX=window.VPMED_DISEASES||[];
let selectedDisease=DX[0]?.id;
function diseaseGroups(){
  const el=$('#diseaseGroup'); if(!el)return;
  const vals=[...new Set(DX.map(x=>x.group).filter(Boolean))].sort();
  el.innerHTML='<option value="">Tất cả nhóm</option>'+vals.map(x=>`<option>${esc(x)}</option>`).join('');
}
function diseaseFiltered(){
  const q=norm($('#diseaseQ')?.value||''),g=$('#diseaseGroup')?.value||'';
  return DX.filter(x=>(!g||x.group===g)&&(!q||norm([x.name,x.group,x.pathogens,(x.recognition||[]).join(' ')].join(' ')).includes(q)));
}
function renderDiseaseList(){
  const box=$('#diseaseList'); if(!box)return;
  const f=diseaseFiltered();
  box.innerHTML=f.map(x=>`<button class="disease-item ${x.id===selectedDisease?'active':''}" data-disease="${esc(x.id)}"><span>${esc(x.group)}</span><b>${esc(x.name)}</b><small>${esc(x.severity)}</small></button>`).join('')||'<div class="alert">Không tìm thấy bệnh lý phù hợp.</div>';
  $$('.disease-item').forEach(b=>b.onclick=()=>{selectedDisease=b.dataset.disease;renderDiseaseList();renderDiseaseProfile()});
}
function sourceCards(src){return `<div class="disease-sources">${(src||[]).map(x=>`<article><b>${esc(x[0])}</b><span>${esc(x[1])}</span><a href="${esc(x[2])}" target="_blank" rel="noopener">Mở nguồn ↗</a></article>`).join('')}</div>`}
function renderDiseaseProfile(){
  const box=$('#diseaseProfile');if(!box)return;
  const d=DX.find(x=>x.id===selectedDisease)||diseaseFiltered()[0];
  if(!d){box.innerHTML='<div class="alert">Chưa có dữ liệu.</div>';return}
  selectedDisease=d.id;
  box.innerHTML=`<div class="disease-head"><span class="kicker">${esc(d.group)}</span><h2>${esc(d.name)}</h2><div class="severity-pill">Mức độ: ${esc(d.severity)}</div></div>
  <div class="disease-grid">
    <section><h3>Nhận diện và đánh giá ban đầu</h3>${detailList(d.recognition)}</section>
    <section><h3>Xét nghiệm và bệnh phẩm</h3>${detailList(d.tests)}</section>
    <section><h3>Tác nhân thường gặp</h3><p>${esc(d.pathogens)}</p></section>
    <section class="wide"><h3>Kháng sinh kinh nghiệm ưu tiên</h3>${detailList(d.first)}<div class="renal-link"><b>Hiệu chỉnh liều:</b> sau khi chọn thuốc, mở <button data-disease-dose>Tính liều & CrCl/eGFR</button> để áp dụng đúng CrCl của bệnh nhân.</div></section>
    <section><h3>Lựa chọn thay thế / tình huống đặc biệt</h3>${detailList(d.alternatives)}</section>
    <section><h3>Thời gian điều trị tham khảo</h3><p>${esc(d.duration)}</p></section>
    <section class="wide"><h3>Đánh giá lại, xuống thang và chuyển uống</h3><p>${esc(d.deescalation)}</p></section>
    <section class="wide"><h3>Nguồn chuyên môn</h3>${sourceCards(d.sources)}</section>
  </div>
  <div class="clinical-disclaimer"><b>Kiểm tra trước khi kê đơn:</b> dị ứng, thai kỳ, chức năng gan thận, lọc máu, tương tác, nguy cơ C. difficile, bệnh phẩm/vi sinh, kiểm soát ổ nhiễm và thuốc sẵn có trong danh mục. Không dùng phác đồ này thay thế đánh giá của bác sĩ điều trị.</div>`;
  box.querySelector('[data-disease-dose]')?.addEventListener('click',()=>showView('dose'));
}
if($('#diseaseList')){
  diseaseGroups();renderDiseaseList();renderDiseaseProfile();
  $('#diseaseQ').oninput=()=>{renderDiseaseList();const f=diseaseFiltered();if(f.length&&!f.some(x=>x.id===selectedDisease)){selectedDisease=f[0].id;renderDiseaseProfile()}};
  $('#diseaseGroup').onchange=$('#diseaseQ').oninput;
}

// Nút quay lại Trang chủ cho tất cả các phần chức năng.
(function addHomeBackButtons(){
  document.querySelectorAll('.view:not(#view-home)').forEach(view=>{
    if(view.querySelector(':scope > .back-home-wrap')) return;
    const wrap=document.createElement('div');
    wrap.className='back-home-wrap';
    const button=document.createElement('button');
    button.type='button';
    button.className='back-home-btn';
    button.setAttribute('aria-label','Quay lại Trang chủ');
    button.innerHTML='<span aria-hidden="true">←</span> Quay lại Trang chủ';
    button.addEventListener('click',()=>showView('home'));
    wrap.appendChild(button);
    view.prepend(wrap);
  });
})();
