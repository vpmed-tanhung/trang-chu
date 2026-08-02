(function(){
  'use strict';

  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const n=v=>Number.isFinite(+v)?+v:null;
  const round=(v,d=2)=>{const p=10**d;return Math.round((v+Number.EPSILON)*p)/p};
  const fmt=v=>{
    if(v===null||v===undefined||!Number.isFinite(+v))return '—';
    return new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(round(+v,2));
  };
  const range=(a,b,unit='')=>{
    if(a===null||a===undefined)return '—';
    if(b===null||b===undefined||Math.abs(a-b)<1e-9)return `${fmt(a)}${unit?` ${unit}`:''}`;
    return `${fmt(a)}–${fmt(b)}${unit?` ${unit}`:''}`;
  };
  const component=(name,minMg,maxMg=minMg)=>({name,minMg,maxMg});
  const withTotals=s=>{
    if(!s.components?.length||!s.intervalMin||!s.intervalMax)return s;
    const freqMin=24/s.intervalMax;
    const freqMax=24/s.intervalMin;
    s.frequencyMin=freqMin;
    s.frequencyMax=freqMax;
    s.components=s.components.map(c=>({...c,totalMinMg:c.minMg*freqMin,totalMaxMg:c.maxMg*freqMax}));
    s.totalMinMg=s.components.reduce((t,c)=>t+c.totalMinMg,0);
    s.totalMaxMg=s.components.reduce((t,c)=>t+c.totalMaxMg,0);
    return s;
  };
  const sc=(label,components,intervalMin,intervalMax=intervalMin,extra={})=>withTotals({label,components,intervalMin,intervalMax,...extra});
  const unavailable=(label,note,extra={})=>({label,status:'unavailable',note,...extra});
  const activeNames=d=>String(d.active||'').replace(/\*/g,'').split(/\s*\+\s*/).map(x=>x.trim()).filter(Boolean);

  function injectStyle(){
    if(document.getElementById('vpmed-dose24-style'))return;
    const style=document.createElement('style');
    style.id='vpmed-dose24-style';
    style.textContent=`
      .dose24-card{margin:14px 0 18px;padding:17px;border:1px solid #86c8a8;background:linear-gradient(180deg,#f3fff9,#fff);border-radius:16px;box-shadow:0 8px 20px rgba(20,107,75,.08)}
      .dose24-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:13px}.dose24-head h3{margin:4px 0 0;color:#075d4a;font-size:20px}.dose24-head label{min-width:250px;color:#1d5c49}.dose24-head select{width:100%;margin-top:5px;background:#fff;border:1px solid #9bd2b9;border-radius:10px;padding:9px}
      .dose24-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.dose24-metric{display:flex;flex-direction:column;gap:5px;min-height:112px;padding:13px;border:1px solid #cfe9dc;background:#fff;border-radius:13px}.dose24-metric span{font-size:12px;font-weight:800;color:#4c6f62}.dose24-metric strong{font-size:16px;line-height:1.42;color:#123d31;overflow-wrap:anywhere}.dose24-metric small{color:#587367;line-height:1.4}.dose24-metric.total{background:#e9fff3;border-color:#84d2aa}.dose24-metric.total strong{font-size:22px;color:#006c45}
      .dose24-components{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.dose24-component{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 13px;border:1px solid #d9e9e1;background:#f9fffc;border-radius:11px}.dose24-component span{font-size:13px;color:#355f50}.dose24-component strong{color:#075d4a;white-space:nowrap}
      .dose24-loading,.dose24-note,.dose24-disclaimer{margin-top:10px;padding:11px 13px;border-radius:11px;line-height:1.5}.dose24-loading{background:#fff8e8;border:1px solid #efd08a;color:#6c5318}.dose24-note{background:#eef7ff;border:1px solid #c6def2;color:#315d79}.dose24-disclaimer{background:#f7faf8;border:1px dashed #b6d2c4;color:#49675b;font-size:12px}
      @media(max-width:1000px){.dose24-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){.dose24-head{display:block}.dose24-head label{min-width:0;margin-top:10px}.dose24-grid,.dose24-components{grid-template-columns:1fr}.dose24-metric{min-height:auto}.dose24-component{align-items:flex-start;flex-direction:column;gap:4px}.dose24-component strong{white-space:normal}}
    `;
    document.head.appendChild(style);
  }

  function doseRangeScenario(label,name,minMg,maxMg,intervalMin,intervalMax=intervalMin,extra={}){
    return sc(label,[component(name,minMg,maxMg)],intervalMin,intervalMax,extra);
  }
  function comboScenario(label,names,values,intervalMin,intervalMax=intervalMin,extra={}){
    return sc(label,names.map((name,i)=>component(name,values[i][0],values[i][1]??values[i][0])),intervalMin,intervalMax,extra);
  }
  function splitCombined(totalMinMg,totalMaxMg,ratios){
    const sum=ratios.reduce((a,b)=>a+b,0);
    return ratios.map(r=>[totalMinMg*r/sum,totalMaxMg*r/sum]);
  }
  function crclValue(){
    const age=n(document.querySelector('#age')?.value),wt=n(document.querySelector('#wt')?.value),scru=n(document.querySelector('#scr')?.value);
    if(!age||!wt||!scru)return null;
    let value=((140-age)*wt)/(72*(scru/88.4));
    if(document.querySelector('#sex')?.value==='f')value*=0.85;
    return Math.max(0,value);
  }

  function scenariosFor(d,crcl,wt,dialysis){
    const a=norm(d.active), route=norm(d.route);
    const names=activeNames(d);

    if(dialysis){
      return [unavailable('Đang lọc máu','Cần xác định riêng HD hay CRRT, thời điểm dùng thuốc và lịch lọc trước khi tính số lần và tổng liều 24 giờ.',{
        perDoseOverride:d.strength||'—',intervalOverride:'Theo phác đồ HD/CRRT',frequencyOverride:'Theo lịch lọc',totalOverride:'Chưa quy đổi an toàn',loading:[d.hd,d.crrt].filter(Boolean).join(' | ')
      })];
    }

    if(a.includes('amoxic')&&a.includes('clav')){
      const amox=names[0]||'Amoxicillin', clav=names[1]||'Acid clavulanic';
      if(route.includes('tiem')){
        if(wt<=50)return [unavailable('Cân nặng ≤50 kg','Chưa tự động chốt phác đồ cho chế phẩm này ở người bệnh ≤50 kg.',{perDoseOverride:d.strength||'—',intervalOverride:'Cần xác nhận',frequencyOverride:'Cần xác nhận',totalOverride:'Chưa tính'})];
        if(crcl>=30){
          return [
            comboScenario('Liều thường dùng',[amox,clav],[[1000,1000],[200,200]],8,8,{unitText:'1 lọ/lần'}),
            comboScenario('Nhiễm khuẩn nặng',[amox,clav],[[1000,1000],[200,200]],6,6,{unitText:'1 lọ/lần',note:'Chỉ chọn khi bác sĩ xác định phác đồ phù hợp.'})
          ];
        }
        if(crcl>=10)return [comboScenario('Liều duy trì sau liều khởi đầu',[amox,clav],[[500,500],[100,100]],12,12,{unitText:'1/2 lọ/lần',loading:'Liều khởi đầu: 1.000 mg amoxicillin + 200 mg clavulanate.'})];
        return [comboScenario('Liều duy trì sau liều khởi đầu',[amox,clav],[[500,500],[100,100]],24,24,{unitText:'1/2 lọ/lần',loading:'Liều khởi đầu: 1.000 mg amoxicillin + 200 mg clavulanate.'})];
      }
      if(crcl>=30){
        return [
          comboScenario('Phác đồ 3 lần/ngày',[amox,clav],[[500,500],[125,125]],8,8,{unitText:'1 viên/lần'}),
          comboScenario('Phác đồ 2 lần/ngày',[amox,clav],[[500,500],[125,125]],12,12,{unitText:'1 viên/lần'})
        ];
      }
      if(crcl>=10)return [comboScenario('Liều hiệu chỉnh',[amox,clav],[[500,500],[125,125]],12,12,{unitText:'1 viên/lần'})];
      return [comboScenario('Liều hiệu chỉnh',[amox,clav],[[500,500],[125,125]],24,24,{unitText:'1 viên/lần'})];
    }

    if(a.includes('sulfamethoxazol')&&a.includes('trimethoprim')){
      const smx=names[0]||'Sulfamethoxazol',tmp=names[1]||'Trimethoprim';
      if(crcl<15)return [unavailable('CrCl <15 mL/phút','Không tự động chốt liều.',{perDoseOverride:'Theo chỉ định chuyên gia',intervalOverride:'Không cố định',frequencyOverride:'Không cố định',totalOverride:'Chưa tính'})];
      if(crcl<30)return [comboScenario('Nhiễm khuẩn thông thường – giảm 50%',[smx,tmp],[[400,400],[80,80]],12,12,{unitText:'1 viên/lần'})];
      return [comboScenario('Nhiễm khuẩn thông thường',[smx,tmp],[[800,800],[160,160]],12,12,{unitText:'2 viên/lần'})];
    }

    if(a.includes('levofloxacin')){
      const name=names[0]||'Levofloxacin';
      if(crcl>=50)return [doseRangeScenario('Phác đồ 500 mg',name,500,500,24),doseRangeScenario('Phác đồ 750 mg',name,750,750,24)];
      if(crcl>=20)return [doseRangeScenario('Sau liều đầu 500 mg',name,250,250,24,24,{loading:'500 mg'}),doseRangeScenario('Phác đồ 750 mg',name,750,750,48,48)];
      return [doseRangeScenario('Sau liều đầu 500 mg',name,250,250,48,48,{loading:'500 mg'}),doseRangeScenario('Sau liều đầu 750 mg',name,500,500,48,48,{loading:'750 mg'})];
    }
    if(a.includes('cefpodoxim'))return [doseRangeScenario('Liều thấp',names[0]||'Cefpodoxim',100,100,crcl>=30?12:24),doseRangeScenario('Liều cao',names[0]||'Cefpodoxim',200,200,crcl>=30?12:24)];
    if(a.includes('cefixim')){
      const name=names[0]||'Cefixim';
      if(crcl>=60)return [doseRangeScenario('400 mg dùng 1 lần/ngày',name,400,400,24),doseRangeScenario('Chia 2 lần/ngày',name,200,200,12)];
      return [doseRangeScenario('Liều hiệu chỉnh',name,200,200,24)];
    }
    if(a.includes('cefoperazon'))return [doseRangeScenario('Liều thường dùng',names[0]||'Cefoperazon',1000,2000,12)];
    if(a.includes('cefoxitin')){
      let dm=[1000,2000],iv=[6,8];
      if(crcl<5){dm=[500,1000];iv=[24,48];}
      else if(crcl<10){dm=[500,1000];iv=[12,24];}
      else if(crcl<30){iv=[12,24];}
      else if(crcl<50){iv=[6,12];}
      return [doseRangeScenario('Theo ngưỡng CrCl',names[0]||'Cefoxitin',dm[0],dm[1],iv[0],iv[1])];
    }
    if(a.includes('ceftazidim')){
      const name=names[0]||'Ceftazidim';
      if(crcl>50)return [doseRangeScenario('Liều 1 g',name,1000,1000,8),doseRangeScenario('Liều 2 g',name,2000,2000,8)];
      if(crcl>30)return [doseRangeScenario('Từ phác đồ chuẩn 1 g/8 giờ',name,1000,1000,12),doseRangeScenario('Từ phác đồ chuẩn 2 g/8 giờ',name,2000,2000,12)];
      if(crcl>15)return [doseRangeScenario('Từ phác đồ chuẩn 1 g/8 giờ',name,1000,1000,24),doseRangeScenario('Từ phác đồ chuẩn 2 g/8 giờ',name,2000,2000,24)];
      return [doseRangeScenario('Từ phác đồ chuẩn 1 g/8 giờ',name,500,500,24),doseRangeScenario('Từ phác đồ chuẩn 2 g/8 giờ',name,1000,1000,24)];
    }
    if(a.includes('ciprofloxacin')){
      const name=names[0]||'Ciprofloxacin',oral=route.includes('uong');
      if(crcl>50)return oral?[doseRangeScenario('Đường uống',name,500,750,12)]:[doseRangeScenario('Truyền tĩnh mạch',name,400,400,8,12)];
      if(crcl>=30)return oral?[doseRangeScenario('Đường uống',name,250,500,12)]:[doseRangeScenario('Truyền tĩnh mạch',name,400,400,8,12)];
      if(crcl>=5)return oral?[doseRangeScenario('Đường uống',name,250,500,18,24)]:[doseRangeScenario('Truyền tĩnh mạch',name,200,400,12,24)];
      return [unavailable('Suy thận rất nặng','Cần đối chiếu tờ HDSD đúng chế phẩm.',{perDoseOverride:'Theo HDSD',intervalOverride:'Theo HDSD',frequencyOverride:'Theo HDSD',totalOverride:'Chưa tính'})];
    }
    if(a.includes('amikacin')){
      let mgkg=15,h=24;
      if(crcl<10){mgkg=3;h=72;}else if(crcl<20){mgkg=4;h=48;}else if(crcl<30){mgkg=7.5;h=48;}else if(crcl<40){mgkg=4;}else if(crcl<60){mgkg=7.5;}else if(crcl<=80){mgkg=12;}
      const dose=wt*mgkg;
      return [doseRangeScenario(`${fmt(mgkg)} mg/kg/lần`,names[0]||'Amikacin',dose,dose,h,h,{note:`Tính theo cân nặng ${fmt(wt)} kg; cần TDM.`})];
    }
    if(a.includes('moxifloxacin'))return [doseRangeScenario('Liều duy trì',names[0]||'Moxifloxacin',400,400,24)];
    if(a.includes('ampicilin')||a.includes('ampicillin')){
      let h=6;if(crcl<15)h=24;else if(crcl<30)h=12;
      if(crcl<5)return [unavailable('CrCl <5 mL/phút','Cần đối chiếu HDSD/chuyên gia.',{perDoseOverride:'Theo HDSD',intervalOverride:'Theo HDSD',frequencyOverride:'Theo HDSD',totalOverride:'Chưa tính'})];
      const low=splitCombined(1500,1500,[2,1]),high=splitCombined(3000,3000,[2,1]),nn=names.length>=2?names:['Ampicilin','Sulbactam'];
      return [comboScenario('Liều 1,5 g',nn,low,h),comboScenario('Liều 3 g',nn,high,h)];
    }
    if(a.includes('piperacilin')){
      const h=crcl>40?8:(crcl>=20?8:12),vals=splitCombined(4500,4500,[8,1]),nn=names.length>=2?names:['Piperacilin','Tazobactam'];
      const arr=[comboScenario('Phác đồ thường dùng',nn,vals,h,h,{unitText:'1 lọ 4,5 g/lần'})];
      if(crcl>40)arr.unshift(comboScenario('Phác đồ mỗi 6 giờ',nn,vals,6,6,{unitText:'1 lọ 4,5 g/lần'}));
      return arr;
    }
    if(a.includes('cefotaxim')){
      let iv=[6,8];if(crcl<10)iv=[24,24];else if(crcl<=50)iv=[6,12];
      return [doseRangeScenario('Theo chỉ định',names[0]||'Cefotaxim',1000,2000,iv[0],iv[1])];
    }
    if(a.includes('ceftriaxon'))return [doseRangeScenario('Liều thường dùng',names[0]||'Ceftriaxon',1000,2000,24),doseRangeScenario('Viêm màng não',names[0]||'Ceftriaxon',2000,2000,12)];
    if(a.includes('meropenem')){
      let factor=1,h=8;if(crcl<=50&&crcl>=26)h=12;else if(crcl<26&&crcl>=10){factor=.5;h=12;}else if(crcl<10){factor=.5;h=24;}
      return [doseRangeScenario('Phác đồ thường dùng',names[0]||'Meropenem',1000*factor,1000*factor,h),doseRangeScenario('Nhiễm nặng/TKTW',names[0]||'Meropenem',2000*factor,2000*factor,h)];
    }
    if(a.includes('spiramycin')&&a.includes('metronidazol')){
      return [
        unavailable('4 viên/ngày','Chế độ 4 viên/ngày, chia 2 lần trong bữa ăn.',{perDoseOverride:'2 viên = spiramycin 1,5 MIU + metronidazol 250 mg',intervalOverride:'Mỗi 12 giờ',frequencyOverride:'2 lần/24 giờ',totalOverride:'Spiramycin 3 MIU + metronidazol 500 mg/24 giờ'}),
        unavailable('6 viên/ngày','Chế độ tối đa 6 viên/ngày, chia 3 lần trong bữa ăn.',{perDoseOverride:'2 viên = spiramycin 1,5 MIU + metronidazol 250 mg',intervalOverride:'Mỗi 8 giờ',frequencyOverride:'3 lần/24 giờ',totalOverride:'Spiramycin 4,5 MIU + metronidazol 750 mg/24 giờ'})
      ];
    }
    if(a.includes('metronidazol'))return [doseRangeScenario('Mỗi 8 giờ',names[0]||'Metronidazol',500,500,8),doseRangeScenario('Mỗi 12 giờ',names[0]||'Metronidazol',500,500,12)];
    if(a.includes('ofloxacin')&&route.includes('tra mat'))return [unavailable('Thuốc mỡ tra mắt','Dạng dùng tại chỗ không quy đổi sang gam hoạt chất khi nhãn hàm lượng chưa được xác nhận.',{perDoseOverride:'Dải thuốc mỡ khoảng 1 cm/mắt bệnh',intervalOverride:'Mỗi 8 giờ',frequencyOverride:'3 lần/24 giờ',totalOverride:'3 lần tra/24 giờ; thường không quá 14 ngày'})];
    if(a.includes('itraconazol'))return [doseRangeScenario('100 mg/ngày',names[0]||'Itraconazol',100,100,24),doseRangeScenario('200 mg/ngày',names[0]||'Itraconazol',200,200,24),doseRangeScenario('Liều tối đa thông thường',names[0]||'Itraconazol',200,200,12)];
    if(a.includes('cefazolin')){
      const name=names[0]||'Cefazolin';
      if(crcl>30)return [doseRangeScenario('Nhiễm không biến chứng',name,1000,1000,8),doseRangeScenario('Nhiễm nặng/phức tạp',name,2000,2000,8)];
      if(crcl>=10)return [doseRangeScenario('Nhiễm không biến chứng',name,1000,1000,12),doseRangeScenario('Nhiễm nặng/phức tạp',name,2000,2000,12)];
      return [doseRangeScenario('Liều hiệu chỉnh',name,1000,1000,24)];
    }
    if(a.includes('gentamicin')){
      const low=wt*5,high=wt*7;
      return [unavailable('Liều kéo dài 5–7 mg/kg',`Liều mỗi lần theo cân nặng ${fmt(wt)} kg; khoảng cách phải xác định bằng nomogram/TDM.`,{perDoseOverride:range(low,high,'mg'),intervalOverride:'Theo nomogram/TDM',frequencyOverride:'Theo nomogram/TDM',totalOverride:'Chưa xác định'})];
    }
    if(a.includes('vancomycin')){
      const low=wt*20,high=wt*25;
      return [unavailable('Liều nạp',`Liều duy trì, khoảng cách và tổng liều 24 giờ phải chốt theo AUC/TDM.`,{perDoseOverride:range(low,high,'mg'),intervalOverride:'Theo AUC/TDM',frequencyOverride:'Theo AUC/TDM',totalOverride:'Chưa xác định',loading:range(low,high,'mg')})];
    }
    if(a.includes('benzathin'))return [unavailable('Liều phụ thuộc chỉ định','Chế phẩm dùng theo lịch ngày/tuần tùy chỉ định.',{perDoseOverride:d.strength||'1.200.000 IU',intervalOverride:'Theo chỉ định',frequencyOverride:'Theo lịch điều trị',totalOverride:'Không quy đổi sang g/24 giờ'})];
    if(a.includes('colistin'))return [unavailable('Không tự động quy đổi','Không quy đổi MIU colistimethate sodium sang gam hoạt chất khi chưa xác minh chuẩn đơn vị của đúng chế phẩm.',{perDoseOverride:d.strength||'2 MIU',intervalOverride:'Theo phác đồ chuyên khoa',frequencyOverride:'Theo phác đồ chuyên khoa',totalOverride:'Không quy đổi an toàn'})];
    if(a.includes('fosfomycin')){
      const factor=crcl>40?1:crcl>30?.7:crcl>20?.6:crcl>10?.4:.2,name=names[0]||'Fosfomycin';
      return [doseRangeScenario('Phác đồ nền 12 g/ngày',name,3000*factor,3000*factor,6,6,{note:`Đã áp dụng ${fmt(factor*100)}% liều nền theo ngưỡng CrCl.`}),doseRangeScenario('Phác đồ nền 16 g/ngày',name,4000*factor,4000*factor,6,6,{note:`Đã áp dụng ${fmt(factor*100)}% liều nền theo ngưỡng CrCl.`}),doseRangeScenario('Nhiễm rất nặng – nền 24 g/ngày',name,6000*factor,6000*factor,6,6,{note:`Đã áp dụng ${fmt(factor*100)}% liều nền; chỉ chọn khi chỉ định/phác đồ cho phép.`})];
    }
    if(a.includes('imipenem')){
      const nn=names.length>=2?names:['Imipenem','Cilastatin'];
      if(crcl<15)return [unavailable('CrCl <15 mL/phút','Chỉ dùng khi HD được thực hiện trong vòng 48 giờ; cần chốt lịch dùng theo HD.',{perDoseOverride:'Theo bảng HD',intervalOverride:'Theo buổi HD',frequencyOverride:'Theo lịch lọc',totalOverride:'Không tự động tính'})];
      if(crcl<30)return [comboScenario('Phác đồ 200 mg mỗi 6 giờ',nn,[[200,200],[200,200]],6),comboScenario('Phác đồ 500 mg mỗi 12 giờ',nn,[[500,500],[500,500]],12)];
      if(crcl<60)return [comboScenario('Phác đồ 300 mg mỗi 6 giờ',nn,[[300,300],[300,300]],6),comboScenario('Phác đồ 500 mg mỗi 8 giờ',nn,[[500,500],[500,500]],8),comboScenario('Nhạy cảm trung gian',nn,[[500,500],[500,500]],6)];
      if(crcl<90)return [comboScenario('Phác đồ 400 mg mỗi 6 giờ',nn,[[400,400],[400,400]],6),comboScenario('Phác đồ 500 mg mỗi 6 giờ',nn,[[500,500],[500,500]],6),comboScenario('Nhạy cảm trung gian',nn,[[750,750],[750,750]],8)];
      return [comboScenario('Phác đồ 500 mg mỗi 6 giờ',nn,[[500,500],[500,500]],6),comboScenario('Phác đồ 1.000 mg mỗi 8 giờ',nn,[[1000,1000],[1000,1000]],8),comboScenario('Nhạy cảm trung gian',nn,[[1000,1000],[1000,1000]],6)];
    }
    return [unavailable('Chưa có quy tắc quy đổi','Không tự suy diễn con số khi dữ liệu hiện tại chưa đủ.',{perDoseOverride:d.strength||'—',intervalOverride:'Chưa xác định',frequencyOverride:'Chưa xác định',totalOverride:'Chưa xác định'})];
  }

  function scenarioHtml(s){
    if(s.status==='unavailable'){
      return `<div class="dose24-grid">
        <div class="dose24-metric"><span>Liều mỗi lần</span><strong>${esc(s.perDoseOverride||'Chưa xác định')}</strong></div>
        <div class="dose24-metric"><span>Khoảng cách dùng</span><strong>${esc(s.intervalOverride||'Chưa xác định')}</strong></div>
        <div class="dose24-metric"><span>Số lần dùng trong 24 giờ</span><strong>${esc(s.frequencyOverride||'Chưa xác định')}</strong></div>
        <div class="dose24-metric total"><span>Tổng gam hoạt chất trong 24 giờ</span><strong>${esc(s.totalOverride||'Chưa xác định')}</strong></div>
      </div>${s.loading?`<div class="dose24-loading"><b>Liều nạp/khởi đầu:</b> ${esc(s.loading)}</div>`:''}<div class="dose24-note"><b>${esc(s.label)}:</b> ${esc(s.note||'Chưa đủ dữ liệu để quy đổi tự động.')}</div>`;
    }
    const freqText=range(s.frequencyMin,s.frequencyMax,'lần');
    const intervalText=range(s.intervalMin,s.intervalMax,'giờ');
    const perDose=s.components.map(c=>`${esc(c.name)} ${range(c.minMg,c.maxMg,'mg')}`).join(' + ');
    const componentRows=s.components.map(c=>`<div class="dose24-component"><span>Tổng ${esc(c.name)} trong 24 giờ</span><strong>${range(c.totalMinMg,c.totalMaxMg,'mg')}</strong></div>`).join('');
    const totalGramMin=s.totalMinMg/1000,totalGramMax=s.totalMaxMg/1000;
    return `<div class="dose24-grid">
      <div class="dose24-metric"><span>Liều mỗi lần</span><strong>${perDose}</strong>${s.unitText?`<small>${esc(s.unitText)}</small>`:''}</div>
      <div class="dose24-metric"><span>Khoảng cách dùng</span><strong>Mỗi ${intervalText}</strong></div>
      <div class="dose24-metric"><span>Số lần dùng trong 24 giờ</span><strong>${freqText}/24 giờ</strong>${s.intervalMax>24?'<small>Giá trị trung bình; lịch thực tế dùng cách ngày.</small>':''}</div>
      <div class="dose24-metric total"><span>Tổng gam hoạt chất trong 24 giờ</span><strong>${range(totalGramMin,totalGramMax,'g')}</strong><small>${range(s.totalMinMg,s.totalMaxMg,'mg')}</small></div>
    </div>${componentRows?`<div class="dose24-components">${componentRows}</div>`:''}${s.loading?`<div class="dose24-loading"><b>Liều nạp/khởi đầu:</b> ${esc(s.loading)}</div>`:''}${s.note?`<div class="dose24-note">${esc(s.note)}</div>`:''}`;
  }

  function render(){
    const output=document.querySelector('#output');
    if(!output||!output.classList.contains('result-card'))return;
    const selectedId=String(document.querySelector('#drug')?.value||'');
    const d=(window.VPMED_DRUGS||[]).find(x=>String(x.id)===selectedId);
    const crcl=crclValue(),wt=n(document.querySelector('#wt')?.value);
    if(!d||crcl===null||!wt)return;
    injectStyle();
    const dialysis=!!document.querySelector('#dialysis')?.checked;
    const scenarios=scenariosFor(d,crcl,wt,dialysis);
    output.querySelector('#vpmedDose24Summary')?.remove();
    const host=document.createElement('section');
    host.id='vpmedDose24Summary';host.className='dose24-card';
    const options=scenarios.map((s,i)=>`<option value="${i}">${esc(s.label)}</option>`).join('');
    host.innerHTML=`<div class="dose24-head"><div><span class="kicker">Bước 4</span><h3>4 · Liều/24 giờ</h3></div>${scenarios.length>1?`<label>Phác đồ đang tính<select id="vpmedDose24Scenario">${options}</select></label>`:''}</div><div id="vpmedDose24Body">${scenarioHtml(scenarios[0])}</div><div class="dose24-disclaimer"><b>Lưu ý:</b> Khối này chỉ quy đổi từ phác đồ đang hiển thị. Trường hợp TDM, HD, CRRT, lịch dùng cách ngày hoặc dữ liệu chưa đủ sẽ không tự suy diễn tổng liều.</div>`;
    const anchor=output.querySelector('#dose24Anchor');
    if(anchor)anchor.replaceWith(host);else output.append(host);
    host.querySelector('#vpmedDose24Scenario')?.addEventListener('change',e=>{host.querySelector('#vpmedDose24Body').innerHTML=scenarioHtml(scenarios[+e.target.value]);});
  }

  function init(){
    const calc=document.querySelector('#calc');
    if(!calc)return;
    calc.addEventListener('click',()=>setTimeout(render,0));
    document.querySelector('#drug')?.addEventListener('change',()=>setTimeout(render,0));
  }

  window.VPMED_DOSE24={scenariosFor,render,fmt,range};
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }
})();
