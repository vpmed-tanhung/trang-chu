/*
 * VPMED - Nguồn quy định/cảnh báo chính thức cho module Rà soát đơn thuốc.
 * Phân tầng nguồn để tránh đánh đồng:
 * 1) QĐ 5948/QĐ-BYT: danh mục tương tác chống chỉ định của Bộ Y tế.
 * 2) Trung tâm DI & ADR Quốc gia: cảnh báo chuyên môn bổ sung; KHÔNG tự động
 *    nâng thành "chống chỉ định" nếu QĐ 5948 không quy định.
 * 3) QĐ 29/QĐ-BYT, TT 26/2025/TT-BYT, TT 37/2024/TT-BYT: khung ADR,
 *    kê đơn và BHYT; dùng để ghi căn cứ/nhắc kiểm soát, không sinh cặp DDI giả.
 */
(function interactionRegulatoryData(){
  'use strict';

  const QD5948_URL='https://kcb.vn/tin-tuc/danh-muc-tuong-tac-thuoc-chong-chi-dinh-trong-thuc-hanh-lam-sang-va-huong-dan-giam-sat-phan-ung-co-hai-cua-thuoc-adr-tai.html';

  window.VPMED_RX_REGULATORY_SOURCES={
    qd5948:{
      code:'5948/QĐ-BYT',
      issued:'30/12/2021',
      authority:'Bộ Y tế',
      role:'Danh mục chính thức xác định tương tác thuốc chống chỉ định trong thực hành lâm sàng.',
      sourceType:'moh-contraindication-list',
      url:QD5948_URL
    },
    qd29:{
      code:'29/QĐ-BYT',
      issued:'05/01/2022',
      authority:'Bộ Y tế',
      role:'Hướng dẫn giám sát ADR tại cơ sở khám bệnh, chữa bệnh; là khung cho lớp cảnh giác dược bổ sung.',
      sourceType:'moh-adr-framework',
      url:QD5948_URL
    },
    tt26_2025:{
      code:'26/2025/TT-BYT',
      issued:'30/06/2025',
      effective:'01/07/2025',
      authority:'Bộ Y tế',
      role:'Quy định về đơn thuốc và kê đơn thuốc hóa dược, sinh phẩm trong điều trị ngoại trú.',
      sourceType:'moh-prescribing-regulation',
      url:'https://chinhphu.vn/?docid=214386&pageid=27160'
    },
    tt37_2024:{
      code:'37/2024/TT-BYT',
      issued:'16/11/2024',
      effective:'01/01/2025',
      authority:'Bộ Y tế',
      role:'Nguyên tắc, tiêu chí và hướng dẫn thanh toán thuốc thuộc phạm vi BHYT.',
      sourceType:'moh-bhyt-regulation',
      url:'https://chinhphu.vn/?docid=211770&pageid=27160'
    },
    diadr:{
      code:'DI&ADR Quốc gia',
      authority:'Trung tâm Quốc gia về Thông tin thuốc và Theo dõi phản ứng có hại của thuốc',
      role:'Cảnh báo an toàn/tương tác chuyên môn bổ sung từ nguồn chính thức. Không mặc định là chống chỉ định pháp lý.',
      sourceType:'national-pharmacovigilance',
      url:'https://canhgiacduoc.org.vn/'
    }
  };

  // Gắn metadata cho 633 cặp QĐ 5948 mà không thay đổi nội dung gốc.
  if(Array.isArray(window.VPMED_INTERACTIONS)){
    window.VPMED_INTERACTIONS.forEach(rule=>{
      if(!rule.sourceType)rule.sourceType='moh-contraindication-list';
      if(!rule.authority)rule.authority='Bộ Y tế';
      if(!rule.legalBasis)rule.legalBasis='Quyết định 5948/QĐ-BYT ngày 30/12/2021';
      if(!rule.sourceUrl)rule.sourceUrl=QD5948_URL;
      if(!rule.visualSeverity)rule.visualSeverity=rule.conditional?'high':'critical';
      if(!rule.regulatoryStatus)rule.regulatoryStatus=rule.conditional
        ?'Chống chỉ định có điều kiện / ưu tiên tránh theo QĐ 5948'
        :'Chống chỉ định theo QĐ 5948';
    });
  }

  const DIADR_COMMON={
    sourceType:'national-pharmacovigilance',
    authority:'Trung tâm DI & ADR Quốc gia',
    legalBasis:'Cảnh giác dược quốc gia; triển khai trong khung giám sát ADR theo QĐ 29/QĐ-BYT',
    conditional:true,
    regulatoryStatus:'Cảnh báo chuyên môn bổ sung – không tự động quy thành chống chỉ định QĐ 5948'
  };

  // Các cặp bổ sung đã có cảnh báo tương tác rõ ràng trong dữ liệu DI&ADR chính thức
  // đang đi kèm hệ thống. Chỉ thêm cặp có hai hoạt chất xác định rõ; không suy diễn
  // từ các cảnh báo theo nhóm thuốc chung.
  window.VPMED_RX_INTERACTION_SUPPLEMENTAL=[
    {
      ...DIADR_COMMON,
      stt:'DIADR-2026-5840-A',
      drug1:'Atorvastatin',drug2:'Clarithromycin',name:'Atorvastatin + Clarithromycin',
      level:'Cảnh báo nghiêm trọng – ưu tiên tránh/đánh giá thay thế',visualSeverity:'high',
      mechanism:'Clarithromycin ức chế mạnh CYP3A4, làm tăng phơi nhiễm atorvastatin.',
      consequence:'Tăng nguy cơ viêm cơ, tăng CK và tiêu cơ vân; nguy cơ cao hơn ở người cao tuổi, liều statin cao hoặc suy thận.',
      management:'Ưu tiên tránh phối hợp khi có lựa chọn phù hợp; cân nhắc tạm ngừng/giảm liều/đổi statin hoặc kháng sinh và theo dõi triệu chứng độc tính cơ, CK và chức năng thận khi cần.',
      source:'Trung tâm DI & ADR Quốc gia – thông tin từ Australian Prescriber (03/07/2026)',
      sourceUrl:'https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5840/viem-co-tieu-co-van-do-tuong-tac-atorvastatin-clarithromycin.htm'
    },
    {
      ...DIADR_COMMON,
      stt:'DIADR-2026-5816',
      drug1:'Clozapin',drug2:'Mirabegron',name:'Clozapin + Mirabegron',
      level:'Cảnh báo nghiêm trọng – cần đánh giá thay thế/giảm liều',visualSeverity:'high',
      mechanism:'Mirabegron ức chế CYP2D6 mức độ trung bình, có thể làm tăng nồng độ clozapin.',
      consequence:'Tăng buồn ngủ, mất thăng bằng, té ngã và các độc tính phụ thuộc liều của clozapin; có thể gặp lú lẫn, nhịp nhanh, hạ huyết áp hoặc co giật.',
      management:'Đánh giá lựa chọn thay thế; theo dõi nồng độ clozapin khi có điều kiện, mức độ an thần, huyết áp/nhịp tim và nguy cơ té ngã; cân nhắc giảm liều theo đánh giá lâm sàng.',
      source:'Trung tâm DI & ADR Quốc gia (13/04/2026)',
      sourceUrl:'https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5816/tuong-tac-giua-clozapin-mirabegron-bip-01.htm'
    },
    {
      ...DIADR_COMMON,
      stt:'DIADR-2026-5790',
      drug1:'Ticagrelor',drug2:'Atorvastatin',name:'Ticagrelor + Atorvastatin',
      level:'Cảnh báo cần theo dõi – cân nhắc điều chỉnh',visualSeverity:'moderate',
      mechanism:'Ticagrelor có thể làm tăng phơi nhiễm atorvastatin qua CYP3A4/P-gp.',
      consequence:'Tăng CK, bệnh cơ hoặc tiêu cơ vân, kể cả với liều atorvastatin không cao ở một số người bệnh.',
      management:'Rà soát liều statin và các thuốc ức chế CYP3A4 khác; theo dõi đau/yếu cơ, CK khi có triệu chứng; cân nhắc giảm liều hoặc đổi statin nếu nguy cơ cao.',
      source:'Trung tâm DI & ADR Quốc gia (08/01/2026)',
      sourceUrl:'https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5790/hsa-canh-bao-tuong-tac-thuoc-ticagrelor-atorvastatin.htm'
    },
    {
      ...DIADR_COMMON,
      stt:'DIADR-2026-5833-DW',
      drug1:'Diosmin',drug2:'Warfarin',name:'Diosmin + Warfarin',
      level:'Cảnh báo cần theo dõi – nguy cơ chảy máu',visualSeverity:'moderate',
      mechanism:'Diosmin có hoặc không phối hợp hesperidin đã được cảnh báo liên quan xuất huyết; biến cố nặng gặp nhiều hơn khi dùng cùng thuốc chống đông.',
      consequence:'Tăng nguy cơ bầm tím hoặc xuất huyết, bao gồm xuất huyết tiêu hóa/tiết niệu; nguy cơ đáng lưu ý ở người có tiền sử xuất huyết hoặc chuẩn bị thủ thuật.',
      management:'Rà soát cả thuốc không kê đơn/sản phẩm bổ sung; theo dõi dấu hiệu chảy máu, công thức máu và INR khi dùng warfarin; đánh giá ngay nếu có xuất huyết.',
      source:'Trung tâm DI & ADR Quốc gia – cảnh báo Health Canada (09/06/2026)',
      sourceUrl:'https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5833/health-canada-canh-bao-ve-nguy-co-chay-mau-khi-su-dung-diosmin.htm'
    },
    {
      ...DIADR_COMMON,
      stt:'DIADR-2026-5833-DH',
      drug1:'Diosmin',drug2:'Heparin',name:'Diosmin + Heparin',
      level:'Cảnh báo cần theo dõi – nguy cơ chảy máu',visualSeverity:'moderate',
      mechanism:'Diosmin có hoặc không phối hợp hesperidin đã được cảnh báo liên quan xuất huyết; biến cố nặng gặp nhiều hơn khi dùng cùng thuốc chống đông.',
      consequence:'Tăng nguy cơ bầm tím hoặc xuất huyết khi phối hợp thuốc chống đông.',
      management:'Rà soát nguy cơ chảy máu và các thuốc/sản phẩm bổ sung khác; theo dõi lâm sàng và xét nghiệm phù hợp theo loại heparin và tình trạng người bệnh.',
      source:'Trung tâm DI & ADR Quốc gia – cảnh báo Health Canada (09/06/2026)',
      sourceUrl:'https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5833/health-canada-canh-bao-ve-nguy-co-chay-mau-khi-su-dung-diosmin.htm'
    },
    {
      ...DIADR_COMMON,
      stt:'DIADR-2026-5833-HW',
      drug1:'Hesperidin',drug2:'Warfarin',name:'Hesperidin + Warfarin',
      level:'Cảnh báo cần theo dõi – nguy cơ chảy máu',visualSeverity:'moderate',
      mechanism:'Cảnh báo về xuất huyết với diosmin có hoặc không phối hợp hesperidin; nguy cơ nặng tăng khi dùng cùng thuốc chống đông.',
      consequence:'Tăng nguy cơ xuất huyết; cần lưu ý khi người bệnh đồng thời dùng chế phẩm diosmin/hesperidin.',
      management:'Rà soát chế phẩm phối hợp, theo dõi dấu hiệu chảy máu, công thức máu và INR khi dùng warfarin; đánh giá ngay nếu có xuất huyết.',
      source:'Trung tâm DI & ADR Quốc gia – cảnh báo Health Canada (09/06/2026)',
      sourceUrl:'https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5833/health-canada-canh-bao-ve-nguy-co-chay-mau-khi-su-dung-diosmin.htm'
    },
    {
      ...DIADR_COMMON,
      stt:'DIADR-2026-5833-HH',
      drug1:'Hesperidin',drug2:'Heparin',name:'Hesperidin + Heparin',
      level:'Cảnh báo cần theo dõi – nguy cơ chảy máu',visualSeverity:'moderate',
      mechanism:'Cảnh báo về xuất huyết với diosmin có hoặc không phối hợp hesperidin; nguy cơ nặng tăng khi dùng cùng thuốc chống đông.',
      consequence:'Tăng nguy cơ xuất huyết khi phối hợp chế phẩm diosmin/hesperidin với heparin.',
      management:'Rà soát toàn bộ thuốc và sản phẩm bổ sung; theo dõi dấu hiệu chảy máu và xét nghiệm phù hợp theo loại heparin/tình trạng người bệnh.',
      source:'Trung tâm DI & ADR Quốc gia – cảnh báo Health Canada (09/06/2026)',
      sourceUrl:'https://canhgiacduoc.org.vn/CanhGiacDuoc/DiemTin/5833/health-canada-canh-bao-ve-nguy-co-chay-mau-khi-su-dung-diosmin.htm'
    }
  ];
})();
