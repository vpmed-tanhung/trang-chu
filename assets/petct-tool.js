function fmt(x,d=2){return isFinite(x)?Number(x).toLocaleString('vi-VN',{maximumFractionDigits:d,minimumFractionDigits:d}):'--';}
function setText(id,t){document.getElementById(id).innerHTML=t;}
function alertBox(type,text){return `<div class="${type}">${text}</div>`;}

function buildQuickTable(){
  const weights=[40,45,50,55,60,65,70,75,80,85,90];

  const rowsMBq=weights.map(w=>{
    const doseMBq=w*4.0;
    const doseMci=doseMBq/37;
    const volume=doseMBq/200;
    return `<tr>
      <td><b>${w} kg</b></td>
      <td>${Math.round(doseMBq)} MBq</td>
      <td>${doseMci.toFixed(1)} mCi</td>
      <td>${volume.toFixed(2)} mL</td>
    </tr>`;
  }).join('');
  const tbMBq=document.getElementById('quickTableMBq');
  if(tbMBq) tbMBq.innerHTML=rowsMBq;

  const rowsMci=weights.map(w=>{
    const d010=w*0.10;
    const d012=w*0.12;
    const d014=w*0.14;
    const d015=w*0.15;
    const mbq015=d015*37;
    return `<tr>
      <td><b>${w} kg</b></td>
      <td>${d010.toFixed(1)} mCi</td>
      <td>${d012.toFixed(1)} mCi</td>
      <td>${d014.toFixed(1)} mCi</td>
      <td>${d015.toFixed(1)} mCi</td>
      <td>${Math.round(mbq015)} MBq</td>
    </tr>`;
  }).join('');
  const tbMci=document.getElementById('quickTableMci');
  if(tbMci) tbMci.innerHTML=rowsMci;
}

function addBatchRows(n=5){
  const body=document.getElementById('batchTableBody'); if(!body) return;
  const maxPatients=window.PetctBatchCalculator?.MAX_PATIENTS||12;
  const available=Math.max(0,maxPatients-body.children.length);
  const requested=Math.max(0,Math.floor(Number(n)||0));
  const rowsToAdd=Math.min(requested,available);
  if(rowsToAdd===0){
    setText('batchAlerts',alertBox('warn',`Danh sách đã đủ ${maxPatients} ca, không thể thêm tiếp.`));
    return;
  }
  const start=body.children.length+1;
  let out='';
  for(let i=0;i<rowsToAdd;i++){
    const idx=start+i;
    out+=`<tr class="batch-row">
      <td class="batchAllocated">--</td>
      <td><input class="batchWeight" type="number" step="0.1" min="0" placeholder="0,0"></td>
      <td class="batchDiabetesCell"><label class="batch-check"><input class="batchDiabetes" type="checkbox" aria-label="Bệnh nhân tiểu đường, cộng 1 mCi"><span>Có</span></label></td>
      <td><input class="batchGlucose" type="number" step="0.1" min="0" placeholder="0,0" aria-label="Đường huyết mmol/L"></td>
      <td class="batchTarget">--</td>
      <td><input class="batchInjTime" type="text" inputmode="numeric" placeholder="HH:mm"></td>
      <td class="batchScan">--</td>
      <td class="batchStockBefore">--</td>
      <td class="batchStockAfter">--</td>
      <td><button type="button" class="batchRemove" onclick="removeBatchRow(this)" aria-label="Xóa ca ${idx}">×</button></td>
    </tr>`;
  }
  body.insertAdjacentHTML('beforeend',out);
  Array.from(body.children).slice(start-1).forEach(tr=>{
    tr.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',calcBatchDose));
    const timeInput=tr.querySelector('.batchInjTime');
    if(timeInput) timeInput.addEventListener('blur',()=>{normalizePetctTimeInput(timeInput); calcBatchDose();});
  });
  calcBatchDose();
  if(requested>available) setText('batchAlerts',alertBox('warn',`Chỉ thêm đến giới hạn ${maxPatients} ca.`));
}
function removeBatchRow(button){
  const row=button?.closest('tr.batch-row');
  if(row) row.remove();
  calcBatchDose();
}
function clearBatchRows(){
  const body=document.getElementById('batchTableBody'); if(!body) return;
  body.innerHTML='';
  calcBatchDose();
}

function normalizePetctTimeInput(el){
  if(!el) return;
  let v=String(el.value||'').trim();
  if(!v) return;
  v=v.replace(/[^\d:]/g,'');
  if(/^\d{3,4}$/.test(v)){
    v=v.padStart(4,'0');
    v=v.slice(0,2)+':'+v.slice(2);
  }
  const m=v.match(/^(\d{1,2}):(\d{1,2})$/);
  if(m){
    let h=Math.min(23,Math.max(0,parseInt(m[1],10)));
    let mn=Math.min(59,Math.max(0,parseInt(m[2],10)));
    el.value=String(h).padStart(2,'0')+':'+String(mn).padStart(2,'0');
  }
}

function calcBatchDose(){
  const body=document.getElementById('batchTableBody'); if(!body) return;
  const calculator=window.PetctBatchCalculator;
  const status=document.getElementById('batchSufficiency');
  const rows=Array.from(body.querySelectorAll('tr.batch-row'));
  const globalFactor=parseFloat(document.getElementById('batchFactor')?.value);
  const unit=document.getElementById('batchUnit')?.value||'mCiKg';
  const orderedActivity=parseFloat(document.getElementById('batchOrderedActivity')?.value);
  const hospitalMin=calculator?.parseTime(document.getElementById('batchHospitalReceive')?.value||'');
  const uptake=parseFloat(document.getElementById('batchUptake')?.value);
  const half=parseFloat(document.getElementById('batchHalf')?.value);
  const data=[];
  const alerts=[];
  let previousScanMinute=NaN;

  const updateStatus=(state,title,detail='')=>{
    if(!status) return;
    status.className=`batch-status${state?` is-${state}`:''}`;
    status.innerHTML=`<b>${title}</b>${detail?`<span>${detail}</span>`:''}`;
  };

  if(!calculator){
    updateStatus('error','Không thể khởi tạo công cụ','Vui lòng tải lại trang.');
    setText('batchAlerts',alertBox('err','Không tải được bộ tính kế hoạch PET/CT. Vui lòng tải lại trang.'));
    return;
  }

  setText('batchReceiveTimeDisplay',isFinite(hospitalMin)?calculator.formatTime(hospitalMin):'--');
  setText('batchReceiveActivityStart','--');
  setText('batchReceiveActivityRemain','--');

  rows.forEach((tr,idx)=>{
    const w=parseFloat(tr.querySelector('.batchWeight')?.value);
    const diabetes=Boolean(tr.querySelector('.batchDiabetes')?.checked);
    const injectionMinute=calculator.parseTime(tr.querySelector('.batchInjTime')?.value||'');
    const earliestScan=isFinite(injectionMinute)&&isFinite(uptake)?injectionMinute+uptake:NaN;
    const scan=isFinite(earliestScan)&&isFinite(previousScanMinute)?Math.max(earliestScan,previousScanMinute+15):earliestScan;
    if(isFinite(scan)) previousScanMinute=scan;

    ['batchAllocated','batchScan','batchTarget','batchStockBefore','batchStockAfter'].forEach(cls=>{
      const el=tr.querySelector('.'+cls); if(el) el.textContent='--';
    });
    tr.querySelector('.batchAllocated')?.classList.remove('is-negative');
    tr.querySelector('.batchStockBefore')?.classList.remove('is-negative');
    tr.querySelector('.batchStockAfter')?.classList.remove('is-negative');
    tr.querySelector('.batchScan').textContent=calculator.formatTime(scan);

    if(isFinite(w)&&w>0&&isFinite(globalFactor)&&globalFactor>0){
      const doseAtInjection=calculator.calculateTargetDose({weight:w,factor:globalFactor,unit,diabetes});
      data.push({tr,idx,w,doseAtInjection,injectionMinute,diabetes});
      tr.querySelector('.batchTarget').innerHTML=diabetes
        ? `${fmt(doseAtInjection,2)}<span class="batch-dose-adjustment">Đã cộng 1 mCi</span>`
        : fmt(doseAtInjection,2);
    }
  });

  const totalTarget=data.reduce((sum,d)=>sum+d.doseAtInjection,0);
  setText('batchCount',String(data.length));
  setText('batchTotalTarget',data.length?fmt(totalTarget,2):'--');
  setText('batchAverageSurplus','--');
  setText('batchAllocatedTotal','--');

  if(data.length&&isFinite(orderedActivity)&&orderedActivity>0){
    const allocationPreview=calculator.excelStyleAllocation(data.map(d=>d.doseAtInjection),orderedActivity,0.1);
    setText('batchAverageSurplus',fmt(allocationPreview.averageSurplus,2));
    setText('batchAllocatedTotal',fmt(allocationPreview.allocations.reduce((sum,value)=>sum+value,0),2));
    allocationPreview.allocations.forEach((value,index)=>{
      const cell=data[index].tr.querySelector('.batchAllocated');
      if(cell){
        cell.textContent=fmt(value,2);
        cell.classList.toggle('is-negative',value<0);
      }
    });
  }

  if(data.length===0){
    const hasWeight=rows.some(tr=>parseFloat(tr.querySelector('.batchWeight')?.value)>0);
    if(hasWeight&&(!isFinite(globalFactor)||globalFactor<=0)){
      updateStatus('error','Thiếu hệ số liều','Nhập hệ số liều mặc định lớn hơn 0.');
      setText('batchAlerts',alertBox('err','Hệ số liều mặc định phải lớn hơn 0.'));
    }else{
      updateStatus('','Chưa đủ dữ liệu','Nhập cân nặng và giờ tiêm để lập kế hoạch.');
      setText('batchAlerts','');
    }
    return;
  }

  let plan=null;
  const missingTime=data.find(d=>!isFinite(d.injectionMinute));
  if(!isFinite(orderedActivity)||orderedActivity<=0){
    alerts.push(alertBox('err','Nhập tổng hoạt độ tại thời điểm nhận ở bệnh viện.'));
  }else if(!isFinite(hospitalMin)){
    alerts.push(alertBox('err','Nhập giờ nhận tại viện theo định dạng HH:mm.'));
  }else if(!isFinite(half)||half<=0){
    alerts.push(alertBox('err','Chu kỳ bán rã phải lớn hơn 0.'));
  }else if(missingTime){
    alerts.push(alertBox('err',`Nhập giờ tiêm cho ca ${missingTime.idx+1}.`));
  }else{
    try{
      plan=calculator.computePlan({
        orderedActivity,
        hospitalReceiveMinute:hospitalMin,
        halfLife:half,
        roundingStep:0.1,
        patients:data.map(d=>({targetDose:d.doseAtInjection,injectionMinute:d.injectionMinute}))
      });
    }catch(error){
      const code=String(error?.message||'');
      const position=parseInt(code.split(':')[1],10);
      if(code.startsWith('INJECTION_BEFORE_RECEIPT')) alerts.push(alertBox('err',`Giờ tiêm ca ${position+1} sớm hơn giờ nhận tại viện.`));
      else if(code.startsWith('NON_CHRONOLOGICAL')) alerts.push(alertBox('err',`Giờ tiêm ca ${position+1} phải sau hoặc bằng ca trước.`));
      else alerts.push(alertBox('err','Không thể tính kế hoạch. Vui lòng kiểm tra các dữ liệu đã nhập.'));
    }
  }

  if(plan){
    plan.rows.forEach((result,index)=>{
      const d=data[index];
      const allocated=d.tr.querySelector('.batchAllocated');
      if(allocated){
        allocated.textContent=fmt(result.allocatedAtHospital,2);
        allocated.classList.toggle('is-negative',result.allocatedAtHospital<0);
      }
      const before=d.tr.querySelector('.batchStockBefore');
      const after=d.tr.querySelector('.batchStockAfter');
      if(before){
        before.textContent=fmt(result.requiredBeforeInjection,2);
        before.classList.toggle('is-negative',result.requiredBeforeInjection<0);
      }
      if(after){
        after.textContent=fmt(result.requiredAfterInjection,2);
        after.classList.toggle('is-negative',result.requiredAfterInjection<0);
      }
    });

    setText('batchAverageSurplus',fmt(plan.averageSurplus,2));
    setText('batchAllocatedTotal',fmt(plan.allocationsSum,2));
    setText('batchReceiveActivityStart',fmt(plan.totalMinimumAtHospital,2));
    setText('batchReceiveActivityRemain',fmt(plan.totalMinimumAtHospital,2));
    if(plan.totalSufficient){
      updateStatus('ok','Đủ hoạt độ',`Dư ${fmt(plan.marginAtHospital,2)} mCi tại thời điểm nhận.`);
    }else{
      updateStatus('error','Thiếu hoạt độ',`Cần bổ sung tối thiểu ${fmt(Math.abs(plan.marginAtHospital),2)} mCi tại thời điểm nhận.`);
    }
    window.VPMED_PLATFORM?.calculationComplete({feature:'petct-dose',mode:'batch',patients:data.length,totalTarget});
  }else{
    updateStatus('','Chưa thể tính','Hoàn tất các trường bắt buộc để kiểm tra nguồn thuốc.');
  }
  setText('batchAlerts',alerts.join(''));
}

buildQuickTable();
['batchOrderedActivity','batchHospitalReceive','batchFactor','batchUnit','batchUptake','batchHalf'].forEach(id=>{
  document.getElementById(id)?.addEventListener('input',calcBatchDose);
});

document.getElementById('batchHospitalReceive')?.addEventListener('blur',event=>{
  normalizePetctTimeInput(event.currentTarget);
  calcBatchDose();
});

calcBatchDose();
