function num(id){const x=parseFloat(document.getElementById(id).value); return isFinite(x)?x:NaN;}
function val(id){return document.getElementById(id).value;}
function fmt(x,d=2){return isFinite(x)?Number(x).toLocaleString('vi-VN',{maximumFractionDigits:d,minimumFractionDigits:d}):'--';}
function mbq(mci){return mci*37;}
function mci(mbq){return mbq/37;}
function expDecay(dt,half){return Math.exp(-Math.log(2)*dt/half);}
function getDelta(){
  const manual=num('deltaManual');
  if(isFinite(manual)) return manual;
  const dd=val('drawDate'), dt=val('drawTime'), id=val('injectDate'), it=val('injectTime');
  if(dd && dt && id && it){
    const a=new Date(dd+'T'+dt), b=new Date(id+'T'+it);
    return (b-a)/60000;
  }
  return NaN;
}
function setText(id,t){document.getElementById(id).innerHTML=t;}
function alertBox(type,text){return `<div class="${type}">${text}</div>`;}
const tracerData={
  F18:{name:'F-18 FDG',half:109.8,range:'3,5–5,0 MBq/kg',mid:4.0,use:'Ung thư, tim mạch, thần kinh'},
  GA68:{name:'Ga-68 DOTATATE',half:68.3,range:'2,0–2,5 MBq/kg',mid:2.25,use:'U thần kinh nội tiết'},
  C11:{name:'C-11 Choline',half:20.4,range:'4,0–7,0 MBq/kg',mid:5.5,use:'Tái phát ung thư tuyến tiền liệt'},
  N13:{name:'N-13 Ammonia',half:10.0,range:'10,0–15,0 MBq/kg',mid:12.5,use:'Tưới máu cơ tim'},
  CUSTOM:{name:'Khác',half:109.8,range:'Tự nhập theo SOP',mid:4.0,use:'Tự nhập'}
};
function chooseTracer(key){
  const d=tracerData[key]||tracerData.F18;
  const sel=document.getElementById('tracerSelect');
  if(sel) sel.value=key;
  document.getElementById('half').value=d.half;
  const range=document.getElementById('doseRangeText');
  if(range) range.value=d.range;
  const use=document.getElementById('clinicalUseText');
  if(use) use.value=d.use;
  calc();
}
function useTracerMidDose(){
  const key=document.getElementById('tracerSelect') ? document.getElementById('tracerSelect').value : 'F18';
  const d=tracerData[key]||tracerData.F18;
  document.getElementById('k').value=d.mid;
  document.getElementById('kUnit').value='MBqKg';
  document.getElementById('half').value=d.half;
  chooseTracer(key);
  calc();
}
function useMci(value){
  document.getElementById('k').value=value.toFixed(2);
  document.getElementById('kUnit').value='mCiKg';
  calc();
}
function useFourMBq(){
  document.getElementById('k').value='4.0';
  document.getElementById('kUnit').value='MBqKg';
  calc();
}
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

function calc(){
  const W=num('weight'), k=num('k'), unit=val('kUnit'), half=num('half'), dt=getDelta();
  const minC=num('minCheck'), maxC=num('maxCheck');
  const mode=val('mode'), drawn=num('drawnMci');
  const stockA=num('stockA'), stockV=num('stockV'), concD=num('concDirect');
  const preA=num('preA'), resA=num('resA'), resDt=num('resDelta');

  let targetMci = unit==='mCiKg' ? W*k : mci(W*k);
  const decay = expDecay(dt,half);
  const drawNeed = targetMci / decay;
  const remain = drawn * decay;
  let conc = isFinite(concD) && concD>0 ? concD : stockA/stockV;
  let vol = drawNeed/conc;

  let actual=NaN, resAtPre=NaN, diff=NaN;
  if(isFinite(preA)&&isFinite(resA)&&isFinite(resDt)&&isFinite(half)){
    resAtPre = resA / expDecay(resDt,half);
    actual = preA - resAtPre;
    diff = actual - targetMci;
  }

  setText('target',`${fmt(targetMci)} mCi`);
  setText('targetMbq',`${fmt(mbq(targetMci),0)} MBq`);
  setText('dt',`${fmt(dt,0)} phút`);
  setText('decay',`Sau thời gian chờ còn ${fmt(decay*100,1)}% hoạt độ`);
  setText('drawNeed',`${fmt(drawNeed)} mCi`);
  setText('drawNeedMbq',`${fmt(mbq(drawNeed),0)} MBq`);
  setText('volNeed',`${fmt(vol)} mL`);
  setText('concShow',`Nồng độ = ${fmt(conc)} mCi/mL`);
  setText('remain',`${fmt(remain)} mCi`);
  setText('remainMbq',`${fmt(mbq(remain),0)} MBq`);
  setText('actual',`${fmt(actual)} mCi`);
  setText('actualMbq',`${fmt(mbq(actual),0)} MBq`);
  setText('diff',`${fmt(diff)} mCi`);
  setText('action', mode==='targetToDraw' ? 'Dùng lượng cần rút ban đầu' : 'So với liều mục tiêu');

  const alerts=[];
  const singleCond=document.getElementById('singleCondition')?.value;
  const singleGlu=parseFloat(document.getElementById('singleGlucose')?.value);
  const singleBp=petctParseBloodPressure(document.getElementById('singleBloodPressure')?.value);
  if(singleCond==='diabetes'){
    if(isFinite(singleGlu) && singleGlu>=11.1) alerts.push(alertBox('warn','Đái tháo đường: đường huyết ≥ 11,1 mmol/L, cần báo bác sĩ/YHHN và xử trí theo SOP trước tiêm FDG.'));
    else if(!isFinite(singleGlu)) alerts.push(alertBox('warn','Tiểu đường: cần nhập/kiểm tra đường huyết trước tiêm.'));
  }
  else if(singleCond==='hypertension') alerts.push(alertBox('warn','Bệnh tăng huyết áp: cần nhập/kiểm tra chỉ số huyết áp, thuốc đang dùng và triệu chứng kèm theo.'));
  else if(singleCond==='cardiac') alerts.push(alertBox('warn','Chỉ định tim mạch: kiểm tra protocol tim mạch riêng của đơn vị.'));
  else if(singleCond==='neuro') alerts.push(alertBox('warn','Chỉ định thần kinh/não: cần nghỉ yên, hạn chế kích thích theo SOP.'));
  if(singleBp && (singleBp.sys>=180 || singleBp.dia>=110)) alerts.push(alertBox('err','Huyết áp rất cao: cần báo bác sĩ/YHHN trước khi tiếp tục.'));
  else if(singleBp && (singleBp.sys>=140 || singleBp.dia>=90)) alerts.push(alertBox('warn','Chỉ số huyết áp tăng: ghi nhận và theo dõi theo SOP.'));
  const hasSingleInput = (isFinite(W)&&W>0) || (isFinite(k)&&k>0) || isFinite(dt) || (isFinite(conc)&&conc>0) || (isFinite(preA)&&preA>0) || (isFinite(resA)&&resA>0);
  if(hasSingleInput){
    if(!isFinite(W)||W<=0) alerts.push(alertBox('err','Cần nhập cân nặng bệnh nhân.'));
    if(!isFinite(k)||k<=0) alerts.push(alertBox('err','Cần nhập hệ số liều theo SOP của đơn vị.'));
    if(!isFinite(dt)||dt<0) alerts.push(alertBox('err','Cần nhập thời gian chờ hợp lệ. Nếu dùng ngày/giờ, kiểm tra ngày giờ tiêm phải sau ngày giờ đo/rút.'));
    if(!isFinite(half)||half<=0) alerts.push(alertBox('err','Cần nhập chu kỳ bán rã hợp lệ. Với 18F-FDG thường dùng 109,8 phút.'));
    if(isFinite(targetMci)&&isFinite(minC)&&isFinite(maxC)){
      if(targetMci<minC || targetMci>maxC) alerts.push(alertBox('warn',`Liều cần có lúc tiêm là ${fmt(targetMci)} mCi, nằm ngoài ngưỡng kiểm tra ${fmt(minC,1)}–${fmt(maxC,1)} mCi. Cần đối chiếu SOP/bác sĩ Y học hạt nhân.`));
      else alerts.push(alertBox('ok',`Liều cần có lúc tiêm là ${fmt(targetMci)} mCi, nằm trong ngưỡng kiểm tra đang đặt.`));
    }
    if(!isFinite(conc)||conc<=0) alerts.push(alertBox('warn','Chưa đủ dữ liệu tính nồng độ hoạt độ, nên chưa tính được thể tích cần rút.'));
  }
  if(isFinite(vol)&&vol<0.1) alerts.push(alertBox('warn','Thể tích cần rút nhỏ hơn 0,1 mL: nguy cơ sai số thao tác cao.'));
  if(isFinite(actual)&&actual<0) alerts.push(alertBox('err','Liều thực tiêm âm: kiểm tra lại số đo trước tiêm, số đo còn dư và thời điểm đo.'));
  if(isFinite(diff)&&isFinite(targetMci)&&Math.abs(diff/targetMci)>0.15) alerts.push(alertBox('warn',`Liều thực tiêm lệch ${fmt(diff)} mCi so với mục tiêu, vượt 15%. Cần đánh giá lại trước khi ghi nhận.`));
  setText('alerts',alerts.join(''));

  const rows=[
    ['1. Liều cần có lúc tiêm', `Cân nặng × hệ số liều = ${fmt(W,1)} × ${fmt(k,3)} ${unit==='mCiKg'?'mCi/kg':'MBq/kg'}`, `${fmt(targetMci)} mCi = ${fmt(mbq(targetMci),0)} MBq`],
    ['2. Hệ số còn lại', `e^[-0,693 × ${fmt(dt,0)} / ${fmt(half,1)}]`, `${fmt(decay*100,1)}%`],
    ['3. Lượng cần rút ban đầu', `Liều cần tiêm / hệ số còn lại = ${fmt(targetMci)} / ${fmt(decay,4)}`, `${fmt(drawNeed)} mCi`],
    ['4. Nồng độ hoạt độ', isFinite(concD)?'Dùng nồng độ nhập trực tiếp':`Tổng hoạt độ / tổng thể tích = ${fmt(stockA)} / ${fmt(stockV)}`, `${fmt(conc)} mCi/mL`],
    ['5. Thể tích cần rút', `Lượng cần rút / nồng độ = ${fmt(drawNeed)} / ${fmt(conc)}`, `${fmt(vol)} mL`],
    ['6. Nếu đã rút sẵn', `Hoạt độ đã rút × hệ số còn lại = ${fmt(drawn)} × ${fmt(decay,4)}`, `${fmt(remain)} mCi lúc tiêm`],
    ['7. Liều thực tiêm', `Hoạt độ trước tiêm - hoạt độ còn dư đã quy đổi = ${fmt(preA)} - ${fmt(resAtPre)}`, `${fmt(actual)} mCi`]
  ];
  setText('table',rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td></tr>`).join(''));
  if(isFinite(W)&&W>0&&isFinite(k)&&k>0&&isFinite(dt)&&dt>=0&&isFinite(half)&&half>0){
    window.VPMED_PLATFORM?.calculationComplete({feature:'petct-dose',mode:'single',targetMci});
  }
}


function roundUpTo(value, step){ if(!isFinite(value)||!isFinite(step)||step<=0) return NaN; return Math.ceil(value/step)*step; }
function timeToMinutes(t){ if(!t||!t.includes(':')) return NaN; const p=t.split(':').map(Number); return p[0]*60+p[1]; }
function minutesToTime(mins){ if(!isFinite(mins)) return '--'; mins=((Math.round(mins)%1440)+1440)%1440; const h=Math.floor(mins/60), m=mins%60; return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
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


function petctParseBloodPressure(v){
  const txt=String(v||'').trim();
  if(!txt) return {text:'', sys:NaN, dia:NaN};
  const m=txt.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})/);
  if(!m) return {text:txt, sys:NaN, dia:NaN};
  return {text:txt, sys:parseFloat(m[1]), dia:parseFloat(m[2])};
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

function clearPatient(){
  ['weight','k','drawDate','drawTime','injectDate','injectTime','deltaManual','drawnMci','stockA','stockV','concDirect','preA','resA','note'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('half').value='109.8';
  document.getElementById('minCheck').value='5';
  document.getElementById('maxCheck').value='20';
  document.getElementById('resDelta').value='0';
  calc();
}
document.querySelectorAll('#view-petct-dose .petct-inline input,#view-petct-dose .petct-inline select,#view-petct-dose .petct-inline textarea').forEach(x=>x.addEventListener('input',calc));
const tracerSel=document.getElementById('tracerSelect');
if(tracerSel){tracerSel.addEventListener('change',()=>chooseTracer(tracerSel.value));}
buildQuickTable();
chooseTracer('F18');
['batchOrderedActivity','batchHospitalReceive','batchFactor','batchUnit','batchUptake','batchHalf'].forEach(id=>{const el=document.getElementById(id); if(el) el.addEventListener('input',calcBatchDose);});

document.querySelectorAll('#view-petct-dose input[placeholder="HH:mm"]').forEach(el=>{
  el.addEventListener('blur',()=>{ normalizePetctTimeInput(el); if(typeof calcBatchDose==='function') calcBatchDose(); if(typeof calc==='function') calc(); });
});

calcBatchDose();
calc();

