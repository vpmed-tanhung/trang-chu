(function(){
  const MEDS = window.VPMED_INPATIENT_MEDICINES_20260707 || [];
  const ICD = window.VPMED_ICD10_BYT2026 || [];
  const CLIN = window.VPMED_DRUGS || [];
  const VERIFIED = window.VPMED_VERIFIED_DRUG_PROFILES || [];
  const FULL = window.VPMED_FULL_DRUG_PROFILES_305 || [];
  const INFUSION = window.VPMED_INFUSION_GUIDE_20260709 || [];
  const INTER = window.VPMED_INTERACTIONS || [];
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
  const isInjectable = r => /tiem|truyen/.test(norm(r));
  const arr = v => Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);
  const uniq = xs => [...new Set(xs.filter(Boolean))];
  let selectedMed = MEDS[0]?.id || null;

  function canonicalActive(s){
    return norm(String(s || '')
      .replace(/\([^)]*dưới dạng[^)]*\)/gi,' ')
      .replace(/\(dưới dạng[^)]*\)/gi,' ')
      .replace(/dưới dạng.*$/gi,' ')
      .replace(/hydrochloride|hydroclorid|hydroclodrid|sodium|natri|calcium|calci/gi,' '));
  }

  function makeMedText(m){ return [m.name,m.active,m.strength,m.route,m.regNumber,m.code,m.category,m.pack].join(' '); }
  function medFilter(){
    const q = norm($('#icdMedQ')?.value || '');
    const cat = $('#icdMedCat')?.value || '';
    const route = $('#icdMedRoute')?.value || '';
    return MEDS.filter(m => (!cat || m.category===cat) && (!route || m.route===route) && (!q || norm(makeMedText(m)).includes(q))).slice(0,120);
  }
  function fillFilters(){
    const cat = $('#icdMedCat'), route = $('#icdMedRoute');
    if(cat && cat.options.length<2){
      const cats = [...new Set(MEDS.map(m=>m.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
      cat.innerHTML = '<option value="">Tất cả nhóm</option>' + cats.map(x=>`<option>${esc(x)}</option>`).join('');
    }
    if(route && route.options.length<2){
      const routes = [...new Set(MEDS.map(m=>m.route).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
      route.innerHTML = '<option value="">Tất cả đường dùng</option>' + routes.map(x=>`<option>${esc(x)}</option>`).join('');
    }
  }

  function findVerifiedProfile(med){
    const reg = norm(med.regNumber);
    const active = canonicalActive(med.active);
    const name = norm(med.name);
    return VERIFIED.find(p => reg && arr(p.regNumbers).some(x => norm(x) === reg))
      || VERIFIED.find(p => arr(p.brands).some(b => norm(b) === name))
      || VERIFIED.find(p => {
        if(p.brandsOnly) return false;
        const aliases = arr(p.aliases).map(canonicalActive);
        return active && aliases.some(a => a && a === active);
      }) || null;
  }

  function findFullProfile(med){
    const reg = norm(med.regNumber);
    const name = norm(med.name);
    const strength = norm(med.strength || med.concentration);
    const route = norm(med.route);
    const byReg = FULL.filter(p => reg && arr(p.regNumbers).some(x => norm(x) === reg));
    if(byReg.length === 1) return byReg[0];
    if(byReg.length > 1){
      return byReg.find(p => arr(p.brands).some(b => norm(b) === name) && (!strength || norm(p.strength) === strength))
        || byReg.find(p => arr(p.brands).some(b => norm(b) === name))
        || byReg.find(p => (!strength || norm(p.strength) === strength) && (!route || norm(p.productRoute) === route))
        || null;
    }
    return FULL.find(p => arr(p.brands).some(b => norm(b) === name) && (!strength || norm(p.strength) === strength) && (!route || norm(p.productRoute) === route))
      || FULL.find(p => arr(p.brands).some(b => norm(b) === name))
      || null;
  }

  function findBaseProfile(med){
    const ma = canonicalActive(med.active);
    const mn = norm(med.name);
    return CLIN.find(d => {
      const da = canonicalActive(d.active);
      const db = norm(d.brand);
      return (ma && da && ma === da) || (mn && db && mn === db);
    }) || null;
  }

  function findInfusionProfile(med, profile){
    if(!isInjectable(profile?.productRoute || med.route)) return null;
    const activeKeys = uniq([med.active,profile?.active]).map(canonicalActive).filter(Boolean);
    const nameKeys = uniq([med.name,...arr(profile?.brands)]).map(norm).filter(Boolean);
    return INFUSION.find(x => {
      const xa = canonicalActive(x.active);
      return (xa && activeKeys.includes(xa)) || arr(x.brand_names).some(b => nameKeys.includes(norm(b)));
    }) || null;
  }

  function infusionText(x){
    if(!x) return '';
    return [
      arr(x.compatible_solutions).length ? 'Dung môi tương hợp: '+arr(x.compatible_solutions).join(', ') : '',
      x.im ? 'Tiêm bắp: '+x.im : '',
      x.iv_direct ? 'Tiêm tĩnh mạch trực tiếp: '+x.iv_direct : '',
      x.iv_infusion ? 'Truyền tĩnh mạch: '+x.iv_infusion : '',
      x.stability ? 'Ổn định: '+x.stability : '',
      arr(x.warnings).join(' ')
    ].filter(Boolean).join(' | ');
  }

  function findClinicalProfile(med){
    const full = findFullProfile(med);
    const verified = findVerifiedProfile(med);
    const base = findBaseProfile(med);
    if(full){
      const merged = Object.assign({}, verified || {}, base || {}, full, {profileLevel:'Bảng thông tin 305 thuốc – khớp chính xác chế phẩm', verified:true});
      if(!arr(full.icdMappings).length){
        if(arr(verified?.icdMappings).length) merged.icdMappings = verified.icdMappings;
        else if(arr(base?.icdMappings).length) merged.icdMappings = base.icdMappings;
      }
      const inf = findInfusionProfile(med, merged);
      const infText = infusionText(inf);
      const current = arr(full.infusionDetails || full.infusion).join(' | ');
      if(infText && (!current || /chưa cung cấp thông số|đối chiếu tờ hdsd/i.test(current))) merged.infusionDetails=[infText];
      return merged;
    }
    if(verified) return Object.assign({profileLevel:'Đã rà soát theo hoạt chất/SĐK', verified:true}, verified);
    if(base) return Object.assign({profileLevel:'Hồ sơ chuyên môn nội bộ', verified:true}, base);
    return null;
  }

  function ddiMatches(med, profile){
    const keys = uniq([med.active, med.name, profile?.active, profile?.brand, ...(profile?.aliases||[])]).map(norm).filter(x=>x.length>3);
    return INTER.filter(i=>{
      const z = norm([i.name,i.drug1,i.drug2].join(' '));
      return keys.some(k=>z.includes(k));
    }).slice(0,6);
  }

  const CONTROLLED_ICD_MAP = [
    {term:'Viêm phổi', re:/viêm phổi|pneumonia/i, codes:['J18.9']},
    {term:'Viêm xoang cấp', re:/viêm xoang/i, codes:['J01.9']},
    {term:'Viêm tai giữa', re:/viêm tai giữa/i, codes:['H66.9']},
    {term:'Viêm họng/amiđan', re:/viêm họng|amiđan/i, codes:['J02.9','J03.9']},
    {term:'Viêm bàng quang', re:/viêm bàng quang/i, codes:['N30.0','N30.9']},
    {term:'Viêm bể thận', re:/viêm bể thận/i, codes:['N10']},
    {term:'Nhiễm khuẩn tiết niệu', re:/nhiễm khuẩn (đường )?tiết niệu|nhiễm trùng (đường )?tiết niệu/i, codes:['N39.0']},
    {term:'Viêm mô tế bào', re:/viêm mô tế bào/i, codes:['L03.9']},
    {term:'Nhiễm khuẩn da/mô mềm', re:/nhiễm khuẩn da|nhiễm trùng da|da và mô mềm/i, codes:['L08.9']},
    {term:'Nhiễm khuẩn huyết', re:/nhiễm khuẩn huyết|nhiễm trùng huyết/i, codes:['A41.9']},
    {term:'Viêm màng não do vi khuẩn', re:/viêm màng não/i, codes:['G00.9']},
    {term:'Viêm phúc mạc', re:/viêm phúc mạc/i, codes:['K65.9']},
    {term:'Nhiễm khuẩn ổ bụng', re:/nhiễm khuẩn ổ bụng|nhiễm trùng ổ bụng/i, codes:['K65.9']},
    {term:'Viêm đường mật', re:/viêm đường mật/i, codes:['K83.0']},
    {term:'Viêm túi mật', re:/viêm túi mật/i, codes:['K81.0','K81.9']},
    {term:'Viêm vùng chậu', re:/viêm vùng chậu/i, codes:['N73.9']},
    {term:'Viêm xương tủy', re:/viêm (xương )?tủy|viêm tủy xương/i, codes:['M86.9']},
    {term:'Viêm khớp nhiễm khuẩn', re:/viêm khớp nhiễm khuẩn/i, codes:['M00.9']},
    {term:'Viêm nội tâm mạc', re:/viêm nội tâm mạc/i, codes:['I33.0']},
    {term:'Lậu', re:/lậu cầu|bệnh lậu/i, codes:['A54.9']},
    {term:'Herpes/zona', re:/herpes|zona|thủy đậu/i, codes:['B00.9','B02.9','B01.9']},
    {term:'Nhiễm nấm Candida', re:/candida/i, codes:['B37.9']},
    {term:'Nhiễm nấm Aspergillus', re:/aspergillus/i, codes:['B44.9']},
    {term:'Tăng huyết áp nguyên phát', re:/tăng huyết áp/i, codes:['I10']},
    {term:'Đái tháo đường typ 1', re:/đái tháo đường typ 1/i, codes:['E10.9']},
    {term:'Đái tháo đường typ 2', re:/đái tháo đường typ 2/i, codes:['E11.9']},
    {term:'Nhiễm toan ceton do đái tháo đường', re:/DKA|nhiễm toan ceton/i, codes:['E10.1','E11.1']},
    {term:'Loãng xương', re:/loãng xương/i, codes:['M81.0']},
    {term:'Bệnh Paget xương', re:/paget/i, codes:['M88.9']},
    {term:'Đau thắt ngực', re:/đau thắt ngực/i, codes:['I20.9']},
    {term:'Suy tim', re:/suy tim/i, codes:['I50.9']},
    {term:'Rung nhĩ', re:/rung nhĩ/i, codes:['I48.9']},
    {term:'Nhịp chậm', re:/nhịp chậm/i, codes:['R00.1']},
    {term:'Nhồi máu cơ tim cấp', re:/nhồi máu cơ tim/i, codes:['I21.9']},
    {term:'Đột quỵ thiếu máu não', re:/đột quỵ thiếu máu/i, codes:['I63.9']},
    {term:'Rối loạn lipid máu', re:/tăng cholesterol|rối loạn lipid|tăng triglycerid/i, codes:['E78.5']},
    {term:'Viêm mũi dị ứng', re:/viêm mũi dị ứng/i, codes:['J30.4']},
    {term:'Mày đay', re:/mày đay/i, codes:['L50.9']},
    {term:'Hen phế quản', re:/hen|hen phế quản/i, codes:['J45.9']},
    {term:'Bệnh phổi tắc nghẽn mạn tính', re:/COPD|phổi tắc nghẽn mạn/i, codes:['J44.9']},
    {term:'Tiêu chảy/viêm dạ dày–ruột', re:/tiêu chảy cấp|viêm dạ dày.*ruột/i, codes:['A09']},
    {term:'Táo bón', re:/táo bón/i, codes:['K59.0']},
    {term:'Suy giáp', re:/suy giáp/i, codes:['E03.9']},
    {term:'Tăng sản lành tính tuyến tiền liệt', re:/tăng sản lành tính tuyến tiền liệt/i, codes:['N40']},
    {term:'Động kinh', re:/động kinh/i, codes:['G40.9']},
    {term:'Rối loạn lo âu', re:/lo âu/i, codes:['F41.9']},
    {term:'Tâm thần phân liệt', re:/tâm thần phân liệt/i, codes:['F20.9']},
    {term:'Đau, không xác định', re:/giảm đau cấp|đau cấp và mạn|đau sau phẫu thuật/i, codes:['R52.9']},
    {term:'Hạ calci máu', re:/hạ calci/i, codes:['E83.5']},
    {term:'Tăng kali máu', re:/tăng kali/i, codes:['E87.5']},
    {term:'Sốc', re:/sốc kháng trị|sốc giãn mạch|sốc tim/i, codes:['R57.9']},
    {term:'Phản vệ', re:/phản vệ/i, codes:['T78.2']},
    {term:'Mất nước/giảm thể tích', re:/mất nước|giảm thể tích tuần hoàn/i, codes:['E86']}
  ];

  function deriveIcdMappings(profile){
    if(!profile || !Array.isArray(profile.icdMappings)) return [];
    return profile.icdMappings
      .map(x=>({term:x.term,codes:uniq(arr(x.codes))}))
      .filter(x=>x.term && x.codes.length)
      .slice(0,10);
  }

  function icdByCode(code){ return ICD.find(x=>x.code===code || x.codeNoDot===String(code).replace('.','')); }
  function icdText(x){ return norm([x.code,x.codeNoDot,x.name,x.nameEn,x.block,x.group3,x.chapter].join(' ')); }
  function searchIcd(terms, limit=36){
    const list = Array.isArray(terms) ? terms : [terms];
    const qs = list.map(norm).filter(x=>x.length>1);
    if(!qs.length) return [];
    const scored=[];
    for(const x of ICD){
      const txt = icdText(x);
      let score=0;
      for(const q of qs){
        if(txt.includes(q)) score += 22 + Math.min(10,q.length/3);
        const parts=q.split(' ').filter(p=>p.length>2);
        const matched=parts.filter(p=>txt.includes(p)).length;
        if(parts.length && matched>=Math.min(2,parts.length)) score += matched*2;
      }
      if(score>0){
        if(/^[A-Z][0-9]{2}\.[0-9]/.test(x.code)) score += 4;
        if(x.flags && x.flags.length) score -= 3;
        scored.push({x,score});
      }
    }
    return scored.sort((a,b)=>b.score-a.score || a.x.code.localeCompare(b.x.code)).slice(0,limit).map(s=>s.x);
  }

  function renderIcdRows(rows, empty){
    if(!rows.length) return `<div class="alert">${esc(empty || 'Không tìm thấy ICD phù hợp.')}</div>`;
    return `<div class="icd-code-grid">${rows.map(x=>{
      const flag = (x.flags||[]).length ? `<div class="icd-flags">${x.flags.map(f=>`<span>${esc(f)}</span>`).join('')}</div>` : '';
      return `<article class="icd-code-card"><div><b>${esc(x.code)}</b><strong>${esc(x.name)}</strong></div><small>${esc(x.block)}${x.group3?' · '+esc(x.group3):''}</small>${x.guidance?`<p>${esc(x.guidance)}</p>`:''}${flag}</article>`;
    }).join('')}</div>`;
  }

  function renderIcdSuggestion(profile){
    const mappings = deriveIcdMappings(profile);
    if(!mappings.length){
      return `<section class="icd-suggest-compact"><div class="icd-suggest-title"><h3>ICD-10 gợi ý theo thuốc/chỉ định</h3></div><div class="alert">Chưa có mã ICD được xác minh cho hồ sơ thuốc này.</div></section>`;
    }
    const rows=[];
    mappings.forEach(m=>m.codes.forEach(c=>{const x=icdByCode(c); if(x && !rows.some(r=>r.code===x.code)) rows.push(x);}));
    return `<section class="icd-suggest-compact">
      <div class="icd-suggest-title"><h3>ICD-10 gợi ý theo thuốc/chỉ định</h3><small>Chỉ chọn mã phù hợp chẩn đoán thực tế trong bệnh án.</small></div>
      <div class="icd-term-code-list">${mappings.map(m=>`<span class="icd-term-code"><strong>${esc(m.term)}</strong><em>${m.codes.map(c=>esc(c)).join(' · ')}</em></span>`).join('')}</div>
      <details class="icd-code-details"><summary>Xem chi tiết ${rows.length} mã ICD-10</summary><div class="icd-compact-list">${rows.map(x=>`<div class="icd-compact-row"><b>${esc(x.code)}</b><span>${esc(x.name)}</span>${(x.flags||[]).length?`<small>${esc(x.flags.join(' · '))}</small>`:''}</div>`).join('')}</div></details>
    </section>`;
  }

  function profileSources(profile){
    const src = arr(profile?.sources);
    if(src.length) return src;
    if(profile?.clinicalSourceNote) return [{title:profile.clinicalSourceNote,url:''}];
    return [];
  }

  function infusionLabelFromText(text){
    const value = String(text || '').trim();
    if(/^dung môi tương hợp\s*:/i.test(value) || /^tương hợp\s*:/i.test(value)) return ['Dung môi tương hợp', value.replace(/^[^:]+:\s*/,'')];
    if(/^hoàn nguyên\s*:/i.test(value)) return ['Hoàn nguyên', value.replace(/^[^:]+:\s*/,'')];
    if(/^pha loãng\s*:/i.test(value)) return ['Pha loãng', value.replace(/^[^:]+:\s*/,'')];
    if(/^tiêm bắp\s*:/i.test(value)) return ['Tiêm bắp', value.replace(/^[^:]+:\s*/,'')];
    if(/^tiêm (?:tĩnh mạch|tm)(?: trực tiếp)?\s*:/i.test(value)) return ['Tiêm tĩnh mạch trực tiếp', value.replace(/^[^:]+:\s*/,'')];
    if(/^truyền (?:tĩnh mạch|tm)\s*:/i.test(value)) return ['Truyền tĩnh mạch', value.replace(/^[^:]+:\s*/,'')];
    if(/^(?:tốc độ|thời gian) truyền\s*:/i.test(value)) return ['Tốc độ / thời gian truyền', value.replace(/^[^:]+:\s*/,'')];
    if(/^ổn định\s*:/i.test(value) || /^bảo quản\s*:/i.test(value)) return ['Ổn định sau pha', value.replace(/^[^:]+:\s*/,'')];
    if(/^cảnh báo\s*:/i.test(value) || /^lưu ý\s*:/i.test(value)) return ['Lưu ý an toàn', value.replace(/^[^:]+:\s*/,'')];

    if(/hoàn nguyên/i.test(value)) return ['Hoàn nguyên', value];
    if(/pha loãng|dung môi/i.test(value)) return ['Pha loãng / dung môi', value];
    if(/truyền|phút|giờ|mg\/kg\/h|mg\/phút/i.test(value)) return ['Cách dùng / tốc độ truyền', value];
    if(/ổn định|bảo quản|nhiệt độ|dùng ngay/i.test(value)) return ['Ổn định sau pha', value];
    if(/không |tránh |cảnh báo|thận trọng|theo dõi|nguy cơ|tuyệt đối/i.test(value)) return ['Lưu ý an toàn', value];
    return ['Hướng dẫn', value];
  }

  function infusionRows(profile){
    if(!profile) return [];
    const rows=[];
    const seen=new Set();
    const add=(label,text)=>{
      const clean=String(text || '').replace(/\s+/g,' ').trim();
      if(!clean) return;
      const key=norm(label+' '+clean);
      if(seen.has(key)) return;
      seen.add(key);
      rows.push({label,text:clean});
    };

    const structured=profile.infusionStructured;
    if(structured){
      add('Hoàn nguyên', structured.reconstitution);
      add('Pha loãng / dung môi', structured.dilution);
      add('Cách dùng / tốc độ truyền', structured.administration);
      add('Đường truyền / tương hợp', structured.line);
      add('Ổn định sau pha', structured.stability);
      arr(structured.warnings).forEach(x=>add('Lưu ý an toàn',x));
    }

    arr(profile.infusionDetails || profile.infusion).forEach(block=>{
      String(block || '').split(/\s*\|\s*|\r?\n+/).map(x=>x.trim()).filter(Boolean).forEach(part=>{
        const [label,text]=infusionLabelFromText(part);
        add(label,text);
      });
    });
    return rows;
  }

  function infusionTone(label,text){
    const value=norm(label+' '+text);
    if(/luu y an toan|tuyet doi|khong tiem|khong truyen|tranh|nguy co|canh bao/.test(value)) return 'warning';
    if(/toc do|thoi gian|truyen tinh mach|cach dung/.test(value)) return 'primary';
    if(/on dinh|bao quan/.test(value)) return 'stability';
    return '';
  }

  function renderInfusionPanel(profile, injectable, missing){
    if(!injectable){
      return '<div class="infusion-na"><b>Không áp dụng</b><span>Chế phẩm này không dùng theo đường tiêm hoặc truyền.</span></div>';
    }
    const rows=infusionRows(profile);
    if(!rows.length){
      return `<div class="alert">${esc(missing)}</div>`;
    }
    return `<div class="infusion-readable">${rows.map(row=>`<div class="infusion-readable-row ${infusionTone(row.label,row.text)}"><span>${esc(row.label)}</span><p>${esc(row.text)}</p></div>`).join('')}</div>`;
  }

  function clinicalHtml(med, profile){
    const injectable = isInjectable(profile?.productRoute || med.route);
    const missing = 'Chưa có dữ liệu được xác minh theo đúng hoạt chất/SĐK; hệ thống không hiển thị nội dung suy đoán.';
    const dose = profile?.standard || missing;
    const use = profile?.route || (profile ? (profile.productRoute || med.route) : missing);
    const indications = arr(profile?.indicationsDetailed || profile?.indications);
    const contraind = arr(profile?.contraindications || profile?.contra);
    const ddi = profile ? ddiMatches(med, profile) : [];
    const interactionsText = arr(profile?.interactions || profile?.interactionsText || profile?.clinicalDDI);
    const noList = `<p>${esc(missing)}</p>`;
    return `${!profile?`<div class="icd-unverified-note"><b>Chưa có hồ sơ chuyên môn đã xác minh.</b> Các nội dung gán tự động theo nhóm thuốc đã được loại bỏ để tránh trùng lặp hoặc sai chỉ định.</div>`:''}<div class="icd-clinical-grid">
      <section><h3>Liều dùng</h3><p>${esc(dose)}</p></section>
      <section><h3>Cách dùng / đường dùng</h3><p>${esc(use)}</p></section>
      <section><h3>Chỉ định</h3>${indications.length ? `<ul>${indications.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : noList}</section>
      <section><h3>Chống chỉ định</h3>${contraind.length ? `<ul>${contraind.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : noList}</section>
      <section class="icd-infusion-section"><h3>Tốc độ truyền / pha truyền</h3>${renderInfusionPanel(profile, injectable, missing)}</section>
      <section><h3>Tương tác thuốc</h3>${(interactionsText.length || ddi.length) ? `${interactionsText.length ? `<ul>${interactionsText.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : ''}${ddi.length ? `<div class="icd-ddi-official"><b>Cặp chống chỉ định/cảnh báo trong dữ liệu Bộ Y tế:</b>${ddi.map(i=>`<div class="icd-ddi"><b>${esc(i.name || ((i.drug1||'')+' + '+(i.drug2||'')))}</b><p>${esc(i.management || i.consequence || 'Cần kiểm tra xử trí theo nguồn.')}</p></div>`).join('')}</div>` : ''}` : noList}</section>
    </div>`;
  }

  function renderSources(profile){
    const sources = profileSources(profile);
    if(!sources.length) return '';
    return `<details class="icd-source-compact"><summary>Nguồn chuyên môn đã đối chiếu</summary><ul>${sources.map(s=>`<li>${s.url?`<a target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.title||s.url)}</a>`:esc(s.title||'Nguồn chuyên môn')}</li>`).join('')}</ul>${profile?.scope?`<p class="icd-source-scope"><b>Phạm vi áp dụng:</b> ${esc(profile.scope)}</p>`:''}</details>`;
  }

  function renderMedList(){
    const box=$('#icdMedList'); if(!box) return;
    const f=medFilter();
    $('#icdMedCount') && ($('#icdMedCount').textContent = `${MEDS.length} thuốc/khoản mục, hiển thị ${f.length}`);
    box.innerHTML = f.map(m=>`<button class="icd-med-item ${m.id===selectedMed?'active':''}" data-mid="${m.id}"><b>${esc(m.name)}</b><span>${esc(m.active || 'Chưa có hoạt chất')}</span><small>${esc([m.strength,m.route,m.regNumber].filter(Boolean).join(' · '))}</small></button>`).join('') || '<div class="alert">Không tìm thấy thuốc phù hợp.</div>';
    $$('.icd-med-item').forEach(b=>b.addEventListener('click',()=>{selectedMed=+b.dataset.mid;renderMedList();renderMedProfile();}));
  }

  function renderMedProfile(){
    const box=$('#icdMedProfile'); if(!box) return;
    const med = MEDS.find(m=>m.id===selectedMed) || medFilter()[0] || MEDS[0];
    if(!med){ box.innerHTML='<div class="alert">Chưa có dữ liệu thuốc.</div>'; return; }
    selectedMed = med.id;
    const profile = findClinicalProfile(med);
    const displayActive = profile?.active || med.active || 'Chưa có';
    const displayRoute = profile?.productRoute || med.route || 'Chưa có';
    box.innerHTML = `<div class="icd-profile-head"><span class="kicker">Danh mục thuốc nội trú · ${esc(med.category)}</span><h2>${esc(med.name)}</h2><p><b>Hoạt chất:</b> ${esc(displayActive)} &nbsp; <b>Hàm lượng:</b> ${esc(profile?.strength || med.strength || med.concentration || 'Chưa có')}</p><div class="icd-meta"><span>SĐK: <b>${esc(med.regNumber || arr(profile?.regNumbers)[0] || 'Chưa có')}</b></span><span>Đường dùng: <b>${esc(displayRoute)}</b></span></div></div>
    ${profile?.qualityNote?`<details class="icd-quality-note"><summary>Ghi chú kiểm soát dữ liệu</summary><p>${esc(profile.qualityNote)}</p></details>`:''}
    ${clinicalHtml(med, profile)}
    ${renderSources(profile)}
    ${renderIcdSuggestion(profile)}`;
  }

  function renderDirectSearch(){
    const q=$('#icdDirectQ')?.value || '';
    const rows = norm(q).length>1 ? searchIcd(q, 80) : [];
    const box=$('#icdDirectResults'); if(!box) return;
    box.innerHTML = norm(q).length>1 ? renderIcdRows(rows, 'Không có mã ICD phù hợp với từ khóa này.') : '<div class="alert">Nhập chẩn đoán, bệnh lý hoặc mã ICD để tìm trực tiếp trong ICD-10 BYT 2026.</div>';
  }

  function init(){
    if(!$('#view-icd10-bhyt')) return;
    fillFilters(); renderMedList(); renderMedProfile(); renderDirectSearch();
    ['#icdMedQ','#icdMedCat','#icdMedRoute'].forEach(sel=>$(sel)?.addEventListener('input',()=>{const f=medFilter(); if(f.length && !f.some(m=>m.id===selectedMed)) selectedMed=f[0].id; renderMedList(); renderMedProfile();}));
    $('#icdMedCat')?.addEventListener('change',()=>{$('#icdMedQ').dispatchEvent(new Event('input'))});
    $('#icdMedRoute')?.addEventListener('change',()=>{$('#icdMedQ').dispatchEvent(new Event('input'))});
    $('#icdDirectQ')?.addEventListener('input', renderDirectSearch);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
