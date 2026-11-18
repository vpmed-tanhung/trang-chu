(function(root){
  'use strict';

  const betaLactams=new Set([
    'amoxicillin-clavulanate','ampicillin-sulbactam','ceftazidime','meropenem',
    'piperacillin-tazobactam','cefixime','cefotaxime','cefpodoxime','imipenem-cilastatin',
    'amoxicillin','cefazolin','cefoperazone','cefoxitin','ceftriaxone'
  ]);
  const aminoglycosides=new Set(['amikacin','gentamicin']);
  const fluoroquinolones=new Set(['ciprofloxacin','levofloxacin']);

  function groupForDrug(id){
    if(id==='vancomycin')return 'vancomycin';
    if(betaLactams.has(id))return 'beta';
    if(aminoglycosides.has(id))return 'peak';
    if(fluoroquinolones.has(id))return 'auc';
    return 'other';
  }

  function number(value){
    if(typeof value!=='string'&&typeof value!=='number')return NaN;
    const clean=String(value).trim().replace(',','.');
    return /^\d+(\.\d+)?$|^\.\d+$/.test(clean)?Number(clean):NaN;
  }

  function positive(value){
    return Number.isFinite(value)&&value>0;
  }

  function assess(input){
    const group=groupForDrug(input.drugId);
    const category=input.category||'';
    const mic=number(input.mic);
    const operator=input.operator||'=';
    if(category==='R')return {group,block:true,notice:'Kháng (R) theo phiếu xét nghiệm. Cần đánh giá lại lựa chọn kháng sinh với nhóm điều trị.'};
    if(category==='no-breakpoint')return {group,block:true,notice:'Phiếu chưa có breakpoint có thể áp dụng. Cần Vi sinh/Dược lâm sàng xác nhận trước khi dùng kết quả để chọn liều.'};
    const categoryNotice={
      'I-eucast':'EUCAST I: kiểm tra phác đồ tăng phơi nhiễm đúng thuốc, tác nhân và ổ nhiễm.',
      'I-clsi':'CLSI I: đối chiếu ghi chú của labo và bảng CLSI dùng cho tác nhân, thuốc và ổ nhiễm này.',
      SDD:'CLSI SDD: chỉ đánh giá sau khi đối chiếu chế độ liều cụ thể của breakpoint và dữ liệu Nhi khoa.'
    }[category]||'';

    if(!positive(mic))return {group,categoryNotice,notice:'Nhập MIC dương, đơn vị mg/L; µg/mL có cùng trị số.'};
    if(operator!=='=')return {group,categoryNotice,notice:'MIC được báo theo giới hạn. Chỉ diễn giải theo kháng sinh đồ, không dùng làm giá trị chính xác để tính chỉ số.'};
    if(group==='beta'){
      const hours=number(input.exposure);
      const interval=number(input.interval);
      if(!Number.isFinite(hours)||hours<0||!positive(interval)||hours>interval){
        return {group,categoryNotice,notice:'Nhập thời gian nồng độ tự do vượt MIC và khoảng cách liều của cùng phác đồ. Thời gian vượt MIC có thể từ 0 đến bằng khoảng cách liều.'};
      }
      return {group,categoryNotice,metric:'%fT > MIC',value:hours/interval*100,unit:'%',
        notice:'So sánh với đích được phác đồ quy định cho đúng thuốc và bệnh cảnh. Giá trị thời gian phải lấy từ mô hình PK đã thẩm định cho MIC đã nhập.'};
    }

    if(group==='other')return {group,categoryNotice,notice:'Thuốc này chưa có quy tắc PK/PD theo MIC trong công cụ Nhi. Đối chiếu kháng sinh đồ và phác đồ theo bệnh cảnh.'};

    const exposure=number(input.exposure);
    if(!positive(exposure)){
      const label=group==='peak'?'Cmax đo đúng thời điểm':'AUC₂₄ từ TDM/mô hình đã thẩm định';
      return {group,categoryNotice,notice:`Cần ${label} của đúng chế độ liều để đánh giá MIC.`};
    }
    const value=exposure/mic;
    if(!positive(value))return {group,categoryNotice,notice:'Chỉ số ngoài phạm vi tính toán. Kiểm tra lại MIC, nồng độ và đơn vị.'};
    const result={group,categoryNotice,metric:group==='peak'?'Cmax/MIC':'AUC₂₄/MIC',value,unit:group==='peak'?'':'giờ'};
    if(group==='peak'){
      result.notice='Diễn giải cùng thời điểm lấy mẫu, chức năng thận, nồng độ đáy và mục tiêu của phác đồ. Liều hiệp đồng dùng quy tắc riêng.';
      return result;
    }
    if(group==='auc'){
      result.notice='Đối chiếu đích theo thuốc, tác nhân và ổ nhiễm. Không áp dụng đích vancomycin cho fluoroquinolone.';
      return result;
    }
    if(mic!==1){
      result.notice='Đích AUC 400–600 mg·giờ/L dùng cho MRSA nặng khi MIC BMD là 1 mg/L. Cần rà soát phương pháp đo và phương án điều trị cho MIC này.';
      return result;
    }
    if(!input.severeMrsaBmd){
      result.notice='Chỉ so với đích 400–600 khi xác nhận MRSA nặng và MIC đo bằng vi pha loãng canh thang (BMD).';
      return result;
    }
    if(exposure>=400&&exposure<=600){
      result.notice='AUC₂₄ nằm trong khoảng tham chiếu 400–600 mg·giờ/L theo đồng thuận ASHP/IDSA/PIDS/SIDP.';
      return result;
    }
    result.notice=exposure<400?'AUC₂₄ dưới khoảng tham chiếu 400–600 mg·giờ/L.':'AUC₂₄ trên khoảng tham chiếu 400–600 mg·giờ/L.';
    const currentDaily=number(input.currentDaily);
    if(input.currentDaily==null||input.currentDaily==='')return result;
    if(!positive(currentDaily)||category!=='S'||!input.stableMaintenance||
      input.ageMode!=='child'||input.ageMonths<3||!positive(input.weight)){
      result.adjustmentNotice='Để ước tính hiệu chỉnh, cần trẻ từ 3 tháng, kết quả S, AUC của liều duy trì ổn định và xác nhận chức năng thận phù hợp.';
      return result;
    }

    // Dose/AUC is constant only when estimated clearance remains unchanged.
    const estimate=currentDaily/exposure*500;
    const reviewCeiling=Math.min(80*input.weight,3000);
    if(!positive(estimate)||currentDaily>reviewCeiling||estimate>reviewCeiling){
      result.adjustmentNotice='Liều đang dùng hoặc ước tính vượt phạm vi tự tính (80 mg/kg/24 giờ hoặc 3.000 mg/24 giờ). Cần Dược lâm sàng rà soát TDM.';
      return result;
    }
    result.estimate=estimate;
    result.adjustmentNotice='Ước tính theo tỷ lệ cho AUC đích 500. Cần xác nhận khoảng liều, trần theo phác đồ và kế hoạch TDM trước khi áp dụng.';
    return result;
  }

  root.VPMED_PEDIATRIC_MIC=Object.freeze({assess,groupForDrug});
})(typeof window==='undefined'?globalThis:window);
