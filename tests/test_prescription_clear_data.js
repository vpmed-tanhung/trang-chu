'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'assets/prescription-check.js'),'utf8');

const reset=js.match(/function resetPrescription\(options=\{\}\)\{([\s\S]*?)\n  \}\n\n  function showRxToast/);
assert(reset,'Không tìm thấy resetPrescription');
const body=reset[1];
assert(body.includes('cancelActiveOcr()'),'Xóa dữ liệu phải dừng OCR đang chạy');
assert(body.includes('entry.file=null'),'Xóa dữ liệu phải bỏ tham chiếu File ảnh');
assert(body.includes('state.drugs=[]'),'Xóa dữ liệu phải xóa danh sách thuốc');
assert(body.includes('state.files=[]'),'Xóa dữ liệu phải xóa hàng đợi ảnh');
assert(body.includes('state.lastCheck=null'),'Xóa dữ liệu phải xóa kết quả rà soát gần nhất');
assert(body.includes("rx$('#rxDiagnosisCodes').value=''"),'Xóa dữ liệu phải xóa mã bệnh nhập/chỉnh');
assert(body.includes("rx$('#rxPasteDrugs').value=''"),'Xóa dữ liệu phải xóa danh sách thuốc dán vào');
assert(body.includes("rx$('#rxPrescriptionFile').value=''"),'Xóa dữ liệu phải xóa file input');

assert(js.includes('let activeOcrWorker=null'),'Phải theo dõi worker OCR đang chạy');
assert(js.includes('ocrRunToken'),'Phải có token hủy tác vụ OCR bất đồng bộ');
assert(js.includes('if(!ocrRunIsCurrent(runToken))'),'OCR phải kiểm tra trạng thái hủy trước khi ghi dữ liệu');

// Module rà soát đơn không được âm thầm lưu dữ liệu bệnh án/đơn thuốc vào browser storage.
for(const forbidden of ['localStorage','sessionStorage','indexedDB','caches.open']){
  assert(!js.includes(forbidden),`prescription-check.js không được lưu dữ liệu tra cứu vào ${forbidden}`);
}

// Toast xác nhận cũng được tháo khỏi DOM, không giữ node ẩn vô thời hạn.
assert(js.includes("if(toast.parentNode)toast.remove()"),'Toast sau khi xóa phải được tháo khỏi DOM');

console.log('OK: prescription clear really clears client-side lookup data');
