/*
 * VPMED - Registry nguồn chính thức cho module Rà soát đơn thuốc.
 * Mục tiêu: không giới hạn căn cứ ở dữ liệu nội bộ; dữ liệu cấu trúc trong
 * ứng dụng chỉ là lớp cache/chuẩn hóa. Khi đánh giá chuyên môn phải giữ
 * nguồn gốc từ HDSD/SPC Cục QLD, Dược thư QGVN, hướng dẫn Bộ Y tế và văn
 * bản pháp quy hiện hành tương ứng.
 */
(function exposeRxOfficialSources(root){
  'use strict';

  const SOURCES=Object.freeze([
    Object.freeze({
      id:'DAV-APPROVED-LABELS',group:'drug',authority:'Cục Quản lý Dược – Bộ Y tế',
      title:'Tờ hướng dẫn sử dụng/SPC và hồ sơ thuốc được Cục Quản lý Dược phê duyệt',
      short:'HDSD/SPC Cục QLD',
      url:'https://dichvucong.dav.gov.vn/congbothuoc/index',status:'active',priority:1
    }),
    Object.freeze({
      id:'DTQGVN-III-QD3445',group:'drug',authority:'Bộ Y tế',
      title:'Dược thư Quốc gia Việt Nam lần xuất bản thứ ba – QĐ 3445/QĐ-BYT ngày 23/12/2022',
      short:'Dược thư QGVN III',
      url:'https://nidqc.gov.vn/thong-bao-phat-hanh-sach-dien-tu-duoc-thu-quoc-gia-viet-nam-lan-xuat-ban-thu-ba',status:'active',priority:2
    }),
    Object.freeze({
      id:'KCB-GUIDELINES',group:'guideline',authority:'Cục Quản lý Khám, chữa bệnh – Bộ Y tế',
      title:'Thư viện hướng dẫn chẩn đoán, điều trị và tài liệu chuyên môn của Bộ Y tế',
      short:'Phác đồ/Hướng dẫn BYT',
      url:'https://kcb.vn/phac-do',status:'active',priority:3
    }),
    Object.freeze({
      id:'QD5948-QD-BYT',group:'interaction',authority:'Bộ Y tế',
      title:'Quyết định 5948/QĐ-BYT ngày 30/12/2021 – Danh mục tương tác thuốc chống chỉ định trong thực hành lâm sàng',
      short:'QĐ 5948/QĐ-BYT',
      url:'https://kcb.vn/tin-tuc/danh-muc-tuong-tac-thuoc-chong-chi-dinh-trong-thuc-hanh-lam-sang-va-huong-dan-giam-sat-phan-ung-co-hai-cua-thuoc-adr-tai.html',status:'active',priority:1
    }),
    Object.freeze({
      id:'QD29-QD-BYT',group:'interaction',authority:'Bộ Y tế',
      title:'Quyết định 29/QĐ-BYT ngày 05/01/2022 – Hướng dẫn giám sát phản ứng có hại của thuốc (ADR)',
      short:'QĐ 29/QĐ-BYT/DI&ADR',
      url:'https://canhgiacduoc.org.vn/GioiThieuChung/Tinhoatdong.aspx?page=6',status:'active',priority:2
    }),
    Object.freeze({
      id:'TT06-2026-TT-BYT',group:'icd',authority:'Bộ Y tế',
      title:'Thông tư 06/2026/TT-BYT ngày 02/04/2026 – Quy định về mã hóa bệnh tật, nguyên nhân tử vong theo ICD-10',
      short:'TT06/2026/TT-BYT',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt.pdf',status:'active',priority:1
    }),
    Object.freeze({
      id:'TT06-2026-ICD10-APPENDIX',group:'icd',authority:'Bộ Y tế',
      title:'Phụ lục Danh mục mã bệnh ICD-10 ban hành kèm Thông tư 06/2026/TT-BYT',
      short:'Phụ lục ICD-10 TT06/2026',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt-kem.pdf',status:'active',priority:1
    }),
    Object.freeze({
      id:'TT26-2025-TT-BYT',group:'prescribing',authority:'Bộ Y tế',
      title:'Thông tư 26/2025/TT-BYT ngày 30/06/2025 – Quy định về đơn thuốc và kê đơn thuốc hóa dược, sinh phẩm trong điều trị ngoại trú',
      short:'TT26/2025/TT-BYT',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/7/26-byt.pdf',status:'active',priority:1
    }),
    Object.freeze({
      id:'TT20-2022-TT-BYT',group:'bhyt',authority:'Bộ Y tế',
      title:'Thông tư 20/2022/TT-BYT ngày 31/12/2022 – Danh mục và tỷ lệ, điều kiện thanh toán thuốc thuộc phạm vi BHYT',
      short:'TT20/2022/TT-BYT',url:'',status:'active',priority:1
    }),
    Object.freeze({
      id:'TT37-2024-TT-BYT',group:'bhyt',authority:'Bộ Y tế',
      title:'Thông tư 37/2024/TT-BYT ngày 16/11/2024 – Nguyên tắc, tiêu chí, cấu trúc danh mục và hướng dẫn thanh toán thuốc thuộc phạm vi BHYT',
      short:'TT37/2024/TT-BYT',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/11/37-byt.pdf',status:'active',priority:1
    }),
    Object.freeze({
      id:'TT01-2025-TT-BYT',group:'bhyt',authority:'Bộ Y tế',
      title:'Thông tư 01/2025/TT-BYT ngày 01/01/2025 – Quy định chi tiết và hướng dẫn thi hành một số điều của Luật Bảo hiểm y tế',
      short:'TT01/2025/TT-BYT',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/01/01-byt.pdf',status:'active',priority:2
    }),
    Object.freeze({
      id:'ND188-2025-ND-CP',group:'bhyt',authority:'Chính phủ',
      title:'Nghị định 188/2025/NĐ-CP ngày 01/07/2025 – Quy định chi tiết và hướng dẫn thi hành một số điều của Luật Bảo hiểm y tế',
      short:'NĐ188/2025/NĐ-CP',
      url:'https://vanban.chinhphu.vn/?docid=214515&pageid=27160',status:'active',priority:2
    })
  ]);

  const byGroup=group=>SOURCES.filter(source=>source.group===group);
  const uniqueText=values=>[...new Set((values||[]).filter(Boolean))];

  function footerLabels(){
    return Object.freeze({
      interaction:uniqueText(byGroup('interaction').map(source=>source.short)).join(' · '),
      icd:uniqueText([...byGroup('icd').map(source=>source.short),'HDSD/SPC Cục QLD','Dược thư QGVN III','Phác đồ/Hướng dẫn BYT']).join(' · '),
      prescribing:uniqueText([...byGroup('prescribing').map(source=>source.short),'HDSD/SPC Cục QLD','Dược thư QGVN III']).join(' · '),
      bhyt:uniqueText(byGroup('bhyt').map(source=>source.short)).join(' · ')
    });
  }

  function profileEvidence(profile){
    const embedded=(profile?.sources||[]).map(source=>({
      id:'PROFILE-SOURCE',group:'drug',authority:'',title:String(source?.title||'').trim(),
      short:String(source?.title||'').trim(),url:String(source?.url||'').trim(),status:'profile',priority:0
    })).filter(source=>source.title);
    const core=[...byGroup('drug'),...byGroup('guideline'),...byGroup('icd')];
    const seen=new Set();
    return [...embedded,...core].filter(source=>{
      const key=`${source.title}|${source.url}`;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  root.VPMED_RX_OFFICIAL_SOURCES=SOURCES;
  root.VPMED_RX_OFFICIAL_SOURCE_API=Object.freeze({SOURCES,byGroup,footerLabels,profileEvidence});
})(typeof window!=='undefined'?window:globalThis);
