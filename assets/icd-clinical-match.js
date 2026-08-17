/*
 * Đối chiếu ICD có kiểm soát cho rà soát đơn thuốc.
 *
 * Không dùng dữ liệu từ ảnh đơn thuốc để tạo hoặc mở rộng quy tắc. Bộ so khớp
 * chỉ sử dụng mã ICD đã OCR trong phiên và hồ sơ chỉ định đã được quản trị,
 * phiên bản hóa từ nguồn chuyên môn/chính thức.
 */
(function exposeIcdClinicalMatch(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.VPMED_ICD_CLINICAL_MATCH=api;
})(typeof window!=='undefined'?window:globalThis,function createIcdClinicalMatch(){
  'use strict';

  const VERSION='TT06-2026';
  const SOURCES=Object.freeze([
    Object.freeze({
      id:'TT06-2026-TT-BYT',
      authority:'Bộ Y tế',
      title:'Thông tư 06/2026/TT-BYT – Quy định mã hóa bệnh tật, nguyên nhân tử vong theo ICD-10',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt.pdf'
    }),
    Object.freeze({
      id:'TT06-2026-ICD10-APPENDIX',
      authority:'Bộ Y tế',
      title:'Phụ lục Danh mục mã bệnh ICD-10 ban hành kèm Thông tư 06/2026/TT-BYT',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt-kem.pdf'
    }),
    Object.freeze({
      id:'TT37-2024-TT-BYT',
      authority:'Bộ Y tế',
      title:'Thông tư 37/2024/TT-BYT – Hướng dẫn thanh toán thuốc thuộc phạm vi BHYT',
      url:'https://datafiles.chinhphu.vn/cpp/files/vbpq/2024/11/37-byt.pdf'
    }),
    Object.freeze({
      id:'DAV-APPROVED-LABELS',
      authority:'Cục Quản lý Dược - Bộ Y tế',
      title:'Tờ hướng dẫn sử dụng và thông tin thuốc được cấp phép',
      url:'https://dav.gov.vn/tra-cuu-thuoc-page206.html'
    }),
    Object.freeze({
      id:'QD5948-QD-BYT',
      authority:'Bộ Y tế',
      title:'Danh mục tương tác thuốc chống chỉ định trong thực hành lâm sàng',
      url:''
    }),
    Object.freeze({
      id:'DUOC-THU-QGVN',
      authority:'Bộ Y tế',
      title:'Dược thư Quốc gia Việt Nam hiện hành',
      url:''
    })
  ]);

  function normalizeCode(value){
    const compact=String(value||'').toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9.]/g,'');
    return /^[A-Z][0-9]{2}(?:\.[0-9]{1,4})?$/.test(compact)?compact:'';
  }

  function categoryOf(value){
    const code=normalizeCode(value);
    return code?code.slice(0,3):'';
  }

  function uniqueCodes(values){
    return [...new Set((values||[]).map(normalizeCode).filter(Boolean))];
  }

  function familyCategories(allowedValues){
    const allowed=uniqueCodes(allowedValues);
    const byCategory=new Map();
    allowed.forEach(code=>{
      const category=categoryOf(code);
      if(!byCategory.has(category))byCategory.set(category,[]);
      byCategory.get(category).push(code);
    });
    const families=new Map();
    byCategory.forEach((codes,category)=>{
      const parentListed=codes.includes(category);
      const unspecifiedListed=codes.some(code=>code===`${category}.9`);
      const multipleSiblingCodes=codes.filter(code=>code!==category).length>=2;
      if(parentListed||unspecifiedListed||multipleSiblingCodes){
        families.set(category,parentListed?'parent':unspecifiedListed?'unspecified':'siblings');
      }
    });
    return families;
  }

  function matchAny(observedValues,allowedValues){
    const observed=uniqueCodes(observedValues);
    const allowed=uniqueCodes(allowedValues);
    const exactSet=new Set(allowed);
    for(const code of observed){
      if(exactSet.has(code))return {matched:true,mode:'exact',observed:code,allowed:code,category:categoryOf(code)};
    }
    const families=familyCategories(allowed);
    for(const code of observed){
      const category=categoryOf(code);
      if(families.has(category)){
        const representative=allowed.find(item=>categoryOf(item)===category)||category;
        return {matched:true,mode:'category',basis:families.get(category),observed:code,allowed:representative,category};
      }
    }
    return {matched:false,mode:'none',observed:'',allowed:'',category:''};
  }

  return Object.freeze({VERSION,SOURCES,normalizeCode,categoryOf,familyCategories,matchAny});
});
