(function () {
  'use strict';

  const MODULE_ID = 'antibiotic-consultation';
  const SOURCE_5631 = 'https://canhgiacduoc.org.vn/SiteData/3/UserFiles/Q%C4%90%205631%20BYT%20Huong%20dan%20thuc%20hien%20quan%20ly%20su%20dung%20khang%20sinh%20trong%20benh%20vien%2031_12_2020.PDF';
  const SOURCE_2115 = 'https://benhvienhatrung.vn/wp-content/uploads/2023/05/Qd2115.pdf';
  const SOURCE_708 = 'https://kcb.vn/upload/2005611/20210723/H%C6%B0%E1%BB%9Bng-d%E1%BA%ABn-s%E1%BB%AD-d%E1%BB%A5ng-kh%C3%A1ng-sinh-C%E1%BA%ADp-nh%E1%BA%ADt-l%E1%BA%A7n-cu%E1%BB%91i-khi-in-09.01.2015.pdf';
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
  const priorityCatalog = [
    { id: 'ceftolozane-tazobactam', name: 'Ceftolozan/tazobactam', aliases: ['ceftolozan', 'ceftolozane'], category: 'antibacterial', route: 'Tiêm/truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'tigecycline', name: 'Tigecyclin', aliases: ['tigecyclin', 'tigecycline'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'colistin', name: 'Colistin', aliases: ['colistin'], category: 'antibacterial', route: 'Truyền tĩnh mạch/khí dung/tiêm nội tủy', scope: allHospitalRanks },
    { id: 'fosfomycin-iv', name: 'Fosfomycin đường tĩnh mạch', aliases: ['fosfomycin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks, routeTest: route => !norm(route).includes('uong') },
    { id: 'linezolid', name: 'Linezolid', aliases: ['linezolid'], category: 'antibacterial', route: 'Truyền tĩnh mạch/uống', scope: allHospitalRanks },
    { id: 'amphotericin-b-lipid-complex', name: 'Amphotericin B phức hợp lipid', aliases: ['amphotericin b phuc hop lipid', 'amphotericin b lipid complex'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'caspofungin', name: 'Caspofungin', aliases: ['caspofungin'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'micafungin', name: 'Micafungin', aliases: ['micafungin'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'voriconazole', name: 'Voriconazol', aliases: ['voriconazol', 'voriconazole'], category: 'antifungal', route: 'Truyền tĩnh mạch/uống', scope: allHospitalRanks },
    { id: 'ceftazidime-avibactam', name: 'Ceftazidim/avibactam', aliases: ['ceftazidim avibactam', 'ceftazidime avibactam'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'ceftobiprole', name: 'Ceftobiprol', aliases: ['ceftobiprol', 'ceftobiprole'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'cefiderocol', name: 'Cefiderocol', aliases: ['cefiderocol'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'dalbavancin', name: 'Dalbavancin', aliases: ['dalbavancin'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'quinupristin-dalfopristin', name: 'Quinupristin/dalfopristin', aliases: ['quinupristin dalfopristin', 'dalfopristin quinupristin'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'eravacycline', name: 'Eravacyclin', aliases: ['eravacyclin', 'eravacycline'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'omadacycline', name: 'Omadacyclin', aliases: ['omadacyclin', 'omadacycline'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'oritavancin', name: 'Oritavancin', aliases: ['oritavancin'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'plazomicin', name: 'Plazomicin', aliases: ['plazomicin'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'tedizolid', name: 'Tedizolid', aliases: ['tedizolid'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'telavancin', name: 'Telavancin', aliases: ['telavancin'], category: 'antibacterial', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'anidulafungin', name: 'Anidulafungin', aliases: ['anidulafungin', 'anidulafundin'], category: 'antifungal', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'isavuconazole', name: 'Isavuconazol', aliases: ['isavuconazol', 'isavuconazole'], category: 'antifungal', route: 'Theo dạng dùng được phê duyệt', scope: allHospitalRanks },
    { id: 'liposomal-amphotericin-b', name: 'Amphotericin B dạng liposom', aliases: ['amphotericin b dang liposom', 'liposomal amphotericin b'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'imipenem', name: 'Imipenem (kể cả phối hợp cilastatin)', aliases: ['imipenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'meropenem', name: 'Meropenem', aliases: ['meropenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'doripenem', name: 'Doripenem', aliases: ['doripenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: allHospitalRanks },
    { id: 'ertapenem', name: 'Ertapenem', aliases: ['ertapenem'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: 'Hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'vancomycin', name: 'Vancomycin đường tĩnh mạch', aliases: ['vancomycin'], category: 'antibacterial', route: 'Truyền tĩnh mạch', scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'teicoplanin', name: 'Teicoplanin', aliases: ['teicoplanin'], category: 'antibacterial', route: 'Tiêm/truyền tĩnh mạch hoặc tiêm bắp', scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'amphotericin-b-deoxycholate', name: 'Amphotericin B deoxycholat', aliases: ['amphotericin b deoxycholat', 'amphotericin b deoxycholate'], category: 'antifungal', route: 'Truyền tĩnh mạch', scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn' },
    { id: 'aciclovir-iv', name: 'Aciclovir đường tĩnh mạch', aliases: ['aciclovir', 'acyclovir'], category: 'antiviral', route: 'Truyền tĩnh mạch', scope: 'Hạng I, hạng II và các cơ sở y tế hạng thấp hơn', routeTest: route => !norm(route).includes('uong') },
    { id: 'valganciclovir', name: 'Valganciclovir', aliases: ['valganciclovir'], category: 'antiviral', route: 'Uống', scope: allHospitalRanks },
    { id: 'posaconazole', name: 'Posaconazol', aliases: ['posaconazol', 'posaconazole'], category: 'antifungal', route: 'Uống', scope: allHospitalRanks }
  ];

  const monitoringRules = [
    {
      key: 'aminoglycoside',
      names: ['amikacin', 'gentamicin', 'tobramycin', 'netilmicin', 'neltimicin'],
      label: 'Aminoglycosid',
      basis: 'Thuộc Nhóm 2 cần theo dõi, giám sát sử dụng theo Phụ lục 2 Quyết định 5631/QĐ-BYT.'
    },
    {
      key: 'fluoroquinolone',
      names: ['ciprofloxacin', 'levofloxacin', 'lomefloxacin', 'moxifloxacin', 'norfloxacin', 'ofloxacin', 'pefloxacin', 'sparfloxacin'],
      label: 'Fluoroquinolon',
      basis: 'Thuộc Nhóm 2 cần theo dõi, giám sát sử dụng theo Phụ lục 2 Quyết định 5631/QĐ-BYT.'
    }
  ];

  function matchesRule(drug, rule) {
    const active = norm(drug.active).replace(/ hydrochloride\b/g, '');
    const names = rule.aliases || rule.names || [];
    const nameMatch = names.some(name => active.includes(norm(name)));
    return nameMatch && (!rule.routeTest || rule.routeTest(drug.route));
  }

  function classifyMonitoringDrug(drug) {
    const monitoring = monitoringRules.find(rule => matchesRule(drug, rule));
    if (monitoring) return { ...drug, consultationGroup: 'monitoring', consultationRule: monitoring };
    return null;
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
      .consultation-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800;white-space:nowrap}
      .consultation-badge.priority{background:#fff0cf;color:#875506}
      .consultation-badge.monitoring{background:#e8f5fc;color:#075d98}
      .consultation-badge.available{background:#e7f7ed;color:#17683b}
      .consultation-badge.reference{background:#eef2f5;color:#566b78}
      .consultation-meta{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}
      .consultation-meta span{border:1px solid #dce8ef;border-radius:999px;background:#f8fbfd;padding:5px 8px;color:#486477;font-size:11px;font-weight:700}
      .consultation-requirement{margin-top:10px;border-radius:10px;padding:10px 11px;font-size:13px;line-height:1.45}
      .consultation-drug.priority .consultation-requirement{background:#fff8e8;color:#6f4b0a}
      .consultation-drug.monitoring .consultation-requirement{background:#edf7fd;color:#315d79}
      .consultation-products{display:grid;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #e2ebf1}
      .consultation-products>b{color:#075d98;font-size:13px}
      .consultation-products span{display:block;border-radius:8px;background:#f3faf6;color:#275d42;padding:7px 9px;font-size:12px;line-height:1.4}
      .consultation-reference-note{margin-top:10px;border-radius:8px;background:#f3f6f8;color:#566b78;padding:8px 10px;font-size:12px;line-height:1.45}
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
        <p>Danh mục mở rộng theo Nhóm 1 ưu tiên quản lý của Bộ Y tế, bao gồm thuốc kháng khuẩn, kháng nấm và kháng virus; đồng thời đối chiếu với từng biệt dược nội trú của Bệnh viện VPMED Tân Hưng.</p>
      </div></div>
      <section class="section-card consultation-status">
        <strong>Trạng thái: Danh mục tham chiếu để xây dựng quy định nội bộ.</strong> Thuốc ghi “Chưa có trong danh mục nội trú” chỉ nhằm tra cứu và chuẩn bị khi bệnh viện bổ sung thuốc, không có nghĩa bệnh viện đang sẵn thuốc. Phạm vi bắt buộc hội chẩn/phê duyệt phải được xác định theo hạng bệnh viện và chỉ áp dụng chính thức sau khi Ban quản lý sử dụng kháng sinh, Hội đồng Thuốc và Điều trị và Giám đốc bệnh viện phê duyệt.
      </section>
      <section class="section-card compact">
        <div class="consultation-summary">
          <article><strong id="consultationNationalCount">0</strong><span>hoạt chất/nhóm thuốc trong danh mục Bộ Y tế</span></article>
          <article><strong id="consultationPriorityCount">0</strong><span>biệt dược nội trú hiện đã khớp Nhóm 1</span></article>
          <article><strong id="consultationOutsideCount">0</strong><span>hoạt chất hiện chưa có trong danh mục nội trú</span></article>
          <article><strong id="consultationTotalCount">0</strong><span>kháng sinh nội trú đã được đối chiếu</span></article>
        </div>
        <div class="consultation-filters">
          <label>Tìm thuốc hoặc biệt dược<input id="consultationQ" placeholder="Ví dụ: Ceftolozan, Meropenem, Vancomycin..."></label>
          <label>Tình trạng tại bệnh viện<select id="consultationAvailability"><option value="all">Tất cả danh mục Bộ Y tế</option><option value="available">Có trong danh mục nội trú</option><option value="reference">Chưa có trong danh mục nội trú</option></select></label>
          <label>Loại thuốc<select id="consultationCategory"><option value="all">Tất cả loại thuốc</option><option value="antibacterial">Kháng khuẩn</option><option value="antifungal">Kháng nấm</option><option value="antiviral">Kháng virus</option></select></label>
        </div>
        <div class="consultation-list" id="consultationList"></div>
        <details class="consultation-monitoring">
          <summary>Nhóm 2 cần theo dõi, giám sát sử dụng trong 34 kháng sinh nội trú: <span id="consultationMonitoringCount">0</span> biệt dược</summary>
          <div class="consultation-list" id="consultationMonitoringList"></div>
        </details>
      </section>
      <section class="section-card">
        <div class="section-heading"><div><span class="kicker">Quy trình đề xuất</span><h2>Các bước trước và sau khi sử dụng</h2></div></div>
        <div class="consultation-workflow">
          <article><b>1. Hoàn thành thông tin</b>Ghi chẩn đoán, chỉ định, phác đồ trước đó, chức năng thận, vi sinh và lý do chọn kháng sinh.</article>
          <article><b>2. Hội chẩn/phê duyệt</b>Thực hiện trước khi dùng. Cấp cứu hoặc ngoài giờ: hoàn thiện phê duyệt trong vòng 24–48 giờ.</article>
          <article><b>3. Đánh giá lại</b>Rà soát đáp ứng lâm sàng và kết quả vi sinh sau 48–72 giờ; xuống thang hoặc ngừng khi phù hợp.</article>
          <article><b>4. Duyệt tiếp nếu cần</b>Mỗi lần duyệt không quá 14 ngày; đánh giá lại trước khi tiếp tục điều trị.</article>
        </div>
        <div class="alert" style="margin-top:14px"><b>Người duyệt:</b> do Ban quản lý sử dụng kháng sinh phân công bằng văn bản; ưu tiên dược sĩ làm công tác dược lâm sàng, bác sĩ hồi sức tích cực hoặc bác sĩ có kinh nghiệm điều trị nhiễm trùng và sử dụng kháng sinh hợp lý.</div>
      </section>
      <section class="section-card">
        <div class="section-heading"><div><span class="kicker">Nguồn đối chiếu</span><h2>Căn cứ xây dựng danh mục</h2></div></div>
        <div class="consultation-source-grid">
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_5631}" aria-label="Đọc trực tiếp toàn văn Quyết định 5631/QĐ-BYT">Quyết định 5631/QĐ-BYT</a></h3><p>Hướng dẫn thực hiện quản lý sử dụng kháng sinh trong bệnh viện; Phụ lục 2 quy định Nhóm 1 ưu tiên quản lý và Nhóm 2 cần theo dõi, giám sát.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_2115}" aria-label="Đọc trực tiếp toàn văn Quyết định 2115/QĐ-BYT và Sổ tay">Quyết định 2115/QĐ-BYT năm 2023</a></h3><p>Toàn văn gồm Quyết định và Sổ tay hướng dẫn triển khai chương trình quản lý sử dụng kháng sinh dành cho bệnh viện tuyến huyện.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_708}" aria-label="Đọc trực tiếp toàn văn Quyết định 708/QĐ-BYT">Quyết định 708/QĐ-BYT</a></h3><p>Hướng dẫn sử dụng kháng sinh của Bộ Y tế để đối chiếu nguyên tắc lựa chọn và sử dụng; đây là tài liệu bổ trợ, không dùng thay cho danh mục hội chẩn tại Quyết định 5631/QĐ-BYT.</p></article>
          <article class="consultation-source"><h3><a target="_blank" rel="noopener" href="${SOURCE_DAV}" aria-label="Mở hệ thống tra cứu của Cục Quản lý Dược">Cục Quản lý Dược – Bộ Y tế</a></h3><p>Tra cứu số đăng ký và tờ hướng dẫn sử dụng của đúng chế phẩm trước khi bổ sung thuốc mới vào danh mục bệnh viện.</p></article>
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
    const inpatientDrugs = window.VPMED_DRUGS || [];
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
          ? `<div class="consultation-products"><b>Biệt dược hiện có tại bệnh viện</b>${item.products.map(drug => `<span>${esc(drug.brand)} — ${esc(drug.active)} · ${esc(drug.strength)} · ${esc(drug.route)}</span>`).join('')}</div>`
          : '<div class="consultation-reference-note"><b>Trạng thái:</b> Chưa có trong 34 kháng sinh nội trú hiện tại; hiển thị để tra cứu và chuẩn bị khi bệnh viện bổ sung thuốc.</div>';
        return `
          <article class="consultation-drug priority">
            <div class="consultation-drug-head"><div><h3>${esc(item.name)}</h3></div><span class="consultation-badge ${isAvailable ? 'available' : 'reference'}">${esc(badge)}</span></div>
            <div class="consultation-meta"><span>${esc(categoryLabels[item.category])}</span><span>${esc(item.route)}</span></div>
            <p><b>Phạm vi theo Phụ lục 2:</b> ${esc(item.scope)}.</p>
            ${products}
            <div class="consultation-requirement"><b>Quản lý Nhóm 1:</b> Hội chẩn/phê duyệt theo quy định nội bộ trước khi sử dụng; trường hợp cấp cứu/ngoài giờ hoàn thiện trong 24–48 giờ.</div>
          </article>`;
      }).join('') || '<div class="consultation-empty">Không tìm thấy thuốc phù hợp trong danh mục ưu tiên quản lý của Bộ Y tế.</div>';
    };

    monitoringList.innerHTML = monitoring.map(drug => `
      <article class="consultation-drug monitoring">
        <div class="consultation-drug-head"><div><h3>${esc(drug.brand)}</h3></div><span class="consultation-badge monitoring">Theo dõi, giám sát</span></div>
        <p><b>Hoạt chất:</b> ${esc(drug.active)}</p>
        <div class="consultation-meta"><span>${esc(drug.strength)}</span><span>${esc(drug.route)}</span><span>${esc(drug.consultationRule.label)}</span></div>
        <div class="consultation-requirement"><b>Yêu cầu:</b> Theo dõi tiêu thụ, tính hợp lý, độc tính và đề kháng; không mặc định đồng nghĩa bắt buộc hội chẩn.</div>
      </article>`).join('');

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
