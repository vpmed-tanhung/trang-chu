(function(){
  'use strict';

  const ASHP_URL='https://www.ashp.org/-/media/assets/policy-guidelines/docs/therapeutic-guidelines/therapeutic-guidelines-monitoring-vancomycin-ASHP-IDSA-PIDS.pdf';
  const LABEL_URL='https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/213895s000lbl.pdf';
  const RCH_URL='https://www.rch.org.au/clinicalguide/guideline_index/vancomycin/';
  const NIDDK_URL='https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/children-adolescents-young-adults';
  const HISTORY_KEY='vpmed_dose_history_v6';

  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const num=v=>Number.isFinite(+v)?+v:null;
  const fmt=(v,d=0)=>Number.isFinite(+v)?new Intl.NumberFormat('vi-VN',{minimumFractionDigits:d,maximumFractionDigits:d}).format(+v):'—';
  const isVanco=d=>/vancomycin/.test(norm(d?.active));
  const round250=v=>Math.max(250,Math.round(v/250)*250);
  const round5=v=>Math.ceil(v/5)*5;

  function selectedDrug(){
    const id=String($('#drug')?.value||'');
    return (window.VPMED_DRUGS||[]).find(d=>String(d.id)===id)||null;
  }

  function crclValue(){
    const age=num($('#age')?.value),wt=num($('#wt')?.value),scrUmol=num($('#scr')?.value);
    if(!age||!wt||!scrUmol)return null;
    let crcl=((140-age)*wt)/(72*(scrUmol/88.4));
    if($('#sex')?.value==='f')crcl*=0.85;
    return Math.max(0,crcl);
  }

  function doseObject(rawMg,label,mgkg,increment=250){
    const practical=Math.max(increment,Math.round(rawMg/increment)*increment);
    return {label,rawMg,practicalMg:practical,mgkg,increment};
  }

  function pediatricEgfr(heightCm,scrUmol,ageYears){
    if(!heightCm||!scrUmol||ageYears<1||ageYears>16)return null;
    return 36.5*heightCm/scrUmol;
  }

  function infusionPlan(doseMg,drug){
    if(!Number.isFinite(doseMg)||doseMg<=0)return null;
    const vialMg=/1000/.test(String(drug?.strength||''))?1000:500;
    const vialWater=vialMg===1000?20:10;
    const openedVials=Math.ceil(doseMg/vialMg);
    const stockMl=doseMg/50;
    const finalMl=doseMg/5;
    const diluentMl=Math.max(0,finalMl-stockMl);
    const durationMin=round5(Math.max(60,doseMg/10));
    const rateMlh=finalMl/(durationMin/60);
    const drops20=rateMlh*20/60;
    return {doseMg,vialMg,vialWater,openedVials,stockMl,finalMl,diluentMl,durationMin,rateMlh,drops20};
  }

  function nonRrtRegimen(crcl){
    if(crcl>=50)return {label:'CrCl ≥50 mL/phút',hours:12,doseMg:1000,text:'1 g mỗi 12 giờ'};
    if(crcl>=30)return {label:'CrCl 30–49 mL/phút',hours:24,doseMg:1000,text:'1 g mỗi 24 giờ hoặc 15–20 mg/kg mỗi 24 giờ',weightBasedAlternative:true};
    if(crcl>=15)return {label:'CrCl 15–29 mL/phút',hours:48,doseMg:1000,text:'1 g mỗi 48 giờ'};
    return {label:'CrCl <15 mL/phút (chưa lọc máu)',hours:72,doseMg:1000,text:'1 g mỗi 72 giờ hoặc hiệu chỉnh theo TDM',tdmRequired:true};
  }

  function patientInputs(){
    return {
      weight:num($('#wt')?.value),
      crcl:crclValue(),
      age:num($('#age')?.value),
      height:num($('#ht')?.value),
      scrUmol:num($('#scr')?.value),
      patientGroup:$('#vancoPatientGroup')?.value||'adult',
      pediatricRenal:$('#vancoPediatricRenal')?.value||'impaired-stable',
      pma:num($('#vancoPma')?.value),
      pediatricAdministration:$('#vancoPediatricAdministration')?.value||'intermittent',
      stability:$('#vancoRenalStability')?.value||'stable',
      context:$('#vancoClinicalContext')?.value||'serious',
      rrt:$('#vancoRrt')?.value||'none',
      effluent:num($('#vancoEffluent')?.value),
      currentDaily:num($('#vancoCurrentDaily')?.value),
      measuredAuc:num($('#vancoMeasuredAuc')?.value),
      targetAuc:num($('#vancoTargetAuc')?.value)
    };
  }

  function calculatePediatricPlan(input,drug){
    const wt=input.weight;
    if(!wt)return null;
    const child=input.patientGroup==='child';
    const egfr=pediatricEgfr(input.height,input.scrUmol,input.age||0);
    const plan={
      mode:'pediatric',pediatric:true,ageGroup:child?'Trẻ từ 3 tháng đến <18 tuổi':'Trẻ sơ sinh/trẻ <3 tháng',
      modeLabel:child?'Nhi khoa ≥3 tháng':'Sơ sinh/<3 tháng',load:null,maintenance:null,interval:null,total24:null,range:null,
      alerts:[],notes:[],auc:null,pediatricEgfr:egfr,
      source:'ASHP/IDSA/PIDS/SIDP 2020 + hướng dẫn Royal Children’s Hospital; bắt buộc AUC/TDM.'
    };

    if(child){
      if(input.age<0.25||input.age>=18)plan.alerts.push('Tuổi nhập không khớp nhóm “trẻ từ 3 tháng đến <18 tuổi”; cần kiểm tra lại trước khi dùng kết quả.');
      plan.load=doseObject(wt*15,'Liều đầu',15,5);
      plan.load.rangeRaw=[wt*15,wt*15];
      plan.load.rangePractical=[plan.load.practicalMg,plan.load.practicalMg];
      if(plan.load.practicalMg>750)plan.notes.push('Liều mỗi lần vượt 750 mg; cần xác nhận trần liều theo phác đồ nhi khoa của bệnh viện và AUC/TDM.');

      if(input.rrt!=='none'){
        plan.modeLabel='Nhi khoa đang điều trị thay thế thận';
        plan.alerts.push('Không ngoại suy trực tiếp bảng HD/CRRT người lớn sang trẻ em. Dùng liều đầu theo cân nặng và chốt liều tiếp theo với Dược lâm sàng/Thận nhi dựa trên phương thức lọc và nồng độ.');
      }else if(input.pediatricRenal==='impaired-unstable'){
        plan.modeLabel='Nhi khoa ≥3 tháng – AKI/chức năng thận biến động';
        plan.alerts.push('Không lập lịch duy trì cố định. Sau liều đầu, định lượng nồng độ/AUC và đánh giá lại chức năng thận trước liều tiếp theo.');
      }else if(input.pediatricRenal==='normal'){
        plan.modeLabel='Nhi khoa ≥3 tháng – chức năng thận bình thường';
        plan.maintenance=doseObject(wt*15,'Liều duy trì khởi đầu',15,5);
        plan.interval={label:'Mỗi 6 giờ',hours:6};
        plan.range={raw:[wt*15,wt*20],practical:[doseObject(wt*15,'',15,5).practicalMg,doseObject(wt*20,'',20,5).practicalMg]};
        plan.total24=plan.maintenance.practicalMg*4;
        plan.notes.push('ASHP khuyến cáo ban đầu 60–80 mg/kg/ngày, chia mỗi 6–8 giờ cho trẻ ≥3 tháng có chức năng thận bình thường và nghi nhiễm MRSA nặng.');
      }else{
        plan.modeLabel='Nhi khoa ≥3 tháng – suy giảm chức năng thận ổn định';
        plan.maintenance=doseObject(wt*15,'Liều duy trì khởi đầu',15,5);
        plan.interval={label:'Mỗi 8 giờ',hours:8};
        plan.range={raw:[wt*15,wt*15],practical:[plan.maintenance.practicalMg,plan.maintenance.practicalMg]};
        plan.total24=plan.maintenance.practicalMg*3;
        plan.notes.push('Phác đồ khởi đầu 45 mg/kg/ngày = 15 mg/kg mỗi 8 giờ dựa trên phân tích PK quần thể ở trẻ suy thận; phải hiệu chỉnh theo AUC/TDM.');
        plan.alerts.push('Trong nghiên cứu nền, 87% trẻ có suy giảm chức năng thận ban đầu tăng thanh thải Vancomycin trong 5 ngày đầu; cần đánh giá lại liều hằng ngày để tránh thiếu liều khi thận hồi phục.');
      }
      if(plan.total24>3600)plan.alerts.push('Tổng liều kinh nghiệm vượt 3.600 mg/ngày; không dùng nếu chưa có phê duyệt chuyên khoa và TDM sớm.');
      else if(plan.total24>3000)plan.notes.push('Tổng liều vượt 3.000 mg/ngày; theo dõi nồng độ sớm và xác nhận với Dược lâm sàng/Nhi khoa.');
    }else{
      if(input.age>=0.25)plan.alerts.push('Tuổi nhập không khớp nhóm “trẻ sơ sinh/trẻ <3 tháng”; cần kiểm tra lại trước khi dùng kết quả.');
      const initial=doseObject(wt*15,'Liều đầu/khởi đầu',15,5);
      plan.load=initial;
      plan.load.rangeRaw=[wt*10,wt*20];
      plan.load.rangePractical=[doseObject(wt*10,'',10,5).practicalMg,doseObject(wt*20,'',20,5).practicalMg];
      if(input.pediatricAdministration==='continuous'&&input.rrt==='none'){
        let dailyMgkg=null;
        if(input.scrUmol<40)dailyMgkg=(input.pma||0)>=40?50:40;
        else if(input.scrUmol<=60)dailyMgkg=30;
        else dailyMgkg=20;
        plan.modeLabel='Sơ sinh/<3 tháng – truyền liên tục';
        plan.load=doseObject(wt*15,'Liều khởi đầu trước truyền liên tục',15,5);
        plan.maintenance=doseObject(wt*dailyMgkg,'Tổng liều truyền liên tục',dailyMgkg,5);
        plan.interval={label:'Truyền liên tục trong 24 giờ',hours:24};
        plan.total24=plan.maintenance.practicalMg;
        plan.range={raw:[wt*dailyMgkg,wt*dailyMgkg],practical:[plan.maintenance.practicalMg,plan.maintenance.practicalMg]};
        plan.notes.push(`Liều khởi đầu truyền liên tục ${dailyMgkg} mg/kg/ngày được chọn theo SCr và tuổi thai hiệu chỉnh (PMA) của hướng dẫn RCH.`);
        if(input.scrUmol>60||input.pediatricRenal!=='normal')plan.alerts.push('Trẻ <3 tháng có suy thận hoặc SCr vượt giới hạn bình thường phải được Dược lâm sàng/Thận nhi xác nhận; không dùng bảng này như liều chốt.');
      }else{
        plan.modeLabel=input.rrt==='none'?'Sơ sinh/<3 tháng – truyền ngắt quãng':'Sơ sinh/<3 tháng đang điều trị thay thế thận';
        plan.maintenance=null;
        plan.interval={label:'Khoảng 8–48 giờ tùy PMA, cân nặng, SCr và nồng độ',hours:null};
        plan.range={raw:[wt*10,wt*20],practical:[doseObject(wt*10,'',10,5).practicalMg,doseObject(wt*20,'',20,5).practicalMg]};
        plan.notes.push(`Dải liều tham chiếu theo cân nặng: ${fmt(plan.range.practical[0])}–${fmt(plan.range.practical[1])} mg/lần (10–20 mg/kg/lần); khoảng cách 8–48 giờ chưa được tự động chọn.`);
        plan.alerts.push('Không tự động chọn một khoảng cách cố định cho trẻ <3 tháng. Cần mô hình PK/Bayesian hoặc quy trình sơ sinh của bệnh viện; HD/CRRT phải có hội chẩn chuyên khoa.');
      }
    }

    plan.notes.push('AUC-guided TDM được khuyến cáo cho mọi nhóm tuổi nhi khoa; đồng thời theo dõi creatinine, lượng nước tiểu và thuốc độc thận dùng kèm.');
    plan.load.infusion=infusionPlan(plan.load.practicalMg,drug);
    if(plan.maintenance&&input.pediatricAdministration!=='continuous')plan.maintenance.infusion=infusionPlan(plan.maintenance.practicalMg,drug);
    return plan;
  }

  function calculatePlan(input,drug){
    const wt=input.weight,crcl=input.crcl;
    if(input.patientGroup!=='adult')return calculatePediatricPlan(input,drug);
    if(!wt||crcl===null)return null;

    const serious=input.context==='serious';
    const loadingMgkg=serious?25:15;
    const loadingRange=serious?[20,35]:[15,15];
    const loadRaw=Math.min(3000,wt*loadingMgkg);
    const load=doseObject(loadRaw,serious?'Liều nạp nhiễm nặng/MRSA':'Liều ban đầu theo nhãn',loadingMgkg);
    load.practicalMg=Math.min(3000,load.practicalMg);
    load.rangeRaw=[Math.min(3000,wt*loadingRange[0]),Math.min(3000,wt*loadingRange[1])];
    load.rangePractical=load.rangeRaw.map(x=>Math.min(3000,round250(x)));

    const plan={mode:input.rrt,load,maintenance:null,interval:null,total24:null,range:null,alerts:[],notes:[],auc:null,source:'ASHP/IDSA/PIDS/SIDP 2020 + nhãn Vancomycin; khoảng cách khởi đầu chỉ áp dụng khi chức năng thận ổn định.'};

    if(input.rrt==='none'){
      if(input.stability==='unstable'){
        plan.modeLabel='AKI/chức năng thận đang biến động – không lọc máu';
        plan.alerts.push('Không lập lịch duy trì cố định theo CrCl. Sau liều ban đầu, định lượng nồng độ/AUC và đánh giá lại creatinine, nước tiểu trước khi quyết định liều tiếp theo.');
      }else if(input.stability==='anuria'){
        plan.modeLabel='Vô niệu – không lọc máu';
        plan.alerts.push('Không tự động áp dụng lịch 1 g mỗi 7–10 ngày. Chỉ dùng liều tiếp theo khi có nồng độ thực đo và kế hoạch TDM được duyệt.');
      }else{
        const regimen=nonRrtRegimen(crcl);
        plan.modeLabel=`Thận ổn định – ${regimen.label}`;
        plan.interval={label:`Mỗi ${regimen.hours} giờ`,hours:regimen.hours};
        plan.maintenance=doseObject(regimen.doseMg,'Liều duy trì khởi đầu theo CSDL thận 23/07/2026',regimen.doseMg/wt);
        plan.range=regimen.weightBasedAlternative
          ?{raw:[wt*15,wt*20],practical:[round250(wt*15),round250(wt*20)]}
          :{raw:[regimen.doseMg,regimen.doseMg],practical:[regimen.doseMg,regimen.doseMg]};
        plan.total24=regimen.doseMg*24/regimen.hours;
        plan.notes.push(`${regimen.label}: ${regimen.text}. Đây là liều duy trì khởi đầu theo CSDL thận ngày 23/07/2026.`);
        plan.notes.push('Tiếp tục hiệu chỉnh theo AUC/TDM ngay khi có nồng độ; đánh giá lại sớm nếu creatinine hoặc lượng nước tiểu thay đổi.');
        if(regimen.tdmRequired)plan.alerts.push('CrCl <15 mL/phút chưa lọc máu: ưu tiên TDM để quyết định liều tiếp theo; không lặp liều máy móc khi chức năng thận biến động.');

        const auc=input.measuredAuc,target=input.targetAuc,current=input.currentDaily;
        if(auc&&current&&target){
          if(target<400||target>600){
            plan.alerts.push('AUC mục tiêu phải nằm trong 400–600 mg·giờ/L khi áp dụng cho nhiễm MRSA nặng và MIC BMD giả định 1 mg/L. Chưa dùng phép hiệu chỉnh AUC.');
          }else{
            const adjustedDaily=current*target/auc;
            const adjustedPerDose=adjustedDaily*regimen.hours/24;
            plan.auc={measured:auc,currentDaily:current,target,adjustedDaily,adjustedPerDose,practicalPerDose:round250(adjustedPerDose)};
            plan.maintenance=doseObject(adjustedPerDose,'Liều hiệu chỉnh theo AUC thực đo',adjustedPerDose/wt);
            plan.maintenance.practicalMg=plan.auc.practicalPerDose;
            plan.total24=plan.auc.practicalPerDose*24/regimen.hours;
          }
        }
      }
    }else if(input.rrt.startsWith('ihd')){
      const table={
        'ihd-after-low':{label:'IHD – dùng sau lọc, màng thấm thấp',load:[25,25],maint:[7.5,7.5]},
        'ihd-after-high':{label:'IHD – dùng sau lọc, màng thấm cao',load:[25,25],maint:[10,10]},
        'ihd-during-low':{label:'IHD – dùng trong lọc, màng thấm thấp',load:[30,30],maint:[7.5,10]},
        'ihd-during-high':{label:'IHD – dùng trong lọc, màng thấm cao',load:[35,35],maint:[10,15]}
      }[input.rrt];
      plan.modeLabel=table.label;
      const loadCoef=table.load[0];
      plan.load=doseObject(Math.min(3000,wt*loadCoef),'Liều nạp IHD',loadCoef,125);
      plan.load.practicalMg=Math.min(3000,plan.load.practicalMg);
      plan.load.rangeRaw=[plan.load.rawMg,plan.load.rawMg];
      plan.load.rangePractical=[plan.load.practicalMg,plan.load.practicalMg];
      plan.range={raw:[wt*table.maint[0],wt*table.maint[1]],practical:[doseObject(wt*table.maint[0],'',table.maint[0],125).practicalMg,doseObject(wt*table.maint[1],'',table.maint[1],125).practicalMg]};
      plan.maintenance=doseObject(wt*table.maint[0],'Liều duy trì mỗi buổi HD',table.maint[0],125);
      plan.interval={label:'Sau mỗi buổi HD; liều kỳ nghỉ 3 ngày có thể cần tăng 25%',hours:null};
      plan.notes.push('Lấy nồng độ trước HD; không lấy mẫu trong lúc lọc hoặc trong 2 giờ sau khi kết thúc vì hiện tượng tái phân bố.');
      plan.notes.push('Nồng độ trước HD 15–20 mg/L thường tương ứng AUC 400–600 của 24 giờ trước; nồng độ phải quyết định liều kế tiếp.');
    }else if(input.rrt==='crrt'){
      plan.modeLabel='CRRT (CVVH/CVVHD/CVVHDF)';
      plan.load=doseObject(wt*20,'Liều nạp CRRT',20,125);
      plan.load.rangeRaw=[wt*20,wt*25];
      plan.load.rangePractical=plan.load.rangeRaw.map(x=>doseObject(x,'',x/wt,125).practicalMg);
      plan.range={raw:[wt*7.5,wt*10],practical:[doseObject(wt*7.5,'',7.5,125).practicalMg,doseObject(wt*10,'',10,125).practicalMg]};
      plan.maintenance=doseObject(wt*7.5,'Liều duy trì khởi đầu CRRT',7.5,125);
      plan.interval={label:'Mỗi 12 giờ',hours:12};
      plan.total24=plan.maintenance.practicalMg*2;
      const eff=input.effluent||0;
      if(eff<20||eff>25)plan.alerts.push('Khuyến cáo số 7,5–10 mg/kg mỗi 12 giờ được xây dựng cho effluent 20–25 mL/kg/giờ. Tốc độ đã nhập nằm ngoài khoảng này; không chốt liều nếu chưa có TDM/chuyên gia.');
      plan.notes.push('Định lượng nồng độ trong 24 giờ đầu; giảm liều khi hết quá tải dịch và thể tích phân bố giảm.');
    }else if(input.rrt==='sled'){
      plan.modeLabel='SLED/PIRRT';
      plan.load=doseObject(wt*20,'Liều nạp SLED/PIRRT',20,125);
      plan.load.rangeRaw=[wt*20,wt*25];
      plan.load.rangePractical=plan.load.rangeRaw.map(x=>doseObject(x,'',x/wt,125).practicalMg);
      plan.maintenance=doseObject(wt*15,'Liều duy trì sau mỗi buổi SLED/PIRRT',15,125);
      plan.range={raw:[wt*15,wt*15],practical:[plan.maintenance.practicalMg,plan.maintenance.practicalMg]};
      plan.interval={label:'Ngay sau buổi lọc hoặc trong 60–90 phút cuối buổi lọc',hours:null};
      plan.notes.push('Không trì hoãn liều nạp để chờ kết thúc buổi lọc. Nồng độ thực đo quyết định các liều duy trì tiếp theo.');
    }

    plan.load.infusion=infusionPlan(plan.load.practicalMg,drug);
    if(plan.maintenance)plan.maintenance.infusion=infusionPlan(plan.maintenance.practicalMg,drug);
    return plan;
  }

  function injectStyle(){
    if($('#vanco-renal-v2-style'))return;
    const s=document.createElement('style');
    s.id='vanco-renal-v2-style';
    s.textContent=`
      .vanco-options{margin:12px 0;padding:13px;border:1px solid #8ec9db;border-radius:14px;background:#f3fbfe}.vanco-options[hidden]{display:none!important}.vanco-options h4{margin:0 0 10px;color:#075f78;font-size:15px}.vanco-options-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.vanco-options-grid label{margin:0}.vanco-options .vanco-full{grid-column:1/-1}.vanco-tdm-inputs{margin-top:10px;padding-top:10px;border-top:1px dashed #acd0dc}.vanco-tdm-inputs summary{cursor:pointer;font-weight:800;color:#165d73}.vanco-tdm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
      .vanco-plan-card{margin:10px 0 14px;padding:13px;border:1px solid #7bbbd2;background:linear-gradient(180deg,#f1fbff,#fff);border-radius:14px;box-shadow:0 6px 16px rgba(4,95,125,.07)}.vanco-plan-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px}.vanco-plan-head h3{margin:2px 0 0;color:#075f78;font-size:18px}.vanco-plan-head .vanco-mode{max-width:48%;padding:6px 9px;border-radius:999px;background:#dff4fb;color:#075f78;font-size:11px;font-weight:800;text-align:right}.vanco-dose-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.vanco-dose-metric{padding:9px 10px;border:1px solid #c8e4ed;border-radius:10px;background:#fff}.vanco-dose-metric span{display:block;color:#4b6b76;font-size:11px;font-weight:800}.vanco-dose-metric strong{display:block;margin-top:3px;color:#123f4e;font-size:16px;line-height:1.28}.vanco-dose-metric.primary{background:#e8f9ff;border-color:#69bed8}.vanco-dose-metric.primary strong{color:#005d78}.vanco-alert,.vanco-auc{margin-top:8px;padding:8px 10px;border-radius:9px;line-height:1.42;font-size:13px}.vanco-alert{background:#fff1ed;border:1px solid #f0ad99;color:#852f1c}.vanco-auc{background:#eef9ef;border:1px solid #a8d3ad;color:#205f2a}.vanco-more,.vanco-safety-details{margin-top:8px;border:1px solid #d2e5ec;border-radius:10px;background:#fff}.vanco-more>summary,.vanco-safety-details>summary{cursor:pointer;padding:9px 11px;color:#075f78;font-size:13px;font-weight:850}.vanco-more-body{padding:0 11px 10px;color:#3e5a64;font-size:13px;line-height:1.48}.vanco-more-body ul{margin:6px 0;padding-left:19px}.vanco-more-body li{margin:5px 0}.vanco-calc-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 12px;margin:5px 0 10px}.vanco-calc-detail div{padding:6px 0;border-bottom:1px dashed #dbe8ed}.vanco-calc-detail b{color:#254f5e}.vanco-source-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:8px}.vanco-source-links a{color:#075f9f;font-weight:750}.vanco-infusion{margin:7px 0;padding:9px;border:1px solid #d2e5ec;border-radius:10px;background:#f8fcfd}.vanco-infusion-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.vanco-infusion h4{margin:0;color:#075f78;font-size:14px}.vanco-infusion-head strong{color:#074d66}.vanco-infusion dl{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0}.vanco-infusion dl div{padding:7px;border-radius:8px;background:#fff;border:1px solid #dceaf0}.vanco-infusion dt{font-size:10px;font-weight:850;color:#5a7380;text-transform:uppercase}.vanco-infusion dd{margin:3px 0 0;color:#173f4d;font-size:12px;line-height:1.35}.vanco-infusion details{margin-top:6px;font-size:12px}.vanco-infusion summary{cursor:pointer;color:#075f78;font-weight:800}.vanco-infusion p{margin:6px 0 0;line-height:1.45}.vanco-kidney-warning{color:#7b351e;font-weight:800}.vanco-compact-current small{display:none}
      @media(max-width:900px){.vanco-dose-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.vanco-tdm-grid{grid-template-columns:1fr}}
      @media(max-width:650px){.vanco-options-grid,.vanco-dose-grid,.vanco-calc-detail,.vanco-source-links{grid-template-columns:1fr}.vanco-infusion dl{grid-template-columns:repeat(2,minmax(0,1fr))}.vanco-plan-head{display:block}.vanco-plan-head .vanco-mode{max-width:none;margin-top:7px;text-align:left}.vanco-options .vanco-full{grid-column:auto}}
    `;
    document.head.appendChild(s);
  }

  function injectOptions(){
    if($('#vancoPatientOptions'))return;
    const dialysis=$('#dialysis')?.closest('label');
    if(!dialysis)return;
    const box=document.createElement('section');
    box.id='vancoPatientOptions';box.className='vanco-options';box.hidden=true;
    box.innerHTML=`
      <h4>Thông tin riêng để tính Vancomycin</h4>
      <div class="vanco-options-grid">
        <label class="vanco-full">Nhóm người bệnh<select id="vancoPatientGroup"><option value="adult">Người lớn (≥18 tuổi)</option><option value="child">Trẻ từ 3 tháng đến <18 tuổi</option><option value="neonate">Trẻ sơ sinh/trẻ <3 tháng</option></select></label>
        <label id="vancoAdultRenalWrap">Tình trạng chức năng thận<select id="vancoRenalStability"><option value="stable">Ổn định (creatinine tương đối ổn định)</option><option value="unstable">AKI/creatinine đang biến động</option><option value="anuria">Vô niệu, chưa lọc máu</option></select></label>
        <label id="vancoAdultContextWrap">Bối cảnh điều trị<select id="vancoClinicalContext"><option value="serious">Nhiễm nặng/MRSA/ICU</option><option value="other">Khác – liều ban đầu theo nhãn</option></select></label>
        <label id="vancoPediatricRenalWrap" class="vanco-full" hidden>Tình trạng thận nhi khoa<select id="vancoPediatricRenal"><option value="impaired-stable">Suy giảm chức năng thận, đang ổn định</option><option value="impaired-unstable">AKI/chức năng thận đang biến động</option><option value="normal">Chức năng thận bình thường</option></select></label>
        <label id="vancoPmaWrap" hidden>Tuổi thai hiệu chỉnh PMA (tuần)<input id="vancoPma" type="number" min="20" max="60" step="1" placeholder="Ví dụ 38"></label>
        <label id="vancoPediatricAdministrationWrap" hidden>Cách dùng ở trẻ <3 tháng<select id="vancoPediatricAdministration"><option value="intermittent">Truyền ngắt quãng</option><option value="continuous">Truyền liên tục 24 giờ</option></select></label>
        <label class="vanco-full">Phương thức thay thế thận<select id="vancoRrt"><option value="none">Không lọc máu</option><option value="ihd-after-high">IHD – dùng sau lọc, màng thấm cao</option><option value="ihd-after-low">IHD – dùng sau lọc, màng thấm thấp</option><option value="ihd-during-high">IHD – dùng trong lọc, màng thấm cao</option><option value="ihd-during-low">IHD – dùng trong lọc, màng thấm thấp</option><option value="crrt">CRRT (CVVH/CVVHD/CVVHDF)</option><option value="sled">SLED/PIRRT</option></select></label>
        <label id="vancoEffluentWrap" class="vanco-full" hidden>Effluent CRRT (mL/kg/giờ)<input id="vancoEffluent" type="number" min="1" max="80" step="0.1" value="25"></label>
      </div>
      <details class="vanco-tdm-inputs"><summary>Đã có AUC: nhập để hiệu chỉnh liều duy trì chính xác hơn</summary><div class="vanco-tdm-grid"><label>Tổng liều hiện tại (mg/24 giờ)<input id="vancoCurrentDaily" type="number" min="1" step="1" placeholder="Ví dụ 2000"></label><label>AUC24 thực đo (mg·giờ/L)<input id="vancoMeasuredAuc" type="number" min="1" step="1" placeholder="Ví dụ 650"></label><label>AUC24 mục tiêu<input id="vancoTargetAuc" type="number" min="400" max="600" step="10" value="500"></label></div></details>`;
    dialysis.insertAdjacentElement('afterend',box);

    $('#vancoRrt').addEventListener('change',e=>{
      const r=e.target.value;
      $('#vancoEffluentWrap').hidden=r!=='crrt';
      if($('#dialysis'))$('#dialysis').checked=r!=='none';
    });
    $('#vancoPatientGroup').addEventListener('change',updatePatientGroupUi);
    $('#dialysis')?.addEventListener('change',e=>{
      if(!isVanco(selectedDrug()))return;
      $('#vancoRrt').value=e.target.checked?'ihd-after-high':'none';
      $('#vancoEffluentWrap').hidden=true;
    });
  }

  function updatePatientGroupUi(){
    const group=$('#vancoPatientGroup')?.value||'adult';
    const pediatric=group!=='adult',neonate=group==='neonate';
    if($('#vancoAdultRenalWrap'))$('#vancoAdultRenalWrap').hidden=pediatric;
    if($('#vancoAdultContextWrap'))$('#vancoAdultContextWrap').hidden=pediatric;
    if($('#vancoPediatricRenalWrap'))$('#vancoPediatricRenalWrap').hidden=!pediatric;
    if($('#vancoPmaWrap'))$('#vancoPmaWrap').hidden=!neonate;
    if($('#vancoPediatricAdministrationWrap'))$('#vancoPediatricAdministrationWrap').hidden=!neonate;
    const age=$('#age');
    if(age){
      age.min=pediatric?'0.01':'18';
      age.step=pediatric?'0.01':'1';
      age.placeholder=neonate?'0,08':(group==='child'?'8':'65');
    }
  }

  function toggleOptions(){
    const show=isVanco(selectedDrug());
    const box=$('#vancoPatientOptions');
    if(box)box.hidden=!show;
    if(show)updatePatientGroupUi();
    else{
      const age=$('#age');
      if(age){age.min='18';age.step='1';age.placeholder='65';}
    }
  }

  function sourceLinks(){
    return `<div class="vanco-source-links"><a href="${ASHP_URL}" target="_blank" rel="noopener">ASHP/IDSA/PIDS/SIDP 2020 – người lớn & nhi khoa ↗</a><a href="${RCH_URL}" target="_blank" rel="noopener">Royal Children’s Hospital – Vancomycin nhi khoa ↗</a><a href="${LABEL_URL}" target="_blank" rel="noopener">Nhãn Vancomycin – suy thận và truyền IV ↗</a><a href="${NIDDK_URL}" target="_blank" rel="noopener">NIDDK – eGFR nhi khoa ↗</a></div>`;
  }

  function doseRangeText(range){
    if(!range)return '—';
    const [a,b]=range.practical;
    return a===b?`${fmt(a)} mg`:`${fmt(a)}–${fmt(b)} mg`;
  }

  function infusionHtml(title,p){
    if(!p)return '';
    return `<div class="vanco-infusion"><div class="vanco-infusion-head"><h4>${esc(title)}</h4><strong>${fmt(p.doseMg)} mg</strong></div><dl><div><dt>Hoàn nguyên</dt><dd>${fmt(p.openedVials)} lọ × ${fmt(p.vialMg)} mg<br>${fmt(p.vialWater)} mL/lọ → 50 mg/mL</dd></div><div><dt>Rút thuốc</dt><dd>${fmt(p.stockMl,1)} mL</dd></div><div><dt>Pha loãng</dt><dd>Đủ ${fmt(p.finalMl)} mL (5 mg/mL)<br>Thêm ≈ ${fmt(p.diluentMl,1)} mL</dd></div><div><dt>Truyền</dt><dd>≥ ${fmt(p.durationMin)} phút<br>≈ ${fmt(p.rateMlh)} mL/giờ</dd></div></dl><details><summary>Lưu ý thao tác</summary><p>Dùng NaCl 0,9% hoặc glucose 5%. Không quá 10 mg/phút. Dây 20 giọt/mL tương đương khoảng ${fmt(p.drops20)} giọt/phút; phải kiểm tra đúng hệ số dây thực tế.</p></details></div>`;
  }

  function planHtml(plan){
    const maint=plan.maintenance;
    const interval=plan.interval?.label||'Theo nồng độ/AUC thực đo';
    const total=plan.total24?`${fmt(plan.total24/1000,2)} g/24 giờ`:'Không quy đổi cố định';
    const range=plan.range?doseRangeText(plan.range):'Theo TDM/AUC';
    const continuous=plan.pediatric&&$('#vancoPediatricAdministration')?.value==='continuous'&&maint;
    const auc=plan.auc?`<div class="vanco-auc"><b>Hiệu chỉnh AUC:</b> ${fmt(plan.auc.practicalPerDose)} mg/lần · ${esc(interval)} <details><summary>Xem phép tính</summary>${fmt(plan.auc.currentDaily)} mg/24 giờ × ${fmt(plan.auc.target)} / ${fmt(plan.auc.measured)} = ${fmt(plan.auc.adjustedDaily)} mg/24 giờ; tính ${fmt(plan.auc.adjustedPerDose)} mg/lần.</details></div>`:'';
    const continuousNote=continuous?`<li><b>Truyền liên tục:</b> sau liều khởi đầu, pha tổng ${fmt(maint.practicalMg)} mg để truyền đều trong 24 giờ; theo quy trình của đơn vị và lấy nồng độ trạng thái ổn định sau 24–36 giờ.</li>`:'';
    const details=`<details class="vanco-more"><summary>Diễn giải, TDM và nguồn</summary><div class="vanco-more-body"><div class="vanco-calc-detail"><div><b>${plan.pediatric?'Liều đầu':'Liều nạp'} tính toán:</b> ${fmt(plan.load.rawMg)} mg (${fmt(plan.load.mgkg,1)} mg/kg), thao tác ${fmt(plan.load.practicalMg)} mg</div><div><b>Liều duy trì tính toán:</b> ${maint?`${fmt(maint.rawMg)} mg; thao tác ${fmt(maint.practicalMg)} mg${continuous?'/24 giờ':'/lần'}`:'chưa chốt'}</div><div><b>Dải khởi đầu:</b> ${range}</div><div><b>Tổng 24 giờ:</b> ${total}</div></div><ul>${plan.notes.map(x=>`<li>${esc(x)}</li>`).join('')}<li><b>TDM:</b> đích AUC24/MIC 400–600 chỉ áp dụng cho nhiễm MRSA nặng khi MIC BMD giả định 1 mg/L; ưu tiên đạt trong 24–48 giờ. Liều hiển thị là liều khởi đầu trước TDM.</li>${continuousNote}</ul><b>Nguồn kiểm chứng</b>${sourceLinks()}</div></details>`;
    return `<section id="vpmedVancoPlan" class="vanco-plan-card"><div class="vanco-plan-head"><div><span class="kicker">Bước 4</span><h3>4 · Kế hoạch liều Vancomycin cá thể hóa</h3></div><div class="vanco-mode">${esc(plan.modeLabel)}</div></div><div class="vanco-dose-grid">
      <div class="vanco-dose-metric primary"><span>${plan.pediatric?'Liều đầu/khởi đầu':'Liều nạp/ban đầu'}</span><strong>${fmt(plan.load.practicalMg)} mg</strong></div>
      <div class="vanco-dose-metric"><span>${continuous?'Tổng truyền liên tục':'Liều duy trì'}</span><strong>${maint?`${fmt(maint.practicalMg)} mg${continuous?'/24 giờ':'/lần'}`:'Chưa lập lịch'}</strong></div>
      <div class="vanco-dose-metric"><span>Thời điểm</span><strong>${esc(interval)}</strong></div>
      <div class="vanco-dose-metric"><span>Tổng 24 giờ</span><strong>${total}</strong></div>
    </div>${auc}${plan.alerts.map(x=>`<div class="vanco-alert"><b>Cảnh báo:</b> ${esc(x)}</div>`).join('')}${details}</section>`;
  }

  function updateHistory(plan,drug){
    const patientCode=String($('#patientCode')?.value||'').trim();
    const advice=plan.maintenance?`${fmt(plan.maintenance.practicalMg)} mg/lần; ${plan.interval?.label||'theo TDM'}; liều nạp ${fmt(plan.load.practicalMg)} mg`:`Liều ban đầu ${fmt(plan.load.practicalMg)} mg; chưa lập lịch duy trì, chờ TDM`;
    try{
      const h=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');
      const hit=h.find(x=>String(x.patientCode||'')===patientCode&&/vancomycin/i.test(String(x.drug||'')));
      if(hit){
        hit.advice=advice;
        if(plan.pediatric){
          hit.crcl='Không áp dụng (nhi khoa)';
          hit.egfr=plan.pediatricEgfr?`${fmt(plan.pediatricEgfr,1)} (CKiD bedside)`:'Chưa tính/không phù hợp nhóm tuổi';
        }
        localStorage.setItem(HISTORY_KEY,JSON.stringify(h.slice(0,100)));
      }
    }catch{}
    const cells=[...document.querySelectorAll('#hist tr:first-child td')];
    if(cells[5])cells[5].textContent=advice;
    if(plan.pediatric&&cells.length>=4){cells[2].textContent='Không áp dụng';cells[3].textContent=plan.pediatricEgfr?`${fmt(plan.pediatricEgfr,1)} (CKiD bedside)`:'—';}
  }

  function updateVancomycinProfiles(){
    (window.VPMED_DRUGS||[]).filter(isVanco).forEach(d=>{
      d.standard='Người lớn: liều nạp/ban đầu theo cân nặng thực; duy trì theo AUC/TDM và chức năng thận. Nhi khoa ≥3 tháng suy thận ổn định: phác đồ khởi đầu 45 mg/kg/ngày, chia 15 mg/kg mỗi 8 giờ, sau đó hiệu chỉnh sớm theo AUC/TDM. Trẻ <3 tháng: cá thể hóa theo PMA, cân nặng, SCr và mô hình PK.';
      d.doseDetail='Người lớn nhiễm MRSA nặng/ICU: có thể cân nhắc liều nạp 20–35 mg/kg cân nặng thực, tối đa 3.000 mg; liều duy trì không chốt chỉ bằng trough hoặc CrCl. Trẻ ≥3 tháng có chức năng thận bình thường: 60–80 mg/kg/ngày chia mỗi 6–8 giờ; khi suy thận ổn định, dữ liệu PK quần thể hỗ trợ khởi đầu 45 mg/kg/ngày = 15 mg/kg mỗi 8 giờ. Trẻ sơ sinh/<3 tháng: khoảng liều và khoảng cách phụ thuộc PMA, cân nặng, SCr; ưu tiên công cụ Bayesian/quy trình sơ sinh.';
      d.maxDose='Người lớn: liều nạp không quá 3.000 mg; người béo phì thường không quá 4.500 mg/ngày trước TDM. Nhi khoa: liều kinh nghiệm tối đa thường 3.600 mg/ngày khi chức năng thận đầy đủ; đa số không cần quá 3.000 mg/ngày, phải theo nồng độ.';
      d.renal=[
        'CrCl ≥50 mL/phút: 1 g mỗi 12 giờ.',
        'CrCl 30–49 mL/phút: 1 g mỗi 24 giờ hoặc 15–20 mg/kg mỗi 24 giờ.',
        'CrCl 15–29 mL/phút: 1 g mỗi 48 giờ.',
        'CrCl <15 mL/phút (chưa lọc máu): 1 g mỗi 72 giờ hoặc hiệu chỉnh theo TDM.',
        'Người lớn AKI/creatinine biến động hoặc vô niệu: không dùng lịch cố định chỉ theo CrCl; dùng liều ban đầu rồi định liều lại theo AUC/nồng độ và diễn biến thận.',
        'Trẻ ≥3 tháng suy thận ổn định: 45 mg/kg/ngày, chia 15 mg/kg mỗi 8 giờ là phác đồ khởi đầu từ dữ liệu PK; theo dõi hằng ngày vì thanh thải có thể hồi phục nhanh trong 5 ngày đầu.',
        'Trẻ ≥3 tháng AKI: không lập lịch duy trì cố định; phải TDM sớm và hiệu chỉnh theo diễn biến.',
        'Trẻ sơ sinh/<3 tháng: không ngoại suy công thức người lớn; cá thể hóa theo PMA, cân nặng, SCr và AUC/Bayesian.'
      ];
      d.hd='Người lớn IHD: liều theo cân nặng, loại màng và thời điểm dùng; lấy nồng độ trước HD, tránh lấy trong hoặc trong 2 giờ sau HD. Trẻ em HD/SLED: không ngoại suy trực tiếp bảng người lớn; cần Dược lâm sàng/Thận nhi và TDM.';
      d.crrt='Người lớn CRRT effluent 20–25 mL/kg/giờ: liều nạp 20–25 mg/kg; duy trì khởi đầu 7,5–10 mg/kg mỗi 12 giờ, TDM trong 24 giờ. Trẻ em CRRT: cá thể hóa theo phương thức/cường độ lọc và AUC/TDM chuyên khoa.';
      d.tdm='AUC-guided TDM cho người lớn và mọi nhóm tuổi nhi khoa. Đích AUC24/MIC 400–600 cho nhiễm MRSA nặng khi giả định MIC BMD 1 mg/L; ưu tiên đạt trong 24–48 giờ. Trẻ em theo dõi đồng thời nồng độ, creatinine, lượng nước tiểu và thuốc độc thận.';
      d.infusion='Hoàn nguyên lọ 500 mg với 10 mL hoặc lọ 1 g với 20 mL nước cất pha tiêm để được 50 mg/mL; pha tiếp NaCl 0,9% hoặc glucose 5% đến 5 mg/mL. Truyền ít nhất 60 phút và không quá 10 mg/phút; công cụ tính liều sẽ tính thể tích, thời gian và tốc độ riêng theo liều bệnh nhân.';
      d.doseSources=[
        {title:'ASHP/IDSA/PIDS/SIDP 2020 – Vancomycin AUC, người lớn, nhi khoa và RRT',url:ASHP_URL,note:'Nguồn chính cho AUC 400–600, liều theo nhóm tuổi, HD, CRRT và SLED.'},
        {title:'Royal Children’s Hospital – Vancomycin nhi khoa',url:RCH_URL,note:'Nguồn thực hành nhi khoa, sơ sinh, truyền liên tục và pha truyền.'},
        {title:'Nhãn Vancomycin – suy thận và truyền tĩnh mạch',url:LABEL_URL,note:'Nguồn nhãn cho liều ban đầu ở suy thận và yêu cầu truyền.'},
        {title:'NIDDK – phương trình eGFR nhi khoa',url:NIDDK_URL,note:'Nguồn phương trình CKiD bedside dùng cho trẻ có đủ chiều cao và SCr.'}
      ];
      d.renalVerified='Đã đối chiếu ASHP/IDSA/PIDS/SIDP 2020, hướng dẫn nhi khoa RCH và nhãn Vancomycin; liều duy trì phải theo AUC/TDM.';
    });
  }

  function render(){
    const drug=selectedDrug(),output=$('#output');
    if(!isVanco(drug)||!output?.classList.contains('result-card'))return;
    const plan=calculatePlan(patientInputs(),drug);
    if(!plan)return;

    if(plan.pediatric){
      const renalStep=output.querySelector('.renal-step');
      if(renalStep)renalStep.innerHTML=`<div class="result-step-head"><span class="result-step-number">2</span><h2>Đánh giá chức năng thận nhi khoa</h2></div><div class="kidney-metrics"><div class="kidney-metric primary"><span>Nhóm tuổi</span><strong>${esc(plan.ageGroup)}</strong><small>Không dùng Cockcroft–Gault/CKD-EPI người lớn</small></div><div class="kidney-metric"><span>Creatinine huyết thanh</span><strong>${fmt(patientInputs().scrUmol,1)}</strong><small>µmol/L</small></div>${plan.pediatricEgfr?`<div class="kidney-metric"><span>eGFR CKiD bedside</span><strong>${fmt(plan.pediatricEgfr,1)}</strong><small>mL/phút/1,73 m²</small></div>`:''}</div><div class="renal-alert renal-moderate"><div class="renal-alert-icon" aria-hidden="true">!</div><div><span>Đánh giá nhi khoa</span><strong>${esc($('#vancoPediatricRenal option:checked')?.textContent||'Theo dõi chức năng thận')}</strong><p>eGFR CKiD bedside chỉ hiển thị khi trẻ 1–16 tuổi có đủ chiều cao và creatinine; không dùng cho trẻ sơ sinh hoặc thay thế đánh giá AKI theo diễn biến.</p></div></div>`;
    }

    const metric=plan.pediatric?(plan.pediatricEgfr?`eGFR CKiD ${fmt(plan.pediatricEgfr,1)} mL/phút/1,73 m²`:'đánh giá thận nhi khoa đã chọn'):`CrCl ${fmt(crclValue(),1)} mL/phút`;
    const doseCurrent=output.querySelector('.dose-current');
    if(doseCurrent){doseCurrent.classList.add('vanco-compact-current');doseCurrent.innerHTML=`<span>Kế hoạch tại ${metric}</span><strong>${plan.maintenance?`${fmt(plan.maintenance.practicalMg)} mg${plan.pediatric&&$('#vancoPediatricAdministration')?.value==='continuous'?'/24 giờ':'/lần'} – ${esc(plan.interval?.label||'theo TDM')}`:`${fmt(plan.load.practicalMg)} mg liều ban đầu; chưa lập lịch duy trì`}</strong>`;}

    const grid=output.querySelector('.dose-detail-grid');
    if(grid)grid.remove();

    output.querySelector('#vpmedDose24Summary')?.remove();
    output.querySelector('#vpmedVancoPlan')?.remove();
    const safety=output.querySelector('.safety-step');
    if(safety)safety.insertAdjacentHTML('beforebegin',planHtml(plan));

    output.querySelectorAll('.vanco-infusion').forEach(x=>x.remove());
    const infusionBox=output.querySelector('.safety-grid .info-box:nth-child(2)');
    infusionBox?.querySelector('.infusion-grid')?.remove();
    const firstHeading=infusionBox?.querySelector('h3');
    if(firstHeading)firstHeading.insertAdjacentHTML('afterend',infusionHtml('Liều nạp/ban đầu',plan.load.infusion)+infusionHtml('Liều duy trì mỗi lần',plan.maintenance?.infusion));
    const safetyBox=output.querySelector('.safety-grid .info-box:first-child');
    if(safetyBox&&!safetyBox.querySelector('.vanco-safety-details')){
      const details=document.createElement('details');details.className='vanco-safety-details';details.innerHTML='<summary>Chống chỉ định, ADR và TDM</summary>';
      while(safetyBox.firstChild)details.appendChild(safetyBox.firstChild);
      safetyBox.appendChild(details);
    }
    const interactionHeading=[...(infusionBox?.children||[])].find(x=>x.tagName==='H3'&&/Tương tác/.test(x.textContent));
    if(interactionHeading&&!infusionBox.querySelector(':scope > .vanco-interaction-details')){
      const details=document.createElement('details');details.className='vanco-safety-details vanco-interaction-details';details.innerHTML='<summary>Tương tác thuốc và nguồn pha truyền</summary>';
      let node=interactionHeading;
      while(node){const next=node.nextSibling;details.appendChild(node);node=next;}
      infusionBox.appendChild(details);
    }
    const safetyNote=output.querySelector('.safety-note');
    if(safetyNote)safetyNote.innerHTML=plan.pediatric?'<b>Kiểm tra trước dùng:</b> không dùng công thức thận người lớn; chốt liều theo tuổi, chức năng thận, phương thức lọc và AUC/TDM.':'<b>Kiểm tra trước dùng:</b> chỉ dùng lịch theo CrCl khi creatinine ổn định; AUC/TDM quyết định liều duy trì.';
    updateHistory(plan,drug);
  }

  function init(){
    updateVancomycinProfiles();injectStyle();injectOptions();toggleOptions();
    $('#drug')?.addEventListener('change',()=>{toggleOptions();setTimeout(render,30);});
    $('#calc')?.addEventListener('click',()=>{render();setTimeout(render,30);});
    window.VPMED_VANCOMYCIN_RENAL_V2={calculatePlan,infusionPlan,pediatricEgfr,crclValue,render,updateVancomycinProfiles};
  }

  window.VPMED_VANCOMYCIN_RENAL_V2={calculatePlan,infusionPlan,pediatricEgfr,crclValue,render,updateVancomycinProfiles};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
