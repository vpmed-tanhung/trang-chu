(function(){
  'use strict';

  var auth=null;
  var bound=false;
  var loading=false;
  var sharedRows=[];
  var refreshTimer=null;
  var HISTORY_LIMIT=500;

  function escapeHtml(value){
    return String(value==null?'':value).replace(/[&<>'"]/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch];
    });
  }
  function number(id){
    var el=document.getElementById(id);
    var value=el?Number(el.value):NaN;
    return Number.isFinite(value)?value:null;
  }
  function formatDate(value){
    if(!value)return '—';
    try{return new Date(value).toLocaleString('vi-VN');}catch(error){return String(value);}
  }
  function renalBand(crcl){
    if(crcl==null)return null;
    if(crcl>=90)return 'CrCl ≥ 90';
    if(crcl>=60)return 'CrCl 60–89';
    if(crcl>=30)return 'CrCl 30–59';
    if(crcl>=15)return 'CrCl 15–29';
    return 'CrCl < 15';
  }
  function setStatus(message,tone){
    var el=document.getElementById('renalAuditStatus');
    if(!el)return;
    el.textContent=message;
    el.dataset.tone=tone||'';
  }
  function isAdmin(){return !!(auth&&auth.profile&&auth.profile.role==='admin');}
  function staffName(item){return item.staff_name||item.doctor_name||'Nhân viên bệnh viện';}
  function staffEmail(item){return item.staff_email||item.doctor_email||'';}
  function colspan(){return isAdmin()?8:7;}

  function renderSharedHistory(){
    var body=document.getElementById('hist');
    if(!body)return;
    if(!sharedRows.length){
      body.innerHTML='<tr><td colspan="'+colspan()+'" style="text-align:center">Chưa có lịch sử tra cứu dùng chung.</td></tr>';
      return;
    }
    body.innerHTML=sharedRows.map(function(item){
      var manage=isAdmin()?'<td><button type="button" class="history-delete-row" data-delete-history="'+escapeHtml(item.id)+'">Xóa</button></td>':'';
      var userDetail=[item.job_title,item.department].filter(Boolean).join(' · ');
      return '<tr>'+
        '<td>'+escapeHtml(formatDate(item.created_at))+'</td>'+
        '<td><b>'+escapeHtml(item.patient_code||'—')+'</b></td>'+
        '<td class="history-user-cell"><b>'+escapeHtml(staffName(item))+'</b><small>'+escapeHtml(userDetail||staffEmail(item))+'</small></td>'+
        '<td>'+escapeHtml(item.crcl_ml_min==null?'—':item.crcl_ml_min)+' mL/ph</td>'+
        '<td>'+escapeHtml(item.egfr_ml_min_1_73m2==null?'—':item.egfr_ml_min_1_73m2)+'</td>'+
        '<td>'+escapeHtml(item.drug_name||'—')+'</td>'+
        '<td>'+escapeHtml(item.result_summary||item.renal_band||'—')+'</td>'+manage+'</tr>';
    }).join('');
    if(isAdmin()){
      body.querySelectorAll('[data-delete-history]').forEach(function(button){
        button.addEventListener('click',function(){deleteOne(button.dataset.deleteHistory,button);});
      });
    }
  }

  async function refreshSharedHistory(options){
    if(!auth||loading)return;
    loading=true;
    if(!(options&&options.silent))setStatus('Đang tải lịch sử tra cứu dùng chung…');
    var result=await auth.client.from('renal_lookup_logs').select('*').order('created_at',{ascending:false}).limit(HISTORY_LIMIT);
    loading=false;
    if(result.error){
      sharedRows=[];
      renderSharedHistory();
      setStatus('Chưa tải được lịch sử chung. Admin cần chạy file supabase/lich_su_tra_cuu_dung_chung.sql.','error');
      return;
    }
    sharedRows=result.data||[];
    renderSharedHistory();
    setStatus('Đã đồng bộ '+sharedRows.length+' lượt tra cứu gần nhất. Mọi tài khoản đã duyệt cùng xem dữ liệu này.','success');
  }

  async function logLookup(){
    var output=document.getElementById('output');
    if(!output||!output.classList.contains('result-card'))return;
    var patientCode=String((document.getElementById('patientCode')||{}).value||'').trim();
    var age=number('age'),weight=number('wt'),scrUmol=number('scr');
    if(!patientCode||!age||!weight||!scrUmol)return;
    var sex=document.getElementById('sex').value;
    var scr=scrUmol/88.4;
    var crcl=((140-age)*weight)/(72*scr);
    if(sex==='f')crcl*=.85;
    crcl=Math.max(0,crcl);
    var kappa=sex==='f'?.7:.9;
    var alpha=sex==='f'?-.241:-.302;
    var egfr=142*Math.pow(Math.min(scr/kappa,1),alpha)*Math.pow(Math.max(scr/kappa,1),-1.2)*Math.pow(.9938,age)*(sex==='f'?1.012:1);
    egfr=Math.max(0,egfr);
    var drug=document.getElementById('drug');
    var drugName=drug&&drug.options[drug.selectedIndex]?drug.options[drug.selectedIndex].textContent.trim():null;
    var resultNode=output.querySelector('.dose-primary strong');
    var summary=resultNode?resultNode.textContent.trim().replace(/\s+/g,' ').slice(0,1500):'Đã tính chức năng thận và gợi ý liều.';
    setStatus('Đang lưu lượt tra cứu vào lịch sử dùng chung…');
    var result=await auth.client.from('renal_lookup_logs').insert({
      patient_code:patientCode,
      lookup_type:'antibiotic_renal_dose',
      module_name:'Tính liều kháng sinh & CrCl/eGFR',
      drug_name:drugName,
      crcl_ml_min:Number(crcl.toFixed(1)),
      egfr_ml_min_1_73m2:Number(egfr.toFixed(1)),
      renal_band:renalBand(crcl),
      result_summary:summary
    });
    if(result.error){
      setStatus('Kết quả đã tính nhưng chưa lưu được vào lịch sử chung. Kiểm tra file SQL cập nhật.','error');
      return;
    }
    await refreshSharedHistory();
  }

  async function deleteOne(id,button){
    if(!isAdmin())return;
    if(!window.confirm('Xóa lượt tra cứu này khỏi lịch sử dùng chung?'))return;
    button.disabled=true;
    var result=await auth.client.rpc('admin_delete_renal_lookup_log',{target_log_id:Number(id)});
    button.disabled=false;
    if(result.error){setStatus('Không xóa được lịch sử. Chỉ admin mới có quyền xóa.','error');return;}
    await refreshSharedHistory();
  }

  async function clearAll(){
    if(!isAdmin())return;
    if(!window.confirm('Xóa TOÀN BỘ lịch sử tra cứu dùng chung? Hành động này không thể hoàn tác.'))return;
    var typed=window.prompt('Nhập XOA LICH SU để xác nhận:');
    if(typed!=='XOA LICH SU')return;
    var button=document.getElementById('clear');
    button.disabled=true;
    var result=await auth.client.rpc('admin_clear_renal_lookup_logs');
    button.disabled=false;
    if(result.error){setStatus('Không xóa được lịch sử. Chỉ admin mới có quyền xóa.','error');return;}
    await refreshSharedHistory();
  }

  function csvCell(value){return '"'+String(value==null?'':value).replace(/"/g,'""')+'"';}
  function exportCsv(){
    if(!isAdmin()||!sharedRows.length){window.alert('Chưa có lịch sử để xuất.');return;}
    var rows=[['Thời gian','Mã bệnh nhân','Người tra cứu','Email','Chức danh','Khoa/phòng','CrCl','eGFR','Thuốc','Gợi ý']];
    sharedRows.forEach(function(item){rows.push([formatDate(item.created_at),item.patient_code||'',staffName(item),staffEmail(item),item.job_title||'',item.department||'',item.crcl_ml_min==null?'':item.crcl_ml_min,item.egfr_ml_min_1_73m2==null?'':item.egfr_ml_min_1_73m2,item.drug_name||'',item.result_summary||item.renal_band||'']);});
    var csv='\ufeff'+rows.map(function(row){return row.map(csvCell).join(',');}).join('\n');
    var anchor=document.createElement('a');
    anchor.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    anchor.download='bao-cao-lich-su-tra-cuu-lieu-than.csv';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  function bind(){
    if(bound||!auth)return;
    var calc=document.getElementById('calc');
    var refresh=document.getElementById('refreshHist');
    var clear=document.getElementById('clear');
    var exportButton=document.getElementById('exportHist');
    var manageHeading=document.getElementById('historyManageHeading');
    if(!calc||!refresh||!clear||!exportButton)return;
    bound=true;
    calc.addEventListener('click',function(){window.setTimeout(logLookup,180);});
    refresh.addEventListener('click',function(){refreshSharedHistory();});
    clear.onclick=clearAll;
    exportButton.onclick=exportCsv;
    clear.hidden=!isAdmin();
    exportButton.hidden=!isAdmin();
    if(manageHeading)manageHeading.hidden=!isAdmin();
    refreshSharedHistory();
    refreshTimer=window.setInterval(function(){if(document.visibilityState!=='hidden')refreshSharedHistory({silent:true});},30000);
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')refreshSharedHistory({silent:true});});
  }

  function ready(detail){auth=detail||window.VPMED_AUTH;bind();}
  window.addEventListener('vpmed-auth-ready',function(event){ready(event.detail);});
  if(window.VPMED_AUTH)ready(window.VPMED_AUTH);
  window.VPMED_SHARED_RENAL_HISTORY={refresh:refreshSharedHistory,stop:function(){if(refreshTimer)window.clearInterval(refreshTimer);}};
})();
