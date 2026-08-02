(function () {
  'use strict';

  // 1) Bỏ đúng hai khung: "Nhận diện và đánh giá ban đầu"
  // và "Xét nghiệm và bệnh phẩm" trong mục Kháng sinh theo bệnh lý.
  const style = document.createElement('style');
  style.textContent = `
    #diseaseProfile .disease-grid > section:nth-child(1),
    #diseaseProfile .disease-grid > section:nth-child(2) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  // 2) Cập nhật nguồn chuyên môn theo bản hiện hành/mới nhất kiểm tra đến 13/07/2026.
  // Chỉ thay nguồn hiển thị; nội dung dự phòng phẫu thuật được cập nhật trong diseases.js.
  const SOURCE_MAP = {
    cap: [
      ['NICE NG250 (2025)', 'Pneumonia: diagnosis and management – viêm phổi cộng đồng và viêm phổi bệnh viện.', 'https://www.nice.org.uk/guidance/ng250'],
      ['ERS/ESICM/ESCMID/ALAT (2023)', 'Hướng dẫn quốc tế về viêm phổi cộng đồng nặng ở người lớn.', 'https://publications.ersnet.org/content/erj/61/4/2200735']
    ],
    hap: [
      ['NICE NG250 (2025)', 'Pneumonia: diagnosis and management – phần viêm phổi bệnh viện.', 'https://www.nice.org.uk/guidance/ng250'],
      ['ATS/IDSA – HAP/VAP', 'Trang hướng dẫn chính thức đang được ATS/IDSA duy trì cho viêm phổi bệnh viện và liên quan thở máy.', 'https://www.idsociety.org/practice-guideline/hap_vap/']
    ],
    aecopd: [
      ['GOLD Report 2026', 'Global Strategy for Prevention, Diagnosis and Management of COPD – bản 2026.', 'https://goldcopd.org/2026-gold-report-and-pocket-guide/']
    ],
    cystitis: [
      ['EAU Urological Infections Guidelines 2026', 'Hướng dẫn cập nhật của European Association of Urology về nhiễm khuẩn tiết niệu.', 'https://uroweb.org/guidelines/urological-infections']
    ],
    pyelo: [
      ['EAU Urological Infections Guidelines 2026', 'Hướng dẫn cập nhật về nhiễm khuẩn tiết niệu khu trú và toàn thân, gồm viêm bể thận.', 'https://uroweb.org/guidelines/urological-infections']
    ],
    sepsis: [
      ['Surviving Sepsis Campaign 2026', 'Hướng dẫn quốc tế hiện hành của Society of Critical Care Medicine về sepsis và sốc nhiễm khuẩn.', 'https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026']
    ],
    cellulitis: [
      ['NICE NG141 – Cellulitis and erysipelas', 'Hướng dẫn kê đơn kháng sinh chính thức, trang được NICE duy trì và cập nhật.', 'https://www.nice.org.uk/guidance/ng141']
    ],
    abscess: [
      ['IDSA – Skin and Soft Tissue Infections', 'Trang hướng dẫn chính thức hiện hành về nhiễm khuẩn da và mô mềm.', 'https://www.idsociety.org/practice-guideline/skin-and-soft-tissue-infections/']
    ],
    dfi: [
      ['IWGDF/IDSA 2023', 'Hướng dẫn chẩn đoán và điều trị nhiễm khuẩn bàn chân liên quan đái tháo đường.', 'https://www.idsociety.org/practice-guideline/diabetic-foot-infections/']
    ],
    cholangitis: [
      ['Tokyo Guidelines 2018 – Antimicrobial Therapy', 'Khuyến cáo kháng sinh chính thức cho viêm đường mật và viêm túi mật cấp.', 'https://pubmed.ncbi.nlm.nih.gov/29090866/'],
      ['Tokyo Guidelines 2018 – JSHBPS', 'Cổng tài liệu chính thức của Japanese Society of Hepato-Biliary-Pancreatic Surgery.', 'https://www.jshbps.jp/modules/en/index.php?content_id=47']
    ],
    iai: [
      ['Surgical Infection Society 2024', 'Hướng dẫn cập nhật về điều trị nhiễm khuẩn ổ bụng ở người lớn.', 'https://journals.sagepub.com/doi/10.1089/sur.2024.137'],
      ['IDSA Guideline Update 2024', 'Cập nhật đánh giá nguy cơ, chẩn đoán hình ảnh và vi sinh trong nhiễm khuẩn ổ bụng phức tạp.', 'https://www.idsociety.org/practice-guideline/intra-abdominal-infections/']
    ],
    meningitis: [
      ['WHO Guidelines 2025', 'Hướng dẫn WHO về chẩn đoán, điều trị và chăm sóc viêm màng não.', 'https://www.who.int/publications/i/item/9789240108042'],
      ['WHO Practical Manual 2026', 'Sổ tay thực hành triển khai hướng dẫn viêm màng não – công bố tháng 5/2026.', 'https://www.who.int/publications/i/item/9789240121027']
    ],
    osteomyelitis: [
      ['IDSA – Vertebral Osteomyelitis', 'Trang hướng dẫn chính thức đang được IDSA duy trì cho viêm xương tủy đốt sống ở người lớn.', 'https://www.idsociety.org/practice-guideline/vertebral-osteomyelitis/']
    ],
    septicarthritis: [
      ['SANJO Guideline 2023 – EBJIS', 'Hướng dẫn của European Bone and Joint Infection Society về viêm khớp nhiễm khuẩn khớp tự nhiên.', 'https://jbji.copernicus.org/articles/8/29/2023/']
    ],
    pelvic: [
      ['CDC STI Treatment Guidelines – PID', 'Hướng dẫn được CDC duy trì; phạm vi là viêm vùng chậu, không đại diện cho mọi nhiễm khuẩn sau thủ thuật phụ khoa.', 'https://www.cdc.gov/std/treatment-guidelines/pid.htm'],
      ['Quyết định 315/QĐ-BYT', 'Hướng dẫn chẩn đoán và điều trị các bệnh sản phụ khoa của Bộ Y tế.', 'https://kcb.vn/thu-vien-tai-lieu/huong-dan-chan-doan-va-dieu-tri-cac-benh-san-phu-khoa.html']
    ],
    surgical: [
      ['Quyết định 708/QĐ-BYT', 'Hướng dẫn sử dụng kháng sinh của Bộ Y tế – nội dung dự phòng kháng sinh phẫu thuật.', 'https://kcb.vn/upload/2005611/20210723/H%C6%B0%E1%BB%9Bng-d%E1%BA%ABn-s%E1%BB%AD-d%E1%BB%A5ng-kh%C3%A1ng-sinh-C%E1%BA%ADp-nh%E1%BA%ADt-l%E1%BA%A7n-cu%E1%BB%91i-khi-in-09.01.2015.pdf'],
      ['SHEA/IDSA/APIC Practice Recommendation (2022 update)', 'Khuyến cáo hiện hành về phòng ngừa nhiễm khuẩn vết mổ; bản cập nhật công bố năm 2023.', 'https://www.cambridge.org/core/journals/infection-control-and-hospital-epidemiology/article/strategies-to-prevent-surgical-site-infections-in-acutecare-hospitals-2022-update/2F824B9ADD6066B29F89C8A2A127A9DC'],
      ['ASHP/IDSA/SIS/SHEA – Surgical Prophylaxis', 'Hướng dẫn chi tiết theo loại phẫu thuật, thuốc, liều và nhắc lại; IDSA đang ghi trạng thái lưu trữ trong khi chờ bản cập nhật.', 'https://www.idsociety.org/practice-guideline/antimicrobial-prophylaxis-in-surgery/'],
      ['Bộ Y tế – Phòng ngừa nhiễm khuẩn vết mổ', 'Hướng dẫn chính thức về phòng ngừa nhiễm khuẩn vết mổ.', 'https://kcb.vn/upload/2005611/20210723//H%C6%B0%E1%BB%9Bng-d%E1%BA%ABn-ph%C3%B2ng-ng%E1%BB%ABa-nhi%E1%BB%85m-khu%E1%BA%A9n-v%E1%BA%BFt-m%E1%BB%95.pdf']
    ]
  };

  const diseases = window.VPMED_DISEASES || [];
  diseases.forEach(function (item) {
    if (SOURCE_MAP[item.id]) item.sources = SOURCE_MAP[item.id];
  });

  // Làm mới phần bệnh lý nếu mã chính đã tải xong.
  if (typeof window.renderDiseaseProfile === 'function') {
    window.renderDiseaseProfile();
  }

  // Bảo đảm hai khung vẫn bị loại bỏ sau mỗi lần chọn bệnh lý.
  const profile = document.getElementById('diseaseProfile');
  if (profile) {
    const observer = new MutationObserver(function () {
      const sections = profile.querySelectorAll('.disease-grid > section');
      if (sections[0]) sections[0].style.display = 'none';
      if (sections[1]) sections[1].style.display = 'none';
    });
    observer.observe(profile, { childList: true, subtree: true });
  }
})();
