(function () {
  'use strict';

  const MODULE_ID = 'antibiotic-consultation';
  const SOURCE_5631 = 'sources/QD-5631-QD-BYT-quan-ly-su-dung-khang-sinh.pdf';
  const SOURCE_2115 = 'https://benhvienhatrung.vn/wp-content/uploads/2023/05/Qd2115.pdf';
  const SOURCE_21 = 'https://datafiles.chinhphu.vn/cpp/files/vbpq/2013/08/tt-21_01.pdf';
  const SOURCE_43_STATUS = 'https://vbpl.vn/boyte/Pages/vbpq-thuoctinh.aspx?ItemID=47035';
  const SOURCE_2147 = 'sources/QD-2147-QD-BYT-Huong-dan-viem-phoi-cong-dong-2026.pdf';
  const SOURCE_3429 = 'sources/QD-3429-QD-BYT-huong-dan-nhiem-nam-xam-lan.pdf';
  const SOURCE_3651 = 'https://bvdkbaclieu.gov.vn/upload/1000079/20250111/481_Quyet_dinh-3651-QD-BYT_a2efcaf93f.pdf';
  const SOURCE_1530 = 'https://kcb.vn/upload/2005611/20230421/QD_2023_1530_Quyet_dinh_ban_hanh_tai_lieu_chuyen_mon__Huong_dan_chan_doan_va_dieu_tri_Loet_ban_chan_do_dai_thao_duong__25013.pdf';
  const SOURCE_DAV = 'https://dichvucong.dav.gov.vn/congbothuoc/index';

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const norm = value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const allHospitalRanks = 'Hạng đặc biệt, hạng I, hạng II và các hạng thấp hơn';
  const iv = ['iv'];
  const ivOrOral = ['iv', 'oral'];
  const injectable = ['iv', 'im'];
  const priorityCatalog = [
    { id: 'ceftolozane-tazobactam', row: 1, name: 'Ceftolozan/tazobactam', aliases: ['ceftolozan tazobactam', 'ceftolozane tazobactam', 'tazobactam ceftolozan', 'tazobactam ceftolozane'], category: 'antibacterial', route: 'Tiêm/truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'tigecycline', row: 2, name: 'Tigecyclin', aliases: ['tigecyclin', 'tigecycline'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'colistin', row: 3, name: 'Colistin', aliases: ['colistin', 'colistimethat', 'colistimethate'], category: 'antibacterial', route: 'Truyền tĩnh mạch/khí dung/tiêm nội tủy', routes: ['iv', 'inhaled', 'intrathecal'], scope: allHospitalRanks },
    { id: 'fosfomycin-iv', row: 4, name: 'Fosfomycin đường tĩnh mạch', aliases: ['fosfomycin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'linezolid', row: 5, name: 'Linezolid', aliases: ['linezolid'], category: 'antibacterial', route: 'Truyền tĩnh mạch/uống', routes: ivOrOral, scope: allHospitalRanks },
    { id: 'amphotericin-b-lipid-complex', row: 6, name: 'Amphotericin B phức hợp lipid', aliases: ['amphotericin b phuc hop lipid', 'amphotericin b lipid complex'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'caspofungin', row: 7, name: 'Caspofungin', aliases: ['caspofungin'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'micafungin', row: 8, name: 'Micafungin', aliases: ['micafungin'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'voriconazole', row: 9, name: 'Voriconazol', aliases: ['voriconazol', 'voriconazole'], category: 'antifungal', route: 'Truyền tĩnh mạch/uống', routes: ivOrOral, scope: allHospitalRanks },
    { id: 'ceftazidime-avibactam', row: 10, name: 'Ceftazidim/avibactam', aliases: ['ceftazidim avibactam', 'ceftazidime avibactam', 'avibactam ceftazidim', 'avibactam ceftazidime'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'ceftobiprole', row: 10, name: 'Ceftobiprol', aliases: ['ceftobiprol', 'ceftobiprole', 'ceftobiprol medocaril', 'ceftobiprole medocaril'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'cefiderocol', row: 10, name: 'Cefiderocol', aliases: ['cefiderocol'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'dalbavancin', row: 10, name: 'Dalbavancin', aliases: ['dalbavancin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'quinupristin-dalfopristin', row: 10, name: 'Quinupristin/dalfopristin', aliases: ['quinupristin dalfopristin', 'dalfopristin quinupristin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'eravacycline', row: 10, name: 'Eravacyclin', aliases: ['eravacyclin', 'eravacycline'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'omadacycline', row: 10, name: 'Omadacyclin', aliases: ['omadacyclin', 'omadacycline'], category: 'antibacterial', route: 'Truyền tĩnh mạch/uống', routes: ivOrOral, scope: allHospitalRanks },
    { id: 'oritavancin', row: 10, name: 'Oritavancin', aliases: ['oritavancin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'plazomicin', row: 10, name: 'Plazomicin', aliases: ['plazomicin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'tedizolid', row: 10, name: 'Tedizolid', aliases: ['tedizolid', 'tedizolid phosphat'], category: 'antibacterial', route: 'Truyền tĩnh mạch/uống', routes: ivOrOral, scope: allHospitalRanks },
    { id: 'telavancin', row: 10, name: 'Telavancin', aliases: ['telavancin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'anidulafungin', row: 10, name: 'Anidulafungin', aliases: ['anidulafungin', 'anidulafundin'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'isavuconazole', row: 10, name: 'Isavuconazol', aliases: ['isavuconazol', 'isavuconazole', 'isavuconazonium'], category: 'antifungal', route: 'Truyền tĩnh mạch/uống', routes: ivOrOral, scope: allHospitalRanks },
    { id: 'liposomal-amphotericin-b', row: 10, name: 'Amphotericin B dạng liposom', aliases: ['amphotericin b dang liposom', 'amphotericin b liposom', 'amphotericin b liposomal', 'liposomal amphotericin b'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'imipenem', row: 11, name: 'Imipenem (kể cả phối hợp cilastatin)', aliases: ['imipenem', 'imipenem cilastatin', 'cilastatin imipenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'meropenem', row: 11, name: 'Meropenem', aliases: ['meropenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'doripenem', row: 11, name: 'Doripenem', aliases: ['doripenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'ertapenem', row: 12, name: 'Ertapenem', aliases: ['ertapenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: 'Hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'vancomycin', row: 13, name: 'Vancomycin đường tĩnh mạch', aliases: ['vancomycin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'teicoplanin', row: 14, name: 'Teicoplanin', aliases: ['teicoplanin'], category: 'antibacterial', route: 'Tiêm/truyền tĩnh mạch hoặc tiêm bắp', routes: injectable, scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'amphotericin-b-deoxycholate', row: 15, name: 'Amphotericin B deoxycholat', aliases: ['amphotericin b deoxycholat', 'amphotericin b deoxycholate'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'aciclovir-iv', row: 16, name: 'Aciclovir đường tĩnh mạch', aliases: ['aciclovir', 'acyclovir'], category: 'antiviral', route: 'Truyền tĩnh mạch', scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'valganciclovir', row: 17, name: 'Valganciclovir', aliases: ['valganciclovir'], category: 'antiviral', route: 'Uống', routes: ['oral'], scope: allHospitalRanks },
    { id: 'posaconazole', row: 18, name: 'Posaconazol', aliases: ['posaconazol', 'posaconazole'], category: 'antifungal', route: 'Uống', routes: ['oral'], scope: allHospitalRanks }
  ];

  const monitoringRules = [
    { label: 'Aminoglycosid', row: 1, routes: injectable, aliases: ['amikacin', 'gentamicin', 'tobramycin', 'netilmicin', 'neltimicin'] },
    { label: 'Fluoroquinolon', row: 2, routes: ivOrOral, aliases: ['ciprofloxacin', 'levofloxacin', 'lomefloxacin', 'moxifloxacin', 'norfloxacin', 'ofloxacin', 'pefloxacin', 'sparfloxacin'] }
  ];

  const cap = {
    url: SOURCE_2147 + '#page=40',
    label: 'QĐ 2147/QĐ-BYT (2026), Chương IV'
  };
  const capMrsa = {
    ...cap,
    text: 'Viêm phổi cộng đồng nặng ở người lớn: đối chiếu nguy cơ MRSA và kết quả vi sinh.'
  };
  const capGramNegative = {
    ...cap,
    text: 'Viêm phổi cộng đồng nặng ở người lớn: đối chiếu nguy cơ vi khuẩn Gram âm kháng thuốc và kháng sinh đồ.'
  };
  const fungi = {
    url: SOURCE_3429 + '#page=51',
    label: 'QĐ 3429/QĐ-BYT (2021), Chương 4',
    text: 'Nhiễm nấm xâm lấn: tra theo tác nhân, vị trí nhiễm và dạng bào chế.'
  };
  const clinicalReferences = {
    colistin: {
      url: SOURCE_1530,
      label: 'QĐ 1530/QĐ-BYT (2023)',
      text: 'Nhiễm trùng bàn chân đái tháo đường: đối chiếu mức độ nhiễm trùng, nguy cơ vi khuẩn kháng thuốc và kháng sinh đồ.'
    },
    'fosfomycin-iv': {
      url: SOURCE_DAV,
      label: 'Tờ hướng dẫn sử dụng được phê duyệt',
      text: 'Tra chế phẩm tĩnh mạch theo số đăng ký để xác minh chỉ định và hướng dẫn sử dụng ghi trên nhãn.'
    },
    linezolid: capMrsa,
    vancomycin: capMrsa,
    teicoplanin: capMrsa,
    imipenem: capGramNegative,
    meropenem: capGramNegative,
    doripenem: capGramNegative,
    ertapenem: {
      ...cap,
      text: 'Viêm phổi cộng đồng nặng ở người lớn: tra mục vi khuẩn Gram âm đường ruột. Ertapenem không có hoạt tính trên P. aeruginosa.'
    },
    'amphotericin-b-lipid-complex': fungi,
    'amphotericin-b-deoxycholate': fungi,
    'liposomal-amphotericin-b': fungi,
    caspofungin: fungi,
    micafungin: fungi,
    anidulafungin: fungi,
    voriconazole: fungi,
    isavuconazole: fungi,
    posaconazole: fungi
  };

  function routeTypes(route) {
    const labels = String(route || '').split(/[,/;+]/).map(norm);
    return labels.flatMap(label => {
      if (/^(tiem noi tuy|tiem tuy song)\b/.test(label)) return ['intrathecal'];
      if (/^khi dung\b/.test(label)) return ['inhaled'];
      if (/^(tiem bap|im)\b/.test(label)) return ['im'];
      if (/^(uong|oral|po)\b/.test(label)) return ['oral'];
      if (/^(tiem truyen|tiem tinh mach|tiem tm|truyen|iv)\b/.test(label)) return ['iv'];
      // Danh mục bệnh viện dùng nhãn chung “Tiêm” cho một số chế phẩm tĩnh mạch.
      if (label === 'tiem') return ['iv'];
      return [];
    });
  }

  function matchesRule(drug, rule) {
    const active = norm(drug.active).replace(/\b(hydrochloride|hydroclorid|hydroclorua|natri|sodium|sulfat|sulfate|acetat|acetate)\b/g, '').replace(/ +/g, ' ').trim();
    return rule.aliases.some(alias => active === alias) &&
      routeTypes(drug.route).some(route => (rule.routes || iv).includes(route));
  }

  function classifyMonitoringDrug(drug) {
    const rule = monitoringRules.find(item => matchesRule(drug, item));
    return rule ? { ...drug, consultationRule: rule } : null;
  }

  function openView(name) {
    if (typeof window.showView === 'function') {
      window.showView(name);
      return;
    }
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const target = document.getElementById('view-' + name);
    if (target) target.classList.add('active');
    history.replaceState(null, '', '#' + name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function installStyles() {
    if (document.getElementById('antibiotic-consultation-styles')) return;
    const style = document.createElement('style');
    style.id = 'antibiotic-consultation-styles';
    style.textContent = `
      .consultation-feature{border-color:#f0c985;background:linear-gradient(180deg,#fff 0%,#fff9ee 100%)}
      .consultation-feature em{background:#fff0cf;color:#875506}
      .consultation-status{margin-bottom:14px;border-left:5px solid #d58a0b;background:#fff8e8;color:#5d430f}
      .consultation-status strong{color:#7a4a00}
      .consultation-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}
      .consultation-summary article{border:1px solid var(--line);border-radius:14px;background:#fff;padding:14px;box-shadow:0 4px 14px rgba(31,74,108,.05)}
      .consultation-summary strong{display:block;color:#075d98;font-size:25px;line-height:1.1}
      .consultation-summary span{display:block;color:var(--muted);font-size:12px;margin-top:6px;line-height:1.4}
      .consultation-filters{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-bottom:15px}
      .consultation-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .consultation-drug{border:1px solid var(--line);border-radius:15px;background:#fff;padding:15px;box-shadow:0 4px 14px rgba(31,74,108,.05)}
      .consultation-drug.priority{border-left:5px solid #d97706}
      .consultation-drug.monitoring{border-left:5px solid #0b79bb}
      .consultation-drug-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .consultation-drug h3{margin:0;color:#075d98;font-size:18px}
      .consultation-drug p{margin:7px 0;color:#415a6b;line-height:1.5}
      .consultation-drug small{color:var(--muted);line-height:1.45}
      .consultation-drug a{color:#075d98;text-underline-offset:2px}
      .consultation-clinical{padding-top:8px;border-top:1px solid #e2ebf1}
      .consultation-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800;white-space:nowrap}
      .consultation-badge.priority{background:#fff0cf;color:#875506}
      .consultation-badge.monitoring{background:#e8f5fc;color:#075d98}
      .consultation-badge.available{background:#e7f7ed;color:#17683b}
      .consultation-badge.reference{background:#eef2f5;color:#566b78}
      .consultation-meta{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}
      .consultation-meta span{border:1px solid #dce8ef;border-radius:999px;background:#f8fbfd;padding:5px 8px;color:#486477;font-size:11px;font-weight:700}
      .consultation-products{display:grid;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #e2ebf1}
      .consultation-products>b{color:#075d98;font-size:13px}
      .consultation-products span{display:block;border-radius:8px;background:#f3faf6;color:#275d42;padding:7px 9px;font-size:12px;line-height:1.4}
      .consultation-monitoring{margin-top:14px;border:1px solid var(--line);border-radius:13px;background:#fbfdff;padding:12px}
      .consultation-monitoring summary{cursor:pointer;color:#075d98;font-weight:800;line-height:1.45}
      .consultation-monitoring .consultation-list{margin-top:12px}
      .consultation-workflow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px;counter-reset:consult-step}
      .consultation-workflow article{position:relative;border:1px solid var(--line);border-radius:13px;background:#fff;padding:14px 12px 12px 45px;min-height:92px;line-height:1.45}
      .consultation-workflow article:before{counter-increment:consult-step;content:counter(consult-step);position:absolute;left:12px;top:13px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#0b79bb;color:#fff;font-weight:800;font-size:12px}
      .consultation-workflow b{display:block;color:#075d98;margin-bottom:4px}
      .consultation-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
      .consultation-source{border:1px solid var(--line);border-radius:13px;background:#fbfdff;padding:14px}
      .consultation-source h3{margin:0 0 7px;color:#075d98;font-size:16px}
      .consultation-source h3 a{display:inline-flex;align-items:center;gap:6px;color:inherit;text-decoration:none;border-radius:6px;outline:none}
      .consultation-source h3 a:after{content:'↗';font-size:13px;font-weight:900;color:#0b79bb;transition:transform .16s ease}
      .consultation-source h3 a:hover{text-decoration:underline;text-underline-offset:3px}
      .consultation-source h3 a:hover:after{transform:translate(2px,-2px)}
      .consultation-source h3 a:focus-visible{box-shadow:0 0 0 3px rgba(11,121,187,.18)}
      .consultation-source p{margin:0;color:var(--muted);font-size:13px;line-height:1.5}
      .consultation-empty{grid-column:1/-1;border:1px dashed #bad4e5;border-radius:13px;padding:22px;text-align:center;color:var(--muted)}
      @media(max-width:1050px){.consultation-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.consultation-workflow{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){
        .consultation-summary,.consultation-filters,.consultation-list,.consultation-source-grid,.consultation-workflow{grid-template-columns:1fr}
        .consultation-summary{gap:8px}
        .consultation-summary article{display:flex;align-items:center;gap:12px}
        .consultation-summary span{margin-top:0}
        .consultation-drug-head{display:block}
        .consultation-badge{margin-top:8px;white-space:normal}
      }
    `;
    document.head.appendChild(style);
  }

  function installFeatureCard() {
    const grid = document.querySelector('#view-home .feature-grid');
    if (!grid || grid.querySelector('[data-open="' + MODULE_ID + '"]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'feature-card consultation-feature';
    button.dataset.open = MODULE_ID;
    button.innerHTML = '<span class="feature-icon">👥</span><b>Kháng sinh cần hội chẩn khi dùng</b><small>Tra cứu kháng sinh cần hội chẩn và đối chiếu thuốc trong kho.</small><em>Đang hoạt động</em>';
    const anchor = grid.querySelector('[data-open="interactions"]');
    grid.insertBefore(button, anchor || null);
    button.addEventListener('click', () => openView(MODULE_ID));
  }

  function installView() {
    if (document.getElementById('view-' + MODULE_ID)) return;
    const view = document.createElement('section');
    view.className = 'view';
    view.id = 'view-' + MODULE_ID;
    view.innerHTML = `
      <div class="back-home-wrap">
        <button type="button" class="back-home-btn consultation-back" aria-label="Quay lại Trang chủ"><span aria-hidden="true">←</span> Quay lại Trang chủ</button>
      </div>
      <div class="page-title"><div>
        <span class="kicker">Quản lý sử dụng kháng sinh</span>
        <h1>Danh mục kháng sinh cần hội chẩn khi sử dụng</h1>
        <p>Tra cứu Nhóm 1 và Nhóm 2 theo Phụ lục 2 Quyết định 5631/QĐ-BYT. Danh mục đối chiếu theo hoạt chất, dạng dùng và đường dùng của từng biệt dược nội trú trên hệ thống.</p>
      </div></div>
      <section class="section-card consultation-status">
        <strong>Phạm vi áp dụng.</strong> Thực hiện hội chẩn và phê duyệt theo danh mục, quy trình đã ban hành tại bệnh viện. Phạm vi hạng trên từng thuốc được trích từ Phụ lục 2. Kết quả đối chiếu biệt dược dựa trên danh mục của hệ thống. Kiểm tra tồn thực tế tại Khoa Dược.
        <p><small>Ngày đối chiếu văn bản: 19/11/2026.</small></p>
      </section>
      <section class="section-card compact">
        <div class="consultation-summary">
          <article><strong id="consultationNationalCount">0</strong><span>mục tra cứu Nhóm 1 tách theo thuốc và dạng dùng</span></article>
          <article><strong id="consultationPriorityCount">0</strong><span>biệt dược nội trú hiện đã khớp Nhóm 1</span></article>
          <article><strong id="consultationOutsideCount">0</strong><span>mục Nhóm 1 chưa khớp chế phẩm nội trú</span></article>
          <article><strong id="consultationTotalCount">0</strong><span>mục trong danh mục nội trú đã đối chiếu</span></article>
        </div>
        <div class="consultation-filters">
          <label>Tìm thuốc hoặc biệt dược<input id="consultationQ" placeholder="Ví dụ: Ceftolozan, Meropenem, Vancomycin..."></label>
          <label>Tình trạng tại bệnh viện<select id="consultationAvailability"><option value="all">Tất cả danh mục Bộ Y tế</option><option value="available">Có trong danh mục nội trú</option><option value="reference">Chưa có trong danh mục nội trú</option></select></label>
          <label>Loại thuốc<select id="consultationCategory"><option value="all">Tất cả loại thuốc</option><option value="antibacterial">Kháng khuẩn</option><option value="antifungal">Kháng nấm</option><option value="antiviral">Kháng virus</option></select></label>
        </div>
        <div class="consultation-list" id="consultationList"></div>
        <details class="consultation-monitoring">
          <summary>Nhóm 2 cần theo dõi, giám sát sử dụng · <span id="consultationMonitoringCount">0</span> biệt dược</summary>
          <p>Giám sát tiêu thụ, tính hợp lý khi sử dụng và mức độ đề kháng theo chương trình quản lý kháng sinh của bệnh viện.</p>
          <div class="consultation-list" id="consultationMonitoringList"></div>
        </details>
      </section>
      <section class="section-card">
        <div class="section-heading"><div><h2>Quy trình tham chiếu cho Nhóm 1</h2></div></div>
        <div class="consultation-workflow">
          <article><b>Ghi lý do sử dụng</b>Ghi chẩn đoán, mức độ nặng, phác đồ đã dùng, dị ứng, chức năng thận, kết quả vi sinh và lý do chọn thuốc. Lấy bệnh phẩm trước khi dùng nếu điều kiện cho phép.</article>
          <article><b>Hội chẩn và phê duyệt</b>Duyệt trước sử dụng theo quy trình tại bệnh viện. Với cấp cứu hoặc ngoài giờ hành chính, hoàn tất trong 24–48 giờ theo Quyết định 5631.</article>
          <article><b>Đánh giá lại điều trị</b>Rà soát ở mốc 48–72 giờ hoặc sớm hơn theo diễn biến. Căn cứ đáp ứng và kết quả vi sinh để điều chỉnh, thu hẹp phổ hoặc ngừng khi phù hợp.</article>
          <article><b>Duyệt tiếp khi cần</b>Mỗi lần duyệt tối đa 14 ngày. Đánh giá lại đáp ứng và ghi nhận quyết định nếu cần tiếp tục.</article>
        </div>
        <div class="alert" style="margin-top:14px"><b>Người duyệt</b> do Ban quản lý sử dụng kháng sinh phân công. Quy trình và phiếu đề nghị tham khảo Phụ lục 3–4 Quyết định 5631. Ghi nhận mọi điều chỉnh liều vào bệnh án.</div>
        <p><small>Chú thích về carbapenem ở dòng 11 Phụ lục 2 dẫn chiếu Thông tư 43/2013/TT-BYT. <a href="${SOURCE_43_STATUS}" target="_blank" rel="noopener">Thông tư đã hết hiệu lực từ 18/10/2024</a>. Đối chiếu quy trình đang áp dụng tại bệnh viện khi xử lý ngoại lệ.</small></p>
      </section>
      <section class="section-card">
        <div class="section-heading"><div><h2>Văn bản quản lý và phác đồ điều trị</h2></div></div>
        <div class="consultation-source-grid">
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_5631}#page=17">Quyết định 5631/QĐ-BYT (2020)</a></h3><p>Phụ lục 2 về Nhóm 1 và Nhóm 2. Phụ lục 3–4 về quy trình và phiếu đề nghị sử dụng.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_2115}">Quyết định 2115/QĐ-BYT (2023)</a></h3><p>Sổ tay triển khai quản lý sử dụng kháng sinh cho bệnh viện tuyến huyện. Tham khảo cách lập danh mục tại cơ sở, rà soát điều trị và xuống thang.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_21}">Thông tư 21/2013/TT-BYT</a></h3><p>Tổ chức, hoạt động của Hội đồng Thuốc và Điều trị. Điều 5–6 về xây dựng danh mục thuốc và hướng dẫn điều trị của bệnh viện.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_2147}">Quyết định 2147/QĐ-BYT (2026)</a></h3><p>Hướng dẫn viêm phổi mắc phải cộng đồng ở người lớn, có hiệu lực từ 15/07/2026 và thay thế Quyết định 4815/QĐ-BYT năm 2020.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_3429}#page=51">Quyết định 3429/QĐ-BYT (2021)</a></h3><p>Chẩn đoán và điều trị nhiễm nấm xâm lấn, gồm Candida và Aspergillus xâm lấn.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_3651}">Quyết định 3651/QĐ-BYT (2024)</a></h3><p>Chẩn đoán và điều trị bệnh nấm Aspergillus phổi mạn tính.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_1530}">Quyết định 1530/QĐ-BYT (2023)</a></h3><p>Chẩn đoán và điều trị loét bàn chân do đái tháo đường. Mục kháng sinh dùng để tra cứu theo mức độ nhiễm trùng.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_DAV}">Cục Quản lý Dược</a></h3><p>Tra số đăng ký và tờ hướng dẫn sử dụng của từng chế phẩm. Thuốc mới cần đối chiếu hồ sơ lưu hành tại Việt Nam và danh mục được duyệt tại cơ sở.</p></article>
        </div>
      </section>
    `;
    const anchor = document.getElementById('view-interactions');
    const main = document.querySelector('main');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(view, anchor);
    else if (main) main.appendChild(view);
    view.querySelector('.consultation-back').addEventListener('click', () => openView('home'));
  }

  function render() {
    const inpatientDrugs = Array.isArray(window.VPMED_DRUGS) ? window.VPMED_DRUGS : [];
    const catalog = priorityCatalog.map(item => ({ ...item, products: inpatientDrugs.filter(drug => matchesRule(drug, item)) }));
    const priorityProducts = catalog.flatMap(item => item.products);
    const outsideCount = catalog.filter(item => !item.products.length).length;
    const monitoring = inpatientDrugs.map(classifyMonitoringDrug).filter(Boolean);
    const total = inpatientDrugs.length;
    const nationalCount = document.getElementById('consultationNationalCount');
    const priorityCount = document.getElementById('consultationPriorityCount');
    const outsideCountElement = document.getElementById('consultationOutsideCount');
    const monitoringCount = document.getElementById('consultationMonitoringCount');
    const totalCount = document.getElementById('consultationTotalCount');
    if (nationalCount) nationalCount.textContent = catalog.length;
    if (priorityCount) priorityCount.textContent = priorityProducts.length;
    if (outsideCountElement) outsideCountElement.textContent = outsideCount;
    if (monitoringCount) monitoringCount.textContent = monitoring.length;
    if (totalCount) totalCount.textContent = total;

    const input = document.getElementById('consultationQ');
    const availabilitySelect = document.getElementById('consultationAvailability');
    const categorySelect = document.getElementById('consultationCategory');
    const list = document.getElementById('consultationList');
    const monitoringList = document.getElementById('consultationMonitoringList');
    if (!input || !availabilitySelect || !categorySelect || !list || !monitoringList) return;

    const categoryLabels = { antibacterial: 'Kháng khuẩn', antifungal: 'Kháng nấm', antiviral: 'Kháng virus' };

    const draw = () => {
      const query = norm(input.value);
      const availability = availabilitySelect.value;
      const category = categorySelect.value;
      const filtered = catalog.filter(item => {
        const isAvailable = item.products.length > 0;
        const matchesAvailability = availability === 'all' || (availability === 'available' ? isAvailable : !isAvailable);
        const matchesCategory = category === 'all' || item.category === category;
        const searchable = norm([item.name, item.aliases.join(' '), item.route, item.scope, ...item.products.map(drug => [drug.brand, drug.active].join(' '))].join(' '));
        return matchesAvailability && matchesCategory && (!query || searchable.includes(query));
      }).sort((a, b) => Number(b.products.length > 0) - Number(a.products.length > 0));
      list.innerHTML = filtered.map(item => {
        const isAvailable = item.products.length > 0;
        const badge = isAvailable ? `Có ${item.products.length} biệt dược nội trú` : 'Chưa có trong danh mục nội trú';
        const products = isAvailable
          ? `<div class="consultation-products"><b>Biệt dược khớp trong danh mục nội trú</b>${item.products.map(drug => `<span>${esc(drug.brand)} — ${esc(drug.active)} · ${esc(drug.strength)} · ${esc(drug.route)}</span>`).join('')}</div>`
          : '';
        const reference = clinicalReferences[item.id];
        const clinical = reference
          ? `<p class="consultation-clinical">${esc(reference.text)} <a href="${esc(reference.url)}" target="_blank" rel="noopener">${esc(reference.label)}</a></p>`
          : '';
        return `
          <article class="consultation-drug priority">
            <div class="consultation-drug-head"><div><h3>${esc(item.name)}</h3></div><span class="consultation-badge ${isAvailable ? 'available' : 'reference'}">${esc(badge)}</span></div>
            <div class="consultation-meta"><span>${esc(categoryLabels[item.category])}</span><span>${esc(item.route)}</span></div>
            <p><b>Phạm vi theo Phụ lục 2</b> · ${esc(item.scope)}.</p>
            <small><a href="${SOURCE_5631}#page=${item.row > 10 ? 18 : 17}" target="_blank" rel="noopener">Nhóm 1, dòng ${item.row}</a></small>
            ${products}
            ${clinical}
          </article>`;
      }).join('') || '<div class="consultation-empty">Không tìm thấy thuốc phù hợp trong danh mục ưu tiên quản lý của Bộ Y tế.</div>';

      const filteredMonitoring = monitoring.filter(drug =>
        availability !== 'reference' && (category === 'all' || category === 'antibacterial') &&
        norm([drug.brand, drug.active, drug.consultationRule.label].join(' ')).includes(query));
      monitoringList.innerHTML = filteredMonitoring.map(drug => `
        <article class="consultation-drug monitoring">
          <div class="consultation-drug-head"><div><h3>${esc(drug.brand)}</h3></div><span class="consultation-badge monitoring">Theo dõi, giám sát</span></div>
          <p><b>Hoạt chất</b> · ${esc(drug.active)}</p>
          <div class="consultation-meta"><span>${esc(drug.strength)}</span><span>${esc(drug.route)}</span><span>${esc(drug.consultationRule.label)}</span></div>
          <small><a href="${SOURCE_5631}#page=${drug.consultationRule.row === 1 ? 18 : 19}" target="_blank" rel="noopener">Nhóm 2, dòng ${drug.consultationRule.row}</a></small>
        </article>`).join('') || '<div class="consultation-empty">Không có biệt dược Nhóm 2 phù hợp với bộ lọc.</div>';
      if (query && filteredMonitoring.length) monitoringList.closest('details').open = true;
    };

    input.addEventListener('input', draw);
    availabilitySelect.addEventListener('change', draw);
    categorySelect.addEventListener('change', draw);
    draw();
  }

  function init() {
    if (document.getElementById('view-' + MODULE_ID)) return;
    installStyles();
    installFeatureCard();
    installView();
    render();
    if (location.hash === '#' + MODULE_ID) openView(MODULE_ID);
    window.addEventListener('hashchange', () => {
      if (location.hash === '#' + MODULE_ID) openView(MODULE_ID);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
