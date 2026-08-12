(function(){
  'use strict';
  var auth=null,calc=null,bound=false;
  function number(id){var el=document.getElementById(id);var value=el?Number(el.value):NaN;return Number.isFinite(value)?value:null;}
  function renalBand(crcl){if(crcl==null)return null;if(crcl>=90)return 'CrCl ≥ 90';if(crcl>=60)return 'CrCl 60–89';if(crcl>=30)return 'CrCl 30–59';if(crcl>=15)return 'CrCl 15–29';return 'CrCl < 15';}
  function setStatus(message,tone){var el=document.getElementById('renalAuditStatus');if(!el)return;el.textContent=message;el.dataset.tone=tone||'';}
  function bind(){
    if(bound||!auth)return;calc=document.getElementById('calc');if(!calc)return;bound=true;
    calc.addEventListener('click',function(){setTimeout(logLookup,180);});
  }
  async function logLookup(){
    var output=document.getElementById('output');if(!output||!output.classList.contains('result-card'))return;
    var age=number('age'),weight=number('wt'),scrUmol=number('scr');if(!age||!weight||!scrUmol)return;
    var sex=document.getElementById('sex').value;var scr=scrUmol/88.4;var crcl=((140-age)*weight)/(72*scr);if(sex==='f')crcl*=.85;crcl=Math.max(0,crcl);
    var kappa=sex==='f'?.7:.9,alpha=sex==='f'?-.241:-.302;var egfr=142*Math.pow(Math.min(scr/kappa,1),alpha)*Math.pow(Math.max(scr/kappa,1),-1.2)*Math.pow(.9938,age)*(sex==='f'?1.012:1);egfr=Math.max(0,egfr);
    var drug=document.getElementById('drug');var drugName=drug&&drug.options[drug.selectedIndex]?drug.options[drug.selectedIndex].textContent.trim():null;
    var resultNode=output.querySelector('.dose-primary strong');var summary=resultNode?resultNode.textContent.trim().replace(/\s+/g,' ').slice(0,1500):'Đã tính chức năng thận và gợi ý liều.';
    setStatus('Đang lưu nhật ký người tra cứu…');
    var result=await auth.client.from('renal_lookup_logs').insert({lookup_type:'antibiotic_renal_dose',module_name:'Tính liều kháng sinh & CrCl/eGFR',drug_name:drugName,crcl_ml_min:Number(crcl.toFixed(1)),egfr_ml_min_1_73m2:Number(egfr.toFixed(1)),renal_band:renalBand(crcl),result_summary:summary});
    if(result.error)setStatus('Không lưu được nhật ký tài khoản.','error');else setStatus('Đã ghi nhận người thực hiện tra cứu; không lưu mã hoặc tên bệnh nhân.','success');
  }
  function ready(detail){auth=detail||window.VPMED_AUTH;bind();}
  window.addEventListener('vpmed-auth-ready',function(event){ready(event.detail);});if(window.VPMED_AUTH)ready(window.VPMED_AUTH);else document.addEventListener('DOMContentLoaded',bind);
})();
