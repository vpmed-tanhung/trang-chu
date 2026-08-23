(() => {
  'use strict';

  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const norm=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
  const clip=(value,limit=230)=>{const text=clean(value);if(text.length<=limit)return text;const cut=text.slice(0,limit-1);return `${cut.slice(0,Math.max(cut.lastIndexOf(' '),120)).replace(/[,;:]$/,'')}…`};
  const unique=(items,limit=4)=>[...new Set(items.map(clean).filter(Boolean))].slice(0,limit);
  const allSentences=value=>unique(clean(value).split(/(?<=[.!?…])\s+(?=[A-ZÀ-ỸĐ0-9"'“(]|$)/).map(item=>item.replace(/^[-•]\s*/,'')),40);
  const sentences=value=>allSentences(value).map(x=>clip(x)).slice(0,4);
  const pick=(items,pattern)=>unique(items.filter(item=>pattern.test(norm(item))));
  const summaryScore=(sentence,index,total,title='')=>{
    const value=` ${norm(sentence)} `;
    let score=0;
    const signals=[
      [10,/ ket luan | canh bao | chong chi dinh | thuoc gia /],
      [8,/ nguy co | moi lien quan | co the gay | lien quan den /],
      [7,/ tinh den | tong so | ghi nhan | bao cao | truong hop /],
      [2,/ khuyen cao | khong su dung | can ngung | nen ngung | nen tranh /],
      [5,/ tu vong | nhap vien | nghiem trong | hiem gap | rat hiem /]
    ];
    signals.forEach(([weight,pattern])=>{if(pattern.test(value))score+=weight});
    if(/ tinh den nay /.test(value))score+=15;
    if(/ tai thoi diem ra soat | sau khi hoan tat danh gia /.test(value))score+=8;
    if(/\b\d+(?:[.,]\d+)?\s*(?:%|ca|trường hợp|mg|ngày|tuần|tháng|năm)\b/i.test(sentence))score+=4;
    const ignored=new Set(['nguy','canh','bao','lien','quan','dung','thuoc']);
    const titleTerms=new Set(norm(title).split(/\s+/).filter(word=>word.length>=4&&!ignored.has(word)));
    const sentenceTerms=new Set(norm(sentence).split(/\s+/));
    score+=Math.min(6,[...titleTerms].filter(word=>sentenceTerms.has(word)).length);
    if(/ la thuoc | duoc chi dinh | thong tin chung /.test(value))score-=5;
    if(/^(?:khuyen cao|who khuyen cao|pmda khuyen cao)/.test(value.trim()))score-=12;
    if(sentence.length>280)score-=8;
    if(sentence.length>420)score-=4;
    if(total>1)score+=Math.round(index*2/(total-1));
    return score;
  };
  const overlap=(left,right)=>{
    const a=new Set(norm(left).split(/\s+/).filter(Boolean));
    const b=new Set(norm(right).split(/\s+/).filter(Boolean));
    if(!a.size||!b.size)return 0;
    return [...a].filter(word=>b.has(word)).length/Math.min(a.size,b.size);
  };
  const concise=(value,title='')=>{
    const items=allSentences(value).filter(item=>item.length>=35);
    if(!items.length)return clip(value,420);
    const indexed=items.map((item,index)=>({item,index}));
    const short=indexed.filter(entry=>entry.item.length<=300);
    const pool=short.length>=2?short:indexed;
    const ranked=pool.map(entry=>({...entry,score:summaryScore(entry.item,entry.index,items.length,title)}))
      .sort((a,b)=>b.score-a.score||b.index-a.index);
    const selected=[];
    let selectedLength=0;
    for(const entry of ranked){
      const item=clip(entry.item,300);
      if(selected.some(existing=>overlap(item,existing.item)>=.68))continue;
      const added=item.length+(selected.length?1:0);
      if(selected.length&&selectedLength+added>420)continue;
      selected.push({item,index:entry.index});
      selectedLength+=added;
      if(selected.length===2)break;
    }
    return clip(selected.sort((a,b)=>a.index-b.index).map(entry=>entry.item).join(' '),420);
  };

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
      return {...item,summary:concise(item.summary,item.title),quick:clip(item.quick,280),source_url:item.source_url||item.url,reviewed:false};
    }
    const rawDetail=clean(detailText),baseSummary=clean(item.summary);
    const sourceSentences=sentences(rawDetail||baseSummary||item.title);
    const summary=/ban tin moi duoc kiem tra|ban tin moi:/i.test(norm(baseSummary))&&rawDetail
      ? concise(rawDetail,item.title)
      : concise(baseSummary||sourceSentences.join(' '),item.title);
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
