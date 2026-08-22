(function(){
  'use strict';

  const UCSF_NON='https://idmp.ucsf.edu/adult-antimicrobial-dosing-non-dialysis';
  const UCSF_HD='https://idmp.ucsf.edu/antimicrobial-dosing-intermittent-continuous-hemodialysis';
  const STANFORD='https://med.stanford.edu/content/dam/sm/bugsanddrugs/documents/antimicrobial-dosing-protocols/SHC-ABX-Dosing-Guide.pdf';

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\*/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function key(active){
    const a=norm(active).replace(/hydrochloride|hydrochlorid/g,'').trim();
    if(a.includes('amoxicillin')||a.includes('amoxicilin'))return 'amoxclav';
    if(a.includes('sulfamethoxazol')&&a.includes('trimethoprim'))return 'tmpsmx';
    if(a.includes('levofloxacin'))return 'levofloxacin';
    if(a.includes('cefpodox'))return 'cefpodoxime';
    if(a.includes('cefix'))return 'cefixime';
    if(a.includes('cefoper'))return 'cefoperazone';
    if(a.includes('cefoxitin'))return 'cefoxitin';
    if(a.includes('ceftazid'))return 'ceftazidime';
    if(a.includes('imipenem'))return 'imipenem';
    if(a.includes('ciprofloxacin'))return 'ciprofloxacin';
    if(a.includes('colistin'))return 'colistin';
    if(a.includes('fosfomycin'))return 'fosfomycin';
    if(a.includes('gentamicin'))return 'gentamicin';
    if(a.includes('amikacin'))return 'amikacin';
    if(a.includes('ceftriax'))return 'ceftriaxone';
    if(a.includes('meropenem'))return 'meropenem';
    if(a.includes('metronidazol'))return 'metronidazole';
    if(a.includes('moxifloxacin'))return 'moxifloxacin';
    if((a.includes('ampicilin')||a.includes('ampicillin'))&&a.includes('sulbactam'))return 'ampicillin-sulbactam';
    if(a.includes('piperacilin')||a.includes('piperacillin'))return 'piperacillin-tazobactam';
    if(a.includes('cefotax'))return 'cefotaxime';
    if(a.includes('vancomycin'))return 'vancomycin';
    if(a.includes('itraconazol'))return 'itraconazole';
    if(a.includes('cefazolin'))return 'cefazolin';
    if(a.includes('ofloxacin'))return 'ofloxacin-ophthalmic';
    if(a.includes('spiramycin'))return 'spiramycin-metronidazole';
    if(a.includes('benzathin'))return 'benzathine-penicillin';
    return a;
  }

  /* Chỉ đánh dấu nguồn khi đã xác định có mục tương ứng cho đúng hoạt chất/dạng dùng.
     Với các thuốc không có mục rõ trong 3 nguồn người dùng cung cấp, giao diện giữ
     nguồn HDSD/FDA/DailyMed đang có và không gắn nhãn UCSF/Stanford một cách suy diễn. */
  const coverage={
    'amoxclav':{ucsfNon:true,ucsfHd:true,stanford:1,search:'Amoxicillin/clavulanate'},
    'tmpsmx':{ucsfNon:true,ucsfHd:true,stanford:7,search:'TMP/SMX (trimethoprim/sulfamethoxazole)'},
    'levofloxacin':{ucsfNon:true,ucsfHd:true,stanford:6,search:'Levofloxacin'},
    'cefpodoxime':{ucsfNon:true,ucsfHd:false,stanford:3,search:'Cefpodoxime'},
    'cefoxitin':{ucsfNon:true,ucsfHd:true,stanford:null,search:'Cefoxitin'},
    'ceftazidime':{ucsfNon:true,ucsfHd:true,stanford:3,search:'Ceftazidime'},
    'imipenem':{ucsfNon:true,ucsfHd:true,stanford:5,search:'Imipenem/cilastatin'},
    'ciprofloxacin':{ucsfNon:true,ucsfHd:true,stanford:3,search:'Ciprofloxacin'},
    'colistin':{ucsfNon:true,ucsfHd:true,stanford:null,search:'Colistin IV'},
    'gentamicin':{ucsfNon:true,ucsfHd:true,stanford:5,search:'Gentamicin'},
    'amikacin':{ucsfNon:true,ucsfHd:true,stanford:1,search:'Amikacin'},
    'ceftriaxone':{ucsfNon:true,ucsfHd:true,stanford:3,search:'Ceftriaxone'},
    'meropenem':{ucsfNon:true,ucsfHd:true,stanford:6,search:'Meropenem'},
    'metronidazole':{ucsfNon:true,ucsfHd:true,stanford:6,search:'Metronidazole'},
    'moxifloxacin':{ucsfNon:true,ucsfHd:true,stanford:6,search:'Moxifloxacin'},
    'ampicillin-sulbactam':{ucsfNon:true,ucsfHd:true,stanford:2,search:'Ampicillin/sulbactam'},
    'piperacillin-tazobactam':{ucsfNon:true,ucsfHd:true,stanford:7,search:'Piperacillin/tazobactam'},
    'vancomycin':{ucsfNon:true,ucsfHd:true,stanford:8,search:'Vancomycin IV'},
    'cefazolin':{ucsfNon:true,ucsfHd:true,stanford:2,search:'Cefazolin'}
  };

  function selectedDrug(){
    const id=String(document.getElementById('drug')?.value||'');
    return (window.VPMED_DRUGS||[]).find(d=>String(d.id)===id)||null;
  }
  function crcl(){
    const age=+document.getElementById('age')?.value, wt=+document.getElementById('wt')?.value, scru=+document.getElementById('scr')?.value;
    if(!age||!wt||!scru)return null;
    let value=((140-age)*wt)/(72*(scru/88.4));
    if(document.getElementById('sex')?.value==='f')value*=0.85;
    return Math.max(0,value);
  }
  function parseRenalBands(d){
    return (d?.renal||[]).map(item=>{
      const m=String(item).match(/^(CrCl\s+[^:]+):\s*(.+)$/i);
      return m?{label:m[1],text:m[2]}:{label:'Ghi chú',text:String(item)};
    });
  }
  function renalResult(d,value){
    try{return typeof window.VPMED_GET_RENAL_DOSE==='function'?window.VPMED_GET_RENAL_DOSE(d.active,value,d.route||''):null}catch{return null}
  }
  function bandSourceHtml(d){
    const c=coverage[key(d.active)]||{};
    const links=[];
    if(c.ucsfNon)links.push(`<a href="${UCSF_NON}" target="_blank" rel="noopener noreferrer">UCSF non-dialysis ↗</a>`);
    if(c.ucsfHd)links.push(`<a href="${UCSF_HD}" target="_blank" rel="noopener noreferrer">UCSF IHD/CRRT ↗</a>`);
    if(c.stanford)links.push(`<a href="${STANFORD}" target="_blank" rel="noopener noreferrer">Stanford ↗</a>`);
    return links.length?`<div class="renal-band-source"><span>Nguồn liều:</span>${links.join('<span class="source-dot">•</span>')}</div>`:'';
  }
  function bandPanelHtml(d,value){
    const rr=renalResult(d,value);
    const bands=(rr?.rules||[]).length?rr.rules.map(x=>({label:x.label,text:x.text})):parseRenalBands(d);
    if(!bands.length)return '';
    const hitLabel=String(rr?.hit?.label||'');
    return `<section class="renal-band-panel"><div class="renal-band-panel-head"><b>ĐIỀU CHỈNH THEO CrCl</b><small>Hiện tại: ${Number(value).toFixed(1)} mL/phút</small></div><div class="renal-band-table" role="table" aria-label="Bảng điều chỉnh liều theo CrCl"><div class="renal-band-row renal-band-table-head" role="row"><span role="columnheader">CrCl</span><strong role="columnheader">Liều khuyến nghị</strong></div>${bands.map(b=>`<div class="renal-band-row ${hitLabel&&b.label===hitLabel?'is-current':''}" role="row"><span role="cell">${esc(b.label)}</span><strong role="cell">${esc(b.text)}</strong>${hitLabel&&b.label===hitLabel?'<em>Mức hiện tại</em>':''}</div>`).join('')}</div>${bandSourceHtml(d)}</section>`;
  }
  function basisHtml(d){
    const rr=renalResult(d,crcl());
    const base=d.renalVerified||rr?.verified||'Đối chiếu theo cơ sở dữ liệu chỉnh liều thận của VPMED và nguồn trực tiếp của thuốc.';
    return `<div class="renal-current-basis"><span class="basis-pill">Căn cứ hiệu chỉnh</span><span>${esc(base)}</span></div>`;
  }

  function enhance(){
    const out=document.getElementById('output');
    if(!out||!out.classList.contains('result-card'))return;
    const d=selectedDrug(),value=crcl();
    if(!d||value===null)return;
    const signature=`${d.id}|${value.toFixed(2)}|${document.getElementById('dialysis')?.checked?'1':'0'}`;
    if(out.dataset.renalPresentationSignature===signature&&out.querySelector('.renal-band-panel')&&!out.querySelector('.result-source-row'))return;
    out.dataset.renalPresentationSignature=signature;

    out.querySelector('.renal-current-basis')?.remove();
    out.querySelector('.renal-band-panel')?.remove();
    const anchor=out.querySelector('.renal-presentation-anchor');
    if(anchor)anchor.innerHTML=basisHtml(d)+bandPanelHtml(d,value);

    /* Nguồn UCSF/Stanford đã hiển thị ngay dưới bảng CrCl. Bỏ hẳn bảng nguồn lặp lại ở cuối kết quả. */
    const row=out.querySelector('.result-source-row');
    if(row)row.remove();

  }

  function init(){
    const out=document.getElementById('output');
    if(!out)return;
    let queued=false;
    const schedule=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;enhance();},40)};
    new MutationObserver(schedule).observe(out,{childList:true,subtree:true});
    document.getElementById('calc')?.addEventListener('click',()=>setTimeout(enhance,120));
    document.getElementById('drug')?.addEventListener('change',()=>setTimeout(enhance,80));
    document.getElementById('dialysis')?.addEventListener('change',()=>setTimeout(enhance,80));
  }

  window.VPMED_RENAL_PRESENTATION={enhance,coverage};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
