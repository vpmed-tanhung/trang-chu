(function(){
  'use strict';
  const data=window.VPMED_STOCK_CLINICAL;
  if(!data)return;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const norm=(value)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const format=(value,digits=1)=>Number(value).toLocaleString('vi-VN',{maximumFractionDigits:digits,minimumFractionDigits:Number.isInteger(value)?0:Math.min(1,digits)});
  const sourceLinks=(sources)=>`<div class="stock-source-links">${(sources||[]).map((source)=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('')}</div>`;
  const stockList=(stock)=>`<div class="stock-stock-list">${stock.map((item)=>`<div class="stock-stock-item"><b>${esc(item.name)} — ${esc(item.strength)}</b><small>${esc(item.code)} · ${esc(item.route)} · ${esc(item.active)}</small></div>`).join('')}</div>`;

  function ruleMatchesAge(rule,ageMonths){
    return (rule.minAgeMonths==null||ageMonths>=rule.minAgeMonths)&&(rule.maxAgeMonths==null||ageMonths<=rule.maxAgeMonths);
  }

  function neonatalRuleMatches(rule,pma,pna){
    return (rule.minPmaWeeks==null||pma>=rule.minPmaWeeks)
      &&(rule.maxPmaWeeks==null||pma<=rule.maxPmaWeeks)
      &&(rule.minPnaDays==null||pna>=rule.minPnaDays)
      &&(rule.maxPnaDays==null||pna<=rule.maxPnaDays);
  }

  function ageInMonths(value,unit){
    const factors={day:1/30.4375,week:7/30.4375,month:1,year:12};
    return Number(value)*(factors[unit]||NaN);
  }

  function ageInDays(value,unit){
    const factors={day:1,week:7,month:30.4375,year:365.25};
    return Number(value)*(factors[unit]||NaN);
  }

  function ageLabel(value,unit){
    const labels={day:'ngày',week:'tuần',month:'tháng',year:'năm'};
    return `${format(Number(value),2)} ${labels[unit]||''}`.trim();
  }

  const pediatricClinicalSources={
    nhiAmox:{title:'Bệnh viện Nhi Trung ương — Tỷ lệ phối hợp và chế độ liều cao amoxicillin',url:'https://benhviennhitrunguong.gov.vn/ty-le-phoi-hop-amoxicilin-acid-clavulanic-va-che-do-lieu-cao-amoxicilin-trong-nhi-khoa.html',type:'Chuyên khảo bệnh viện',scope:'Liều tính theo amoxicillin; tiêu chí và lựa chọn tỷ lệ clavulanate khi dùng liều cao.'},
    nhiFluoroquinolone:{title:'Bệnh viện Nhi Trung ương — Sử dụng fluoroquinolon trong Nhi khoa',url:'https://benhviennhitrunguong.gov.vn/su-dung-khang-sinh-fluoroquinolon-trong-nhi-khoa.html',type:'Chuyên khảo bệnh viện',scope:'Giới hạn chỉ định, vai trò ciprofloxacin/levofloxacin và yêu cầu cân nhắc lựa chọn an toàn hơn.'},
    nhiTmpSmx:{title:'Bệnh viện Nhi Trung ương — Sử dụng trimethoprim/sulfamethoxazole trên trẻ em',url:'https://benhviennhitrunguong.gov.vn/su-dung-trimethoprim-sulfamethoxazole-tren-tre-em.html',type:'Chuyên khảo bệnh viện',scope:'Chỉ định theo bệnh cảnh; liều được quy đổi theo thành phần trimethoprim.'},
    nhiMetronidazole:{title:'Bệnh viện Nhi Trung ương — Metronidazole ở trẻ nhũ nhi',url:'https://benhviennhitrunguong.gov.vn/tuong-quan-phoi-nhiem-thuoc-dap-ung-lam-sang-va-do-an-toan-cua-metronidazol-o-tre-nhu-nhi.html',type:'Bằng chứng ứng dụng',scope:'Dữ liệu phơi nhiễm, đáp ứng và an toàn trong nhiễm khuẩn trong ổ bụng nặng ở trẻ nhũ nhi.'},
    nhiPseudomonas:{title:'Bệnh viện Nhi Trung ương — Điều trị Pseudomonas aeruginosa đa kháng ở trẻ em',url:'https://benhviennhitrunguong.gov.vn/tong-quan-ve-dieu-tri-pseudomonas-aeruginosa-da-khang-tren-tre-em.html',type:'Chuyên khảo bệnh viện',scope:'Lựa chọn thuốc theo kháng sinh đồ, kiểu kháng và độc tính; không phải nguồn cho con số liều.'},
    nhiCap:{title:'Bệnh viện Nhi Trung ương — Phác đồ viêm phổi cộng đồng do vi khuẩn',url:'https://benhviennhitrunguong.gov.vn/phac-do-dieu-tri-viem-phoi-do-vi-khuan-cong-dong.html',type:'Phác đồ bệnh viện',scope:'Bệnh cảnh viêm phổi Nhi khoa; quyết định ban hành năm 2012, cần đối chiếu hướng dẫn hiện hành và kháng sinh đồ.'},
    nhiMeningitis:{title:'Bệnh viện Nhi Trung ương — Kháng sinh ban đầu trong viêm màng não mủ',url:'https://benhviennhitrunguong.gov.vn/su-dung-khang-sinh-ban-dau-trong-viem-mang-nao-mu.html',type:'Phác đồ bệnh viện',scope:'Xác định bệnh cảnh viêm màng não mủ và vai trò vancomycin; không dùng để suy diễn liều meropenem.'},
    bv108Neonatal:{title:'Bệnh viện TWQĐ 108 — Kháng sinh trong điều trị nhiễm khuẩn sơ sinh',url:'https://www.benhvien108.vn/duoc-lam-sang/khang-sinh-trong-dieu-tri-nhiem-khuan-so-sinh.htm',type:'Hướng dẫn bệnh viện',scope:'Bệnh cảnh và phối hợp kháng sinh ở trẻ sơ sinh; bảng UCSF vẫn là nguồn tính liều PMA/PNA trực tiếp.'},
    bv108Aminoglycoside:{title:'Bệnh viện TWQĐ 108 — Tối ưu hóa chế độ liều aminoglycoside',url:'https://benhvien108.vn/duoc-lam-sang/toi-uu-hoa-che-do-lieu-khang-sinh-aminoglycoside.htm',type:'Dược lâm sàng bệnh viện',scope:'PK/PD, độc tính và yêu cầu theo dõi nồng độ aminoglycoside.'},
    bv108VanTdm:{title:'Tạp chí Y Dược lâm sàng 108 — TDM vancomycin Bayesian ở bệnh nhi tại BVĐK Xanh Pôn',url:'https://tcydls108.benhvien108.vn/index.php/YDLS/article/view/1996',type:'Bằng chứng ứng dụng',scope:'Trang bài báo/abstract trực tiếp: nghiên cứu tiến cứu trên bệnh nhi, đánh giá đạt đích AUC24/MIC 400–600.'},
    bv108VanAuc:{title:'Tạp chí Y Dược lâm sàng 108 — TDM vancomycin AUC/Bayes tại BV Sản Nhi Nghệ An',url:'https://tcydls108.benhvien108.vn/index.php/YDLS/article/view/2292',type:'Bằng chứng ứng dụng',scope:'Trang bài báo/abstract trực tiếp: nghiên cứu tiến cứu trên bệnh nhi và kết quả đạt đích sau hiệu chỉnh liều.'}
  };

  const pediatricClinicalProfiles={
    'amoxicillin-clavulanate':{
      default:{indication:'Nhiễm khuẩn do vi khuẩn nhạy cảm với amoxicillin/clavulanate; ưu tiên chế phẩm Nhi phù hợp.',criteria:'Xác nhận tuổi, chức năng thận, khả năng uống và hàm lượng amoxicillin/clavulanate của đúng chế phẩm.',sources:['nhiAmox']},
      rules:{
        'under-3m':{indication:'Nhiễm khuẩn nhạy cảm cần điều trị đường uống ở trẻ từ 1 đến dưới 3 tháng.',criteria:'Chỉ dùng khi có hỗn dịch Nhi phù hợp; kho hiện chỉ có viên 500/125 mg nên không tự bẻ hoặc nghiền để quy đổi.'},
        standard:{indication:'Liều thường quy cho nhiễm khuẩn nhạy cảm, gồm bệnh cảnh hô hấp khi amoxicillin/clavulanate là lựa chọn phù hợp.',criteria:'Không có tiêu chí dùng liều cao phế cầu; đánh giá dị ứng beta-lactam và kháng sinh đồ nếu có.',sources:['nhiCap','nhiAmox']},
        'high-dose':{indication:'Liều cao amoxicillin cho bệnh cảnh cần tăng phơi nhiễm với phế cầu giảm nhạy cảm, như một số ca viêm tai giữa, viêm xoang hoặc viêm phổi.',criteria:'Trẻ ≥3 tháng, chức năng thận bình thường và có tiêu chí lâm sàng dùng liều cao; ưu tiên tỷ lệ amoxicillin:clavulanate 14:1 hoặc 16:1 để hạn chế clavulanate.',sources:['nhiAmox']}
      }
    },
    'ampicillin-sulbactam':{default:{indication:'Nhiễm khuẩn do vi khuẩn nhạy cảm, gồm một số trường hợp viêm phổi cộng đồng Nhi khoa cần đường tĩnh mạch.',criteria:'Chọn khi phổ beta-lactam/beta-lactamase inhibitor phù hợp; lấy bệnh phẩm và xuống thang theo kháng sinh đồ.',sources:['nhiCap']}},
    ceftazidime:{default:{indication:'Nhiễm khuẩn Gram âm nặng do chủng nhạy cảm, đặc biệt khi cần phủ Pseudomonas aeruginosa.',criteria:'Ưu tiên theo kháng sinh đồ, vị trí nhiễm và dịch tễ kháng thuốc; không đồng nhất ceftazidime đơn chất với ceftazidime/avibactam.',sources:['nhiPseudomonas']}},
    ciprofloxacin:{default:{indication:'Nhiễm Pseudomonas hoặc Gram âm nhạy cảm khi cần fluoroquinolone đường uống/tĩnh mạch.',criteria:'Chỉ dùng cho nhiễm khuẩn cụ thể hoặc nặng khi không có lựa chọn an toàn, hiệu quả hơn; chọn đúng đường dùng và kháng sinh đồ.',sources:['nhiFluoroquinolone','nhiPseudomonas']}},
    gentamicin:{
      default:{indication:'Điều trị nhiễm Gram âm nặng nhạy cảm hoặc phối hợp trong nhiễm khuẩn sơ sinh theo phác đồ.',criteria:'Đánh giá chức năng thận, nguy cơ độc tai/độc thận và thực hiện TDM; không dùng liều hiệp đồng thay liều điều trị.',sources:['bv108Aminoglycoside','bv108Neonatal']},
      rules:{synergy:{indication:'Liều hiệp đồng trong phác đồ phối hợp đã xác định, ví dụ một số nhiễm cầu khuẩn hoặc viêm nội tâm mạc.',criteria:'Chỉ chọn khi phác đồ chuyên khoa ghi rõ mục tiêu hiệp đồng; bắt buộc TDM và giám sát độc tính.',sources:['bv108Aminoglycoside']}}
    },
    levofloxacin:{default:{indication:'Nhiễm khuẩn hô hấp hoặc Pseudomonas chọn lọc khi fluoroquinolone là lựa chọn phù hợp.',criteria:'Không dùng thường quy ở trẻ em; chỉ cân nhắc khi nhiễm khuẩn nặng/cụ thể, dị ứng hoặc thất bại lựa chọn an toàn hơn và có căn cứ vi sinh.',sources:['nhiFluoroquinolone','nhiPseudomonas']}},
    meropenem:{
      default:{indication:'Nhiễm khuẩn nặng ngoài hệ thần kinh trung ương do Gram âm/ESBL hoặc Pseudomonas nhạy cảm khi cần carbapenem.',criteria:'Đánh giá nguy cơ đa kháng, lấy bệnh phẩm trước điều trị và xuống thang sớm theo kháng sinh đồ.',sources:['nhiPseudomonas']},
      rules:{meningitis:{indication:'Viêm màng não hoặc nhiễm khuẩn hệ thần kinh trung ương đã được chẩn đoán, khi meropenem phù hợp với căn nguyên/kháng sinh đồ.',criteria:'Chỉ dùng mức 40 mg/kg/lần cho bệnh cảnh hệ thần kinh trung ương; hội chẩn chuyên khoa và kiểm soát liều tối đa.',sources:[]}}
    },
    metronidazole:{
      default:{indication:'Nhiễm khuẩn kỵ khí, đặc biệt nhiễm khuẩn trong ổ bụng cần metronidazole.',criteria:'Xác nhận ổ nhiễm, kiểm soát nguồn nhiễm và phối hợp thuốc phủ vi khuẩn hiếu khí khi cần.',sources:['nhiMetronidazole','bv108Neonatal']},
      rules:{appendicitis:{indication:'Viêm ruột thừa biến chứng/nhiễm khuẩn trong ổ bụng trong phác đồ có metronidazole.',criteria:'Chỉ dùng lịch một lần/ngày khi phác đồ ngoại Nhi của đơn vị quy định; không áp dụng cho mọi nhiễm khuẩn kỵ khí.',sources:['nhiMetronidazole']}}
    },
    'piperacillin-tazobactam':{default:{indication:'Nhiễm khuẩn bệnh viện hoặc nhiễm khuẩn nặng do Gram âm/Pseudomonas nhạy cảm; một số nhiễm khuẩn trong ổ bụng phức tạp.',criteria:'Dùng theo kháng sinh đồ và dịch tễ tại đơn vị; không chọn nếu chủng kháng hoặc thuộc kiểu khó điều trị.',sources:['nhiPseudomonas','bv108Neonatal']}},
    'trimethoprim-sulfamethoxazole':{
      default:{indication:'Nhiễm khuẩn nhạy cảm ở trẻ đủ tuổi; liều luôn tính theo thành phần trimethoprim.',criteria:'Không dùng cho trẻ dưới giới hạn tuổi/PMA của nguồn; kiểm tra chức năng thận, kali và tương tác thuốc.',sources:['nhiTmpSmx']},
      rules:{
        'mild-moderate':{indication:'Nhiễm khuẩn tiết niệu nhạy cảm khi tỷ lệ kháng tại địa phương chấp nhận được; hoặc lựa chọn thay thế trong một số nhiễm hô hấp nhẹ-vừa khi dị ứng beta-lactam.',criteria:'Trẻ ≥2 tháng; ưu tiên kháng sinh đồ, không dùng kinh nghiệm cho UTI nếu tỷ lệ kháng địa phương >20%.',sources:['nhiTmpSmx']},
        serious:{indication:'Viêm phổi do Pneumocystis jirovecii hoặc nhiễm khuẩn nặng do tác nhân nhạy cảm.',criteria:'Xác nhận bệnh cảnh nặng/PCP; ca PCP nặng thường cần đường tĩnh mạch, trong khi kho đang liệt kê chế phẩm uống.',sources:['nhiTmpSmx']}
      }
    },
    vancomycin:{default:{indication:'Nhiễm Gram dương xâm lấn nghi hoặc xác định, đặc biệt MRSA; phối hợp theo phác đồ ở nhiễm khuẩn sơ sinh muộn hoặc viêm màng não mủ.',criteria:'Chỉ là liều khởi đầu; bắt buộc hiệu chỉnh theo chức năng thận và TDM/AUC, lấy nồng độ đúng thời điểm.',sources:['nhiMeningitis','bv108Neonatal','bv108VanTdm','bv108VanAuc']}}
  };
  const conditionalRuleIds=new Set(['high-dose','meningitis','appendicitis','synergy','serious']);

  function uniqueSources(sources){
    const seen=new Set();
    return (sources||[]).filter((source)=>{
      if(!source||!source.url||seen.has(source.url))return false;
      seen.add(source.url);
      return true;
    });
  }

  function verifiedProductSources(drug){
    const codes=new Set(drug.stockCodes||[]);
    return uniqueSources((data.injectables||[])
      .filter((item)=>codes.has(item.code)&&item.status==='verified_exact')
      .flatMap((item)=>(item.sources||[]).filter((source)=>{
        const scope=String(source.scope||'');
        return !/khác SĐK/i.test(scope)&&/(hoàn nguyên|pha loãng|dung môi|ổn định|cách dùng|thời gian truyền)/i.test(scope);
      })));
  }

  function productSourceType(source){
    if(/hướng dẫn sử dụng|HDSD/i.test(`${source.title||''} ${source.scope||''}`))return 'HDSD đúng SĐK';
    if(/nhà sản xuất/i.test(`${source.organization||''} ${source.scope||''}`))return 'Nhà sản xuất';
    return 'Thông tin đúng chế phẩm';
  }

  function ruleKind(rule){
    if(conditionalRuleIds.has(rule.id)||conditionalRuleIds.has(rule.regimen))return 'conditional';
    if(rule.id==='enteral'||rule.id==='iv')return 'route';
    return 'baseline';
  }

  function ruleLabel(drug,rule,mode){
    if(rule.label)return rule.label;
    if(mode==='neonate'&&rule.regimen){
      const regimen=(drug.neonatalRegimens||[]).find((item)=>item.id===rule.regimen);
      if(regimen)return regimen.label;
    }
    return mode==='neonate'?'Liều Sơ sinh theo PMA và tuổi sau sinh':'Liều theo tuổi';
  }

  function eligibleRules(drug,context){
    const rules=context.mode==='neonate'
      ?drug.neonatalRules.filter((rule)=>neonatalRuleMatches(rule,context.pma,context.days))
      :drug.childRules.filter((rule)=>ruleMatchesAge(rule,context.months));
    const priority={baseline:0,route:1,conditional:2};
    return rules.map((rule,index)=>({rule,index,kind:ruleKind(rule)}))
      .sort((a,b)=>priority[a.kind]-priority[b.kind]||a.index-b.index);
  }

  function clinicalProfile(drug,rule,mode){
    const group=pediatricClinicalProfiles[drug.id]||{};
    const base=group.default||{
      indication:'Nhiễm khuẩn do tác nhân nhạy cảm khi kháng sinh này phù hợp với chẩn đoán và quy trình của đơn vị.',
      criteria:'Xác nhận bệnh cảnh, dị ứng, chức năng gan–thận, bệnh phẩm và kháng sinh đồ trước khi áp dụng.',
      sources:[]
    };
    const key=rule.id||rule.regimen||'';
    const specific=(group.rules||{})[key]||{};
    const sourceIds=[...(specific.sources||base.sources||[])];
    if(mode==='neonate'&&!sourceIds.includes('bv108Neonatal'))sourceIds.push('bv108Neonatal');
    return {...base,...specific,sources:sourceIds.map((id)=>pediatricClinicalSources[id]).filter(Boolean)};
  }

  function evidenceCards(sources){
    const list=uniqueSources(sources);
    if(!list.length)return '';
    return `<div class="stock-evidence-list">${list.map((source)=>`<article class="stock-evidence-card"><span>${esc(source.type||'Nguồn đối chiếu')}</span><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>${source.scope?`<small>${esc(source.scope)}</small>`:''}</article>`).join('')}</div>`;
  }

  function initPediatric(){
    const root=document.getElementById('stockPediatricTool');
    if(!root)return;
    root.innerHTML=`
      <div class="dose-layout stock-pediatric-layout">
        <aside class="form-card stock-pediatric-form">
          <h3>Thông tin bệnh nhi</h3>
          <label>Mã bệnh nhân trên HIS <small class="optional-note">chỉ nhập mã HIS, không nhập họ tên người bệnh</small><input id="stockPedPatientCode" type="text" maxlength="30" autocomplete="off" spellcheck="false" placeholder="Nhập mã bệnh nhân" required></label>
          <div class="form-row stock-ped-patient-row">
            <label>Cân nặng (kg)<input id="stockPedWeight" type="number" min="0.2" max="200" step="0.01" inputmode="decimal" placeholder="8,5"></label>
            <label id="stockPedAgeWrap">Tuổi sau sinh
              <span class="stock-age-control">
                <input id="stockPedAgeValue" type="number" min="0" step="0.1" inputmode="decimal" placeholder="3">
                <select id="stockPedAgeUnit" aria-label="Đơn vị tuổi">
                  <option value="day">Ngày</option><option value="week">Tuần</option><option value="month" selected>Tháng</option><option value="year">Năm</option>
                </select>
              </span>
              <small class="stock-field-hint" id="stockPedAgeMode">Nhập tuổi để tự xác định bảng liều.</small>
            </label>
          </div>
          <label id="stockPedPmaWrap" hidden>PMA (tuần) — chỉ nhập nếu trẻ còn &lt;45 tuần
            <input id="stockPedPma" type="number" min="20" max="44" step="1" inputmode="numeric" placeholder="34">
            <small class="stock-field-hint">Trẻ dưới 1 tháng cần PMA để tra bảng liều Sơ sinh.</small>
          </label>
          <label>Kháng sinh<select id="stockPedDrug"></select></label>
          <p class="stock-ped-form-note">Hệ thống tự lọc bảng Nhi khoa/Sơ sinh và hiển thị bệnh cảnh áp dụng cho từng mức liều; không yêu cầu người dùng chọn “chỉ định/phác đồ”.</p>
          <button class="btn btn-primary full" id="stockPedCalculate" type="button">Tính liều và gợi ý theo nguồn</button>
          <button class="btn btn-soft full stock-ped-reset" id="stockPedReset" type="button">Reset / nhập ca mới</button>
        </aside>
        <div class="dose-main">
          <div id="stockPedResult" class="empty-state"><div>🧪</div><b>Chưa có kết quả</b><span>Nhập mã HIS, tuổi, cân nặng và chọn kháng sinh để bắt đầu.</span></div>
          <section class="section-card history-card stock-pediatric-history">
            <div class="section-heading"><div><span class="kicker">Lịch sử tra cứu</span><h2>Lịch sử tra cứu dùng chung</h2><small id="stockPedAuditStatus">Chỉ quản trị viên được xóa.</small></div><div class="heading-actions"><button class="btn btn-soft" id="stockPedRefreshHist" type="button">Làm mới</button><button class="btn btn-soft" id="stockPedExportHist" type="button" hidden>Xuất CSV</button><button class="btn btn-danger-soft" id="stockPedClearHist" type="button" hidden>Xóa toàn bộ</button></div></div>
            <div class="table-wrap"><table><thead><tr><th>Thời gian</th><th>Mã bệnh nhân</th><th>Khoa/phòng sử dụng</th><th>Tuổi/PMA · cân nặng</th><th>Thuốc</th><th>Gợi ý</th><th id="stockPedHistoryManageHeading" hidden>Quản lý</th></tr></thead><tbody id="stockPedHistoryBody"><tr><td colspan="7" style="text-align:center">Đang tải lịch sử dùng chung…</td></tr></tbody></table></div>
            <p class="history-privacy-note">Chỉ nhập mã người bệnh trên HIS; không nhập họ tên người bệnh vào ô mã.</p>
          </section>
        </div>
      </div>
      <p class="stock-audit-line stock-audit-compact stock-ped-footnote">Bộ lọc: ${data.meta.counts.pediatricActives} hoạt chất · ${data.meta.counts.pediatricStockProducts} thuốc trong kho · Rà soát ${esc(data.meta.generatedAt.split('-').reverse().join('/'))}. Con số liều lấy từ bảng UCSF; căn cứ bệnh cảnh chỉ trỏ đến trang có nội dung chuyên môn đọc trực tiếp.</p>`;

    const drugSelect=root.querySelector('#stockPedDrug');
    const ageInput=root.querySelector('#stockPedAgeValue');
    const ageUnit=root.querySelector('#stockPedAgeUnit');
    const ageMode=root.querySelector('#stockPedAgeMode');
    const pmaWrap=root.querySelector('#stockPedPmaWrap');
    const pmaInput=root.querySelector('#stockPedPma');
    const weightInput=root.querySelector('#stockPedWeight');
    const patientCodeInput=root.querySelector('#stockPedPatientCode');
    const result=root.querySelector('#stockPedResult');
    let auditAuth=null;
    let historyRows=[];
    let historyLoading=false;
    const historyModule='Tính liều kháng sinh Nhi';

    function ageContext(){
      const ageRaw=String(ageInput.value||'').trim();
      const pmaRaw=String(pmaInput.value||'').trim();
      const ageValue=ageRaw===''?NaN:Number(ageRaw);
      const months=ageInMonths(ageValue,ageUnit.value);
      const days=ageInDays(ageValue,ageUnit.value);
      const pma=pmaRaw===''?NaN:Number(pmaRaw);
      const hasValidAge=Number.isFinite(ageValue)&&ageValue>=0&&Number.isFinite(months);
      const hasValidPma=Number.isInteger(pma)&&pma>=20&&pma<=44;
      let mode=null;
      if(hasValidPma)mode='neonate';
      else if(hasValidAge)mode=months<1?'neonate':'child';
      return {ageRaw,pmaRaw,ageValue,months,days,pma,hasValidAge,hasValidPma,mode};
    }

    function availableDrugs(context){
      if(context.mode==='neonate')return data.pediatric.filter((drug)=>drug.neonatalRules.length);
      if(context.mode==='child')return data.pediatric.filter((drug)=>drug.childRules.some((rule)=>ruleMatchesAge(rule,context.months)));
      return data.pediatric.filter((drug)=>drug.childRules.length||drug.neonatalRules.length);
    }

    function renderAgeMode(context){
      pmaWrap.hidden=!(context.mode==='neonate'||context.pmaRaw!=='');
      if(!context.hasValidAge){
        ageMode.textContent='Nhập tuổi để tự xác định bảng liều.';
      }else if(context.mode==='neonate'){
        ageMode.textContent=context.hasValidPma?'Đã chọn bảng Sơ sinh (<45 tuần PMA).':'Bảng Sơ sinh — cần nhập thêm PMA.';
      }else{
        ageMode.textContent='Đã chọn bảng Nhi khoa (từ 1 tháng tuổi).';
      }
    }

    function renderDrugs(){
      const context=ageContext();
      const previous=drugSelect.value;
      const drugs=availableDrugs(context);
      drugSelect.innerHTML=drugs.map((drug)=>`<option value="${esc(drug.id)}">${esc(drug.name)} (${drug.stock.length} thuốc kho)</option>`).join('');
      if(drugs.some((drug)=>drug.id===previous))drugSelect.value=previous;
      renderAgeMode(context);
    }

    function showError(message){
      result.className='result-card clinical-result-flow stock-pediatric-result';
      result.innerHTML=`<div class="stock-result-panel"><div class="stock-note-box warning"><strong>Chưa thể tính:</strong> ${esc(message)}</div></div>`;
    }

    function calculate(){
      const drug=data.pediatric.find((item)=>item.id===drugSelect.value);
      const weight=Number(weightInput.value);
      const contextData=ageContext();
      const patientCode=String(patientCodeInput.value||'').trim();
      if(!patientCode)return showError('Hãy nhập mã bệnh nhân trên HIS; không nhập họ tên người bệnh.');
      if(patientCode.length>30)return showError('Mã bệnh nhân tối đa 30 ký tự.');
      if(!drug)return showError('Không tìm thấy kháng sinh đã chọn.');
      if(!Number.isFinite(weight)||weight<0.2||weight>200)return showError('Cân nặng phải trong khoảng 0,2–200 kg.');
      if(!contextData.hasValidAge)return showError('Hãy nhập tuổi sau sinh từ 0 trở lên.');
      if(contextData.months>216)return showError('Công cụ chỉ áp dụng đến 18 tuổi.');
      if(contextData.pmaRaw!==''&&!contextData.hasValidPma)return showError('PMA chỉ nhập số tuần nguyên từ 20 đến 44; từ 45 tuần trở lên hãy để trống.');
      let context='';
      if(contextData.mode==='child'){
        context=ageLabel(contextData.ageValue,ageUnit.value);
      }else{
        if(!contextData.hasValidPma)return showError('Trẻ dưới 1 tháng hoặc còn dưới 45 tuần PMA cần nhập PMA để tra bảng liều Sơ sinh.');
        context=`${ageLabel(contextData.ageValue,ageUnit.value)} sau sinh · PMA ${contextData.pma} tuần`;
      }
      const matches=eligibleRules(drug,contextData);
      if(!matches.length)return showError('Không có quy tắc liều phù hợp với tuổi/PMA đã nhập trong nguồn tính liều.');
      const loading=contextData.mode==='neonate'&&drug.neonatalLoadingDoseMgKg?weight*drug.neonatalLoadingDoseMgKg:null;
      const kindLabels={baseline:'Liều nền theo tuổi',route:'Theo đường dùng',conditional:'Lựa chọn đặc biệt'};
      const auditSummaries=[];
      const cards=matches.map(({rule,kind})=>{
        const rawDose=weight*rule.doseMgKg;
        const finalDose=rule.maxMg?Math.min(rawDose,rule.maxMg):rawDose;
        const capped=rule.maxMg&&rawDose>rule.maxMg;
        const clinical=clinicalProfile(drug,rule,contextData.mode);
        const note=[rule.note,kind==='conditional'?'Chỉ áp dụng khi bệnh cảnh đã được xác định và phù hợp với hướng dẫn điều trị của đơn vị.':''].filter(Boolean).join(' ');
        auditSummaries.push(`${ruleLabel(drug,rule,contextData.mode)}: ${format(finalDose,1)} mg mỗi ${rule.intervalHours} giờ`);
        return `<article class="stock-regimen-card ${kind}">
          <div class="stock-regimen-top"><span class="stock-regimen-tag">${esc(kindLabels[kind])}</span><h3>${esc(ruleLabel(drug,rule,contextData.mode))}</h3></div>
          <div class="stock-regimen-main"><div><span>Liều mỗi lần</span><strong>${format(finalDose,1)} mg</strong></div><b>Mỗi ${rule.intervalHours} giờ</b></div>
          <div class="stock-regimen-meta"><span>${format(rule.doseMgKg,1)} mg/kg/lần</span><span>${esc(rule.route||'Theo nguồn/nhãn')}</span>${rule.maxMg?`<span>Tối đa ${format(rule.maxMg,0)} mg/lần</span>`:''}</div>
          ${capped?`<p class="stock-regimen-warning">Đã giới hạn từ ${format(rawDose,1)} mg xuống liều tối đa của nguồn.</p>`:''}
          ${note?`<p>${esc(note)}</p>`:''}
          <div class="stock-clinical-fit"><p><b>Bệnh cảnh áp dụng:</b> ${esc(clinical.indication)}</p><p><b>Chỉ chuyển sang mức này khi:</b> ${esc(clinical.criteria)}</p></div>
          ${evidenceCards(clinical.sources)}
        </article>`;
      }).join('');
      const productSources=verifiedProductSources(drug);
      const autoSummary=matches.length>1
        ?`Đã lọc theo tuổi/PMA: còn ${matches.length} lựa chọn hợp lệ trong nguồn. Các lựa chọn đặc biệt được tách riêng.`
        :'Đã tự lọc đúng bảng liều theo tuổi/PMA.';
      result.className='result-card clinical-result-flow stock-pediatric-result';
      result.innerHTML=`
        <div class="stock-result-panel">
          <div class="stock-result-heading"><div><h2>${esc(drug.name)}</h2><p>${esc(drug.basis)} · ${esc(context)} · ${format(weight,2)} kg</p></div><span>Đã tự lọc</span></div>
          <div class="stock-auto-summary">${esc(autoSummary)}</div>
          <div class="stock-regimen-list">${cards}</div>
          ${loading!=null?`<div class="stock-note-box"><strong>Liều nạp:</strong> ${format(loading,1)} mg một lần; ${esc(drug.neonatalNote||'')}</div>`:''}
          ${drug.contraindicationNote?`<div class="stock-note-box warning"><strong>Lưu ý giới hạn tuổi:</strong> ${esc(drug.contraindicationNote)}</div>`:''}
          ${contextData.mode==='neonate'&&drug.neonatalNote&&loading==null?`<div class="stock-note-box"><strong>Lưu ý Sơ sinh:</strong> ${esc(drug.neonatalNote)}</div>`:''}
          <div class="stock-note-box warning"><strong>Không tự suy ra bệnh cảnh:</strong> tuổi và cân nặng không xác định được viêm màng não, nhiễm khuẩn nặng, liều cao hay mục tiêu hiệp đồng. Chỉ dùng lựa chọn đặc biệt khi chẩn đoán và quy trình điều trị phù hợp.</div>
          <div><h3>Thuốc tương ứng đang có trong kho</h3>${stockList(drug.stock)}</div>
          ${productSources.length?`<div><h3>Nguồn đúng chế phẩm có nội dung đọc trực tiếp</h3>${evidenceCards(productSources.map((source)=>({...source,type:productSourceType(source),scope:source.scope||'Đối chiếu đúng chế phẩm và số đăng ký.'})))}</div>`:''}
          <div><h3>Nguồn tính liều trực tiếp</h3>${evidenceCards(drug.sources.map((source)=>({...source,type:'Nguồn tính liều',scope:'Nguồn của con số mg/kg/lần, khoảng cách liều và liều tối đa hiển thị.'})))}</div>
          <p class="stock-audit-line">Chưa hiệu chỉnh theo suy thận, lọc máu, béo phì, bỏng, ECMO hoặc nồng độ thuốc. Vancomycin/aminoglycoside bắt buộc TDM theo quy trình đơn vị.</p>
        </div>`;
      logPediatricLookup({patientCode,drugName:drug.name,context:`${context} · ${format(weight,2)} kg`,summary:auditSummaries.join(' | ').slice(0,1500)});
      window.VPMED_PLATFORM?.calculationComplete({feature:'pediatric-dose',drug:drug.name,weight});
    }

    function resetCase(){
      patientCodeInput.value='';weightInput.value='';ageInput.value='';ageUnit.value='month';pmaInput.value='';
      result.className='empty-state';
      result.innerHTML='<div>🧪</div><b>Chưa có kết quả</b><span>Nhập mã HIS, tuổi, cân nặng và chọn kháng sinh để bắt đầu.</span>';
      renderDrugs();patientCodeInput.focus&&patientCodeInput.focus();
    }

    function isAdmin(){return !!(auditAuth&&auditAuth.profile&&auditAuth.profile.role==='admin');}
    function setAuditStatus(message,tone){const node=root.querySelector('#stockPedAuditStatus');if(node){node.textContent=message;if(node.dataset)node.dataset.tone=tone||'';}}
    function auditError(error){
      if(!error)return 'Lỗi Supabase không xác định';
      const code=String(error.code||'');
      const message=String(error.message||error.details||'Lỗi Supabase').replace(/\s+/g,' ').trim();
      if(code==='23514')return 'database chưa bổ sung loại nhật ký Nhi khoa';
      if(code==='42501'||/row-level security|permission denied/i.test(message))return 'Supabase đang chặn quyền ghi/đọc';
      return `${code?`${code}: `:''}${message.slice(0,220)}`;
    }
    function historyColspan(){return isAdmin()?7:6;}
    function formatDate(value){try{return new Date(value).toLocaleString('vi-VN');}catch(error){return String(value||'—');}}
    function renderHistory(){
      const body=root.querySelector('#stockPedHistoryBody');if(!body)return;
      if(!historyRows.length){body.innerHTML=`<tr><td colspan="${historyColspan()}" style="text-align:center">Chưa có lịch sử tra cứu Nhi khoa dùng chung.</td></tr>`;return;}
      body.innerHTML=historyRows.map((item)=>`<tr><td>${esc(formatDate(item.created_at))}</td><td><b>${esc(item.patient_code||'—')}</b></td><td><b>${esc(item.department||'Chưa cập nhật')}</b></td><td>${esc(item.renal_band||'—')}</td><td>${esc(item.drug_name||'—')}</td><td>${esc(item.result_summary||'—')}</td>${isAdmin()?`<td><button type="button" class="history-delete-row" data-stock-ped-delete="${esc(item.id)}">Xóa</button></td>`:''}</tr>`).join('');
      if(isAdmin())body.querySelectorAll('[data-stock-ped-delete]').forEach((button)=>button.addEventListener('click',()=>deleteHistoryRow(button.dataset.stockPedDelete,button)));
    }
    async function refreshPediatricHistory(options){
      if(!auditAuth||historyLoading)return;historyLoading=true;
      if(!(options&&options.silent))setAuditStatus('Đang tải lịch sử tra cứu Nhi khoa dùng chung…');
      const response=await auditAuth.client.from('renal_lookup_logs').select('*').eq('module_name',historyModule).order('created_at',{ascending:false}).limit(500);
      historyLoading=false;
      if(response.error){historyRows=[];renderHistory();setAuditStatus(`Chưa tải được lịch sử: ${auditError(response.error)}.`,'error');return;}
      historyRows=response.data||[];renderHistory();setAuditStatus(`${historyRows.length} lượt tra cứu Nhi khoa.`,'success');
    }
    async function insertPediatricLog(payload,lookupType){
      return auditAuth.client.from('renal_lookup_logs').insert({user_id:auditAuth.user.id,patient_code:payload.patientCode,lookup_type:lookupType,module_name:historyModule,drug_name:payload.drugName,crcl_ml_min:null,egfr_ml_min_1_73m2:null,renal_band:payload.context,result_summary:payload.summary});
    }
    async function logPediatricLookup(payload){
      if(!auditAuth)return;
      setAuditStatus('Đang lưu lượt tra cứu Nhi khoa…');
      let response=await insertPediatricLog(payload,'pediatric_antibiotic_dose');
      if(response.error&&(String(response.error.code)==='23514'||/lookup_type/i.test(String(response.error.message||''))))response=await insertPediatricLog(payload,'antibiotic_renal_dose');
      if(response.error){setAuditStatus(`Kết quả đã tính nhưng chưa lưu được: ${auditError(response.error)}. Admin chạy supabase/sua_loi_ghi_nhat_ky.sql.`,'error');return;}
      await refreshPediatricHistory();
    }
    async function deleteHistoryRow(id,button){
      if(!isAdmin()||!window.confirm('Xóa lượt tra cứu Nhi khoa này?'))return;button.disabled=true;
      const response=await auditAuth.client.from('renal_lookup_logs').delete().eq('id',Number(id)).eq('module_name',historyModule).select('id');button.disabled=false;
      if(response.error){setAuditStatus(`Không xóa được lịch sử: ${auditError(response.error)}.`,'error');return;}await refreshPediatricHistory();
    }
    async function clearPediatricHistory(){
      if(!isAdmin()||!window.confirm('Xóa TOÀN BỘ lịch sử tra cứu Nhi khoa? Lịch sử công cụ suy thận không bị xóa.'))return;
      if(window.prompt('Nhập XOA LICH SU NHI để xác nhận:')!=='XOA LICH SU NHI')return;
      const button=root.querySelector('#stockPedClearHist');button.disabled=true;
      const response=await auditAuth.client.from('renal_lookup_logs').delete().eq('module_name',historyModule).select('id');button.disabled=false;
      if(response.error){setAuditStatus(`Không xóa được lịch sử: ${auditError(response.error)}.`,'error');return;}await refreshPediatricHistory();
    }
    function csvCell(value){return `"${String(value??'').replace(/"/g,'""')}"`;}
    function exportPediatricHistory(){
      if(!isAdmin()||!historyRows.length){window.alert('Chưa có lịch sử Nhi khoa để xuất.');return;}
      const rows=[['Thời gian','Mã bệnh nhân','Khoa/phòng sử dụng','Tuổi/PMA và cân nặng','Thuốc','Gợi ý'],...historyRows.map((item)=>[formatDate(item.created_at),item.patient_code||'',item.department||'',item.renal_band||'',item.drug_name||'',item.result_summary||''])];
      const anchor=document.createElement('a');anchor.href=URL.createObjectURL(new Blob([`\ufeff${rows.map((row)=>row.map(csvCell).join(',')).join('\n')}`],{type:'text/csv;charset=utf-8'}));anchor.download='lich-su-tra-cuu-lieu-khang-sinh-nhi.csv';anchor.click();URL.revokeObjectURL(anchor.href);
    }
    function bindPediatricAudit(detail){
      auditAuth=detail||window.VPMED_AUTH;if(!auditAuth)return;
      const exportButton=root.querySelector('#stockPedExportHist');const clearButton=root.querySelector('#stockPedClearHist');const manageHeading=root.querySelector('#stockPedHistoryManageHeading');
      exportButton.hidden=!isAdmin();clearButton.hidden=!isAdmin();manageHeading.hidden=!isAdmin();
      root.querySelector('#stockPedRefreshHist').onclick=()=>refreshPediatricHistory();exportButton.onclick=exportPediatricHistory;clearButton.onclick=clearPediatricHistory;
      refreshPediatricHistory();
    }

    ageInput.addEventListener('input',renderDrugs);
    ageUnit.addEventListener('change',renderDrugs);
    pmaInput.addEventListener('input',renderDrugs);
    root.querySelector('#stockPedCalculate').addEventListener('click',calculate);
    root.querySelector('#stockPedReset').addEventListener('click',resetCase);
    [patientCodeInput,weightInput,ageInput,pmaInput].forEach((input)=>input.addEventListener('keydown',(event)=>{if(event.key==='Enter')calculate();}));
    if(typeof window.addEventListener==='function')window.addEventListener('vpmed-auth-ready',(event)=>bindPediatricAudit(event.detail));
    if(window.VPMED_AUTH)bindPediatricAudit(window.VPMED_AUTH);
    renderDrugs();
  }

  function initInjectables(){
    const root=document.getElementById('stockInjectableTool');
    if(!root)return;
    const counts=data.meta.counts;
    root.innerHTML=`
      <div class="stock-tool-shell">
        <div class="stock-tool-alert"><strong>Nguyên tắc an toàn:</strong> chỉ các mục “đúng chế phẩm” mới có hướng dẫn chi tiết được phép đối chiếu trực tiếp. Mục “tham chiếu hoạt chất” bắt buộc kiểm tra lại tờ HDSD đúng số đăng ký; mục “chờ duyệt” không được dùng để pha thuốc.</div>
        <section class="stock-tool-card">
          <div class="stock-inject-toolbar">
            <label>Tìm tên thuốc, hoạt chất, mã thuốc<input id="stockInjectQuery" type="search" placeholder="Ví dụ: Meronem, cefotaxime, TD30..."></label>
            <label>Mức kiểm chứng<select id="stockInjectStatus"><option value="sourced">Có nguồn đích</option><option value="verified_exact">Đúng chế phẩm</option><option value="active_reference">Tham chiếu hoạt chất</option><option value="pending">Chờ duyệt nguồn</option><option value="all">Tất cả thuốc tiêm trong kho</option></select></label>
          </div>
          <div class="stock-status-summary">
            <span class="stock-summary-chip">${counts.injectableProducts} thuốc tiêm/truyền</span>
            <span class="stock-summary-chip exact">${counts.injectableExact} đúng chế phẩm</span>
            <span class="stock-summary-chip reference">${counts.injectableActiveReference} tham chiếu hoạt chất</span>
            <span class="stock-summary-chip pending">${counts.injectablePending} chờ duyệt</span>
          </div>
          <div class="stock-inject-layout">
            <div class="stock-inject-list" id="stockInjectList" aria-live="polite"></div>
            <article class="stock-inject-detail" id="stockInjectDetail"><div class="stock-result-empty"><div><span>💉</span><b>Chọn một thuốc</b><p>Thông tin chi tiết và nguồn đích sẽ hiện tại đây.</p></div></div></article>
          </div>
        </section>
        <p class="stock-audit-line">Dữ liệu kho: ${esc(data.meta.inventoryFile)} · Rà soát ${esc(data.meta.generatedAt)}. Danh sách giữ đủ ${counts.injectableProducts} thuốc tiêm/truyền đã lọc; hướng dẫn chưa đủ nguồn không được suy diễn.</p>
      </div>`;
    const list=root.querySelector('#stockInjectList');
    const detail=root.querySelector('#stockInjectDetail');
    const query=root.querySelector('#stockInjectQuery');
    const status=root.querySelector('#stockInjectStatus');
    let selected='';

    function filtered(){
      const q=norm(query.value);
      return data.injectables.filter((item)=>{
        const statusMatch=status.value==='all'||(status.value==='sourced'?item.status!=='pending':item.status===status.value);
        const queryMatch=!q||norm([item.name,item.active,item.code,item.strength,item.route].join(' ')).includes(q);
        return statusMatch&&queryMatch;
      });
    }

    function itemKey(item){return [item.code,item.name,item.strength].join('|');}

    function renderList(){
      const items=filtered();
      if(!items.length){
        list.innerHTML='<div class="stock-list-empty">Không tìm thấy thuốc phù hợp.</div>';
        detail.innerHTML='<div class="stock-result-empty"><div><span>🔎</span><b>Không có kết quả</b><p>Thử đổi từ khóa hoặc mức kiểm chứng.</p></div></div>';
        return;
      }
      if(!items.some((item)=>itemKey(item)===selected))selected=itemKey(items[0]);
      list.innerHTML=items.map((item)=>`<button type="button" class="stock-inject-item ${itemKey(item)===selected?'active':''}" data-key="${esc(itemKey(item))}"><span class="stock-status-badge ${esc(item.status)}">${esc(item.statusLabel)}</span><b>${esc(item.name)} — ${esc(item.strength)}</b><small>${esc(item.active)} · ${esc(item.code)}</small></button>`).join('');
      list.querySelectorAll('.stock-inject-item').forEach((button)=>button.addEventListener('click',()=>{selected=button.dataset.key;renderList();renderDetail(items.find((item)=>itemKey(item)===selected));}));
      renderDetail(items.find((item)=>itemKey(item)===selected));
    }

    function renderDetail(item){
      if(!item)return;
      const meta=`<div class="stock-inject-meta"><span>${esc(item.code)}</span><span>${esc(item.route)}</span><span>${esc(item.strength)}</span>${item.expiries.map((value)=>`<span>HSD ${esc(value)}</span>`).join('')}</div>`;
      if(item.status==='pending'){
        detail.innerHTML=`<span class="stock-status-badge pending">${esc(item.statusLabel)}</span><h2>${esc(item.name)}</h2><p><b>Hoạt chất:</b> ${esc(item.active)}</p>${meta}<div class="stock-pending-panel"><strong>Không có hướng dẫn pha/bảo quản được hiển thị.</strong><br>Chưa tìm thấy trang HTML đích đủ tin cậy và đủ cụ thể cho đúng chế phẩm. Hãy tra cứu theo số đăng ký trên Cục Quản lý Dược hoặc tờ HDSD của đúng lô thuốc, sau đó thẩm định nội bộ trước khi bổ sung.</div>${sourceLinks([data.sources.davLookup])}`;
        return;
      }
      const sections=[
        ['Hoàn nguyên',item.reconstitution],
        ['Pha loãng',item.dilution],
        ['Cách dùng / tốc độ',item.administration],
        ['Bảo quản / ổn định',item.storage],
        ['Tương hợp / tương kỵ',item.compatibility]
      ];
      detail.innerHTML=`
        <span class="stock-status-badge ${esc(item.status)}">${esc(item.statusLabel)}</span>
        <h2>${esc(item.name)}</h2>
        <p><b>Hoạt chất:</b> ${esc(item.active)}</p>
        ${meta}
        ${item.status==='active_reference'?'<div class="stock-note-box warning"><strong>Không phải nguồn đúng chế phẩm:</strong> chỉ dùng để định hướng đối chiếu. Không áp dụng dung môi, nồng độ hay thời gian ổn định nếu chưa kiểm tra tờ HDSD đúng SĐK.</div>':''}
        <div class="stock-detail-grid">${sections.map(([title,content])=>`<section class="stock-detail-section"><h3>${esc(title)}</h3><p>${esc(content)}</p></section>`).join('')}</div>
        <h3>Nguồn đích và phạm vi áp dụng</h3>
        <div class="stock-stock-list">${item.sources.map((source)=>`<div class="stock-source-card"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><small>${esc(source.organization)} · ${esc(source.scope)}</small></div>`).join('')}</div>`;
    }

    query.addEventListener('input',renderList);
    status.addEventListener('change',renderList);
    renderList();
  }

  initPediatric();
})();

