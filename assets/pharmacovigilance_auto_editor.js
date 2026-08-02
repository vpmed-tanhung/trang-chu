(() => {
  'use strict';

  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const norm=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const clip=(value,limit=230)=>{const text=clean(value);if(text.length<=limit)return text;const cut=text.slice(0,limit-1);return `${cut.slice(0,Math.max(cut.lastIndexOf(' '),120)).replace(/[,;:]$/,'')}…`};
  const unique=items=>[...new Set(items.map(clean).filter(Boolean))].slice(0,4);
  const sentences=value=>unique(clean(value).split(/(?<=[.!?…])\s+/).map(x=>clip(x)));
  const pick=(items,pattern)=>unique(items.filter(item=>pattern.test(norm(item))));

  const DRUG_RULES=[
    [/pivoxil/,'Kháng sinh chứa ester pivoxil'],[/valproat|valproic/,'Valproat (natri valproat/acid valproic)'],[/methadon/,'Methadon'],
    [/atorvastatin|simvastatin|clarithromycin/,'Atorvastatin; simvastatin; clarithromycin'],[/orlistat/,'Orlistat'],[/amiodaron/,'Amiodaron'],
    [/diosmin|hesperidin/,'Diosmin; hesperidin'],[/opioid|morphin|tramadol|oxycodon|fentanyl/,'Opioid'],[/corticosteroid|corticoid/,'Corticosteroid'],
    [/ssri|snri|chong tram cam/,'Thuốc chống trầm cảm SSRI/SNRI'],[/ace|uc che men chuyen/,'Thuốc ức chế men chuyển ACE'],
    [/fluoroquinolon|quinolon/,'Fluoroquinolon'],[/vancomycin/,'Vancomycin'],[/metronidazol/,'Metronidazol'],[/itraconazol/,'Itraconazol']
  ];

  function inferDrugs(item,text){
    const existing=clean(item.drugs);
    if(existing&&!/mo noi dung goc|chua bien tap|xac dinh thuoc/i.test(norm(existing)))return existing;
    const haystack=norm(`${item.title} ${text}`);
    const matched=DRUG_RULES.filter(([pattern])=>pattern.test(haystack)).map(([,label])=>label);
    if(matched.length)return unique(matched).join('; ');
    const title=clean(item.title);
    const phrase=title.match(/(?:sử dụng|khi dùng|dùng|chứa)\s+(.{3,90}?)(?:\s+(?:ở|trên|trong|cho|khi)\b|[.:]|$)/i)?.[1];
    return phrase?clip(phrase,100):'Thuốc/nhóm thuốc nêu trong tiêu đề và nguồn gốc';
  }

  function inferCategory(text){
    const value=norm(text);
    if(/tuong tac|interaction/.test(value))return 'Tương tác thuốc';
    if(/mang thai|thai nhi|sinh san|cho con bu/.test(value))return 'Thai kỳ & sức khỏe sinh sản';
    if(/tre em|tre so sinh|nhi khoa/.test(value))return 'Đối tượng đặc biệt';
    if(/qua lieu|ngo doc/.test(value))return 'Quá liều & thuốc nguy cơ cao';
    if(/thu hoi|loi chat luong|gia mao/.test(value))return 'Chất lượng thuốc & thu hồi';
    return 'Cảnh báo an toàn thuốc';
  }

  function inferSystem(text){
    const value=norm(text),systems=[];
    if(/tim|qt|nhip|huyet ap|mach/.test(value))systems.push('Tim mạch');
    if(/than kinh|co giat|y thuc|tam than|dong kinh/.test(value))systems.push('Thần kinh');
    if(/\bgan\b|men gan|\bmat\b|duong mat/.test(value))systems.push('Gan mật');
    if(/suy than|creatinin|tieu co van/.test(value))systems.push('Thận');
    if(/ha duong huyet|carnitin|noi tiet|chuyen hoa/.test(value))systems.push('Chuyển hóa');
    if(/tre em|tre so sinh|nhi khoa/.test(value))systems.push('Nhi khoa');
    if(/mang thai|thai nhi|sinh san/.test(value))systems.push('Sản khoa');
    return unique(systems).join(' · ')||'Toàn thân';
  }

  function inferLevel(text){
    const value=norm(text);
    if(/tu vong|chong chi dinh|nghiem trong|khong hoi phuc|co giat|ngung tim|ngung ho hap/.test(value))return 'red';
    if(/nguy co|canh bao|toan thuong|chay mau|di tat/.test(value))return 'orange';
    return 'green';
  }

  function editAlert(item,detailText=''){
    if(!item?.auto)return item;
    const hasStructuredContent=['risk','signs','action','monitor']
      .every(key=>Array.isArray(item[key])&&item[key].length);
    if(item.autoEdited&&hasStructuredContent&&clean(item.summary)&&clean(item.url)){
      return {...item,source_url:item.source_url||item.url,reviewed:false};
    }
    const rawDetail=clean(detailText),baseSummary=clean(item.summary);
    const sourceSentences=sentences(rawDetail||baseSummary||item.title);
    const summary=/ban tin moi duoc kiem tra|ban tin moi:/i.test(norm(baseSummary))&&rawDetail
      ? clip(sourceSentences.slice(0,3).join(' '),650)
      : clip(baseSummary||sourceSentences.slice(0,3).join(' '),650);
    const allText=`${item.title}. ${summary}. ${rawDetail}`;
    const drugs=inferDrugs(item,allText);
    const risk=pick(sourceSentences,/nguy co|dac biet|tre em|tre so sinh|nguoi cao tuoi|suy than|suy gan|mang thai|tuoi sinh san|lieu cao|keo dai|phoi hop|benh nhan/);
    const signs=pick(sourceSentences,/dau hieu|trieu chung|ha duong|co giat|giam y thuc|chay mau|phat ban|kho tho|phu |dau |yeu co|roi loan|toan thuong|bien co|tu vong/);
    const action=pick(sourceSentences,/khuyen cao| can |^can | nen |^nen |tranh |ngung |dua |danh gia|ra soat|can nhac|thay the|giam lieu|huong dan|han che/);
    const monitor=pick(sourceSentences,/theo doi|kiem tra|xet nghiem|giam sat|dinh luong|ecg|men gan|creatinin|duong huyet|nong do|nhan biet/);
    const safeRisk=risk.length?risk:[`Ưu tiên rà soát người bệnh có yếu tố nguy cơ liên quan đến ${drugs}; đối chiếu chi tiết trong nguồn gốc.`];
    const safeSigns=signs.length?signs:[`Theo dõi biểu hiện bất thường mới xuất hiện trong thời gian sử dụng ${drugs}.`];
    const safeAction=action.length?action:[`Rà soát chỉ định, liều, thời gian điều trị và thuốc dùng đồng thời trước khi tiếp tục ${drugs}.`];
    const safeMonitor=monitor.length?monitor:[`Theo dõi đáp ứng, phản ứng có hại và các xét nghiệm liên quan theo nội dung cảnh báo gốc.`];
    return {...item,
      level:inferLevel(allText),category:inferCategory(allText),system:inferSystem(allText),
      interaction:/tuong tac|interaction/.test(norm(allText)),drugs,summary,
      quick:clip(safeAction[0],260),risk:safeRisk,signs:safeSigns,action:safeAction,monitor:safeMonitor,
      auto:true,autoEdited:true,editorialStatus:'auto-edited',reviewed:false
    };
  }

  window.VPMED_PHARMACOVIGILANCE_AUTO_EDIT=editAlert;
})();
