'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const sourcePath=path.join(__dirname,'..','assets','prescription-check.js');
let source=fs.readFileSync(sourcePath,'utf8');
const initBlock=`  bindEvents();\n  renderDiagnosisChips();\n  renderFileQueue();\n  renderRows();\n  if(location.hash==='#prescription-check')ensureData().catch(()=>{});\n})();`;
assert(source.includes(initBlock),'Không tìm thấy khối khởi tạo prescription-check.js');
source=source.replace(initBlock,`  window.__rxPaymentTest={extractPrescriptionTitle,detectPaymentFromTitle,hasHospitalPharmacyServiceMarker,hasBhytPrescriptionMarker};\n})();`);

const context={window:{},document:{querySelector(){return null}},location:{hash:''},console};
vm.createContext(context);
vm.runInContext(source,context);
const detector=context.window.__rxPaymentTest;

const filler=Array.from({length:20},(_,i)=>`Dòng OCR ${i+1}`).join('\n');
const samples=[
  // Dấu hiệu nằm ở bất kỳ vị trí nào trong toàn văn OCR, kể cả sau 14 dòng đầu.
  {text:`${filler}\nNhà thuốc Bệnh Viện`,payment:'Dịch vụ'},
  {text:`${filler}\nĐƠN THUỐC BHYT`,payment:'BHYT'},
  {text:`${filler}\nQuầy Phát Thuốc Bảo Hiểm`,payment:'BHYT'},
  {text:`${filler}\nSố thẻ: DN4012345678901`,payment:'BHYT'},
  {text:`${filler}\nDịch vụ`,payment:'Dịch vụ'},

  // Tín hiệu mạnh phải thắng từ khóa chung/nhiễu ở phần khác của OCR.
  {text:'ĐƠN THUỐC BHYT\nThông tin liên hệ: Nhà thuốc Bệnh Viện',payment:'BHYT'},
  {text:'ĐƠN THUỐC\nNhà thuốc Bệnh Viện\nGhi chú tham khảo BHYT',payment:'Dịch vụ'},
  {text:'ĐƠN THUỐC\nKhông BHYT',payment:'Dịch vụ'},

  // “Đơn thuốc” là dấu hiệu trực tiếp của đơn dịch vụ; mẫu BHYT rõ ràng vẫn được ưu tiên trước.
  {text:'ĐƠN THUỐC',payment:'Dịch vụ'},
  {text:'ĐƠN THUỐC\nBHYT',payment:'BHYT'},

  // Không có bất kỳ dấu hiệu nào thì mới để chưa xác định.
  {text:'PHIẾU KHÁM\nBệnh nhân Nguyễn Văn A',payment:'Chưa xác định'}
];

for(const sample of samples){
  const title=detector.extractPrescriptionTitle(sample.text);
  const payment=detector.detectPaymentFromTitle(title,sample.text);
  assert.strictEqual(payment,sample.payment,`Sai phân loại: ${sample.text}`);
}

assert.strictEqual(detector.hasHospitalPharmacyServiceMarker('Liên hệ: Nhà thuốc Bệnh Viện'),true);
assert.strictEqual(detector.hasHospitalPharmacyServiceMarker('ĐƠN THUỐC'),false);
assert.strictEqual(detector.hasBhytPrescriptionMarker('ĐƠN THUỐC BHYT'),true);
assert.strictEqual(detector.hasBhytPrescriptionMarker('Quầy Phát Thuốc Bảo Hiểm'),true);
assert.strictEqual(detector.hasBhytPrescriptionMarker('Liên hệ: Nhà thuốc Bệnh Viện'),false);
console.log('Prescription payment detection tests: OK');
