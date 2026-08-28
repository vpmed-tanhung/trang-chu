const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dataSandbox = { window: {} };
vm.createContext(dataSandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'inpatient_medicines_20260707.js'), 'utf8'), dataSandbox);
const rows = dataSandbox.window.VPMED_INPATIENT_MEDICINES_20260707;
const payloadCatalog = rows.map((row, index) => ({
  catalogId: String(row.code || row.regNumber || row.id || `inventory-${index + 1}`),
  brand: row.name,
  activeIngredient: row.active,
  strength: row.strength,
  route: row.route,
  registrationNumber: row.regNumber
}));

const sandbox = { console };
vm.createContext(sandbox);
const appsScriptSource = fs.readFileSync(path.join(root, 'apps-script', 'inpatient-order-review.gs'), 'utf8');
assert.ok(!appsScriptSource.includes('INPATIENT_IDENTITY_PROMPT'), 'Không được giữ prompt nhận diện của kiến trúc hai lượt');
assert.ok(!appsScriptSource.includes('callGeminiIdentity'), 'Không được giữ hàm gọi AI nhận diện riêng của kiến trúc hai lượt');
vm.runInContext(appsScriptSource, sandbox);

const catalog = sandbox.sanitizeDrugCatalog(payloadCatalog);
const entry = catalog.find(item => item.brand && item.activeIngredient);
assert.ok(entry, 'Danh mục kiểm thử phải có ít nhất một thuốc hợp lệ');

let requestCount = 0;
let seenInstructions = '';
let seenParts = null;
sandbox.requestGemini = function(instructions, parts) {
  requestCount += 1;
  seenInstructions = String(instructions || '');
  seenParts = parts;
  return JSON.stringify({
    patientContext: { renalFunction: { creatinine: null, crclOrEgfr: null, status: 'chưa rõ', dataQuality: 'thiếu', note: '' }, otherRelevantConditions: [] },
    drugs: [{
      name: entry.brand,
      identity: {
        rawName: entry.brand,
        status: 'exact',
        catalogId: '',
        brand: entry.brand,
        activeIngredient: entry.activeIngredient,
        strength: entry.strength,
        route: entry.route,
        registrationNumber: ''
      },
      orderedDose: 'Dòng y lệnh kiểm thử',
      route: entry.route || '',
      usageNote: '',
      doseAssessment: { status: 'không đủ dữ liệu để đánh giá', detail: '', source: '' },
      infusionRate: { applicable: false, rate: '', basis: '' },
      renalAdjustment: { applicable: false, priority: 'theo dõi', warning: '', method: '', suggestedRegimen: '', loadingDoseNote: '', monitoring: '', source: '' }
    }],
    interactions: [],
    unclear: [],
    disclaimer: 'Kết quả hỗ trợ tham khảo.'
  });
};

const result = sandbox.handleAnalyzeInpatientOrder({
  images: [{ mimeType: 'image/jpeg', base64: 'ZmFrZS1pbWFnZQ==' }],
  drugCatalog: payloadCatalog,
  note: ''
});

assert.strictEqual(requestCount, 1, 'Phân tích y lệnh nội trú phải chỉ gọi Gemini đúng một lượt');
assert.strictEqual(result.ok, true);
assert.ok(seenInstructions.includes('CÙNG MỘT LƯỢT'), 'System prompt phải yêu cầu đọc ảnh và phân tích trong cùng một lượt');
assert.ok(seenInstructions.includes('không tự hoàn thiện chữ bị khuất/mờ'), 'System prompt phải cấm AI tự hoàn thiện tên thuốc không đọc rõ');
assert.ok(seenInstructions.includes('Không được phân tích theo một hoạt chất nhưng hiển thị tên thuốc khác'), 'System prompt phải buộc kết luận lâm sàng bám đúng thuốc đã nhận diện');
assert.ok(seenInstructions.includes('không có nghĩa là ngoài phạm vi phân tích'), 'Thuốc ngoài danh mục vẫn phải được AI nhận diện và phân tích');
assert.ok(seenInstructions.includes('tên biệt dược/tên thương mại'), 'Prompt phải yêu cầu nhận diện tên biệt dược/tên thương mại');
assert.ok(Array.isArray(seenParts) && seenParts.some(part => part.inlineData), 'Lượt phân tích duy nhất phải nhận trực tiếp ảnh y lệnh');
assert.strictEqual(result.result.drugs[0].identity.catalogId, entry.catalogId, 'Sau AI, server bổ sung tham chiếu catalogId khi khớp');
assert.strictEqual(result.result.drugs[0].identity.activeIngredient, entry.activeIngredient, 'Hoạt chất hiển thị phải lấy từ danh mục đã xác minh');


requestCount = 0;
sandbox.requestGemini = function() {
  requestCount += 1;
  return JSON.stringify({
    drugs: [{
      name: entry.brand,
      identity: { rawName: entry.brand, status: 'exact', catalogId: '', activeIngredient: 'Hoạt chất AI nhận sai' },
      orderedDose: 'Dòng y lệnh kiểm thử',
      doseAssessment: { status: 'phù hợp', detail: 'Kết luận không an toàn nếu nhận sai thuốc', source: 'AI' },
      infusionRate: { applicable: true, rate: '40 mL/giờ', basis: 'AI' },
      renalAdjustment: { applicable: true, priority: 'theo dõi', warning: '', method: '', suggestedRegimen: '', loadingDoseNote: '', monitoring: '', source: 'AI' }
    }],
    interactions: [{ drugs: [entry.brand, 'Thuốc B'], severity: 'cần lưu ý', mechanism: '', recommendation: '', source: 'AI' }],
    unclear: []
  });
};
const wrongActiveResult = sandbox.handleAnalyzeInpatientOrder({
  images: [{ mimeType: 'image/jpeg', base64: 'ZmFrZS1pbWFnZQ==' }],
  drugCatalog: payloadCatalog
});
assert.strictEqual(requestCount, 1, 'Mỗi lần phân tích vẫn chỉ được gọi Gemini một lượt');
assert.strictEqual(wrongActiveResult.ok, true);
assert.strictEqual(wrongActiveResult.result.drugs[0].identity.activeIngredient, 'Hoạt chất AI nhận sai', 'Server phải giữ kết quả AI để người dùng đối chiếu/chỉnh sửa');
assert.strictEqual(wrongActiveResult.result.drugs[0].identity.catalogStatus, 'conflict');
assert.ok(!wrongActiveResult.result.drugs[0].safetyBlocked, 'Danh mục tham khảo không được khóa kết luận AI');
assert.strictEqual(wrongActiveResult.result.drugs[0].doseAssessment.status, 'phù hợp');
assert.strictEqual(wrongActiveResult.result.interactions.length, 1, 'Danh mục tham khảo không được xóa tương tác AI đã phân tích');

requestCount = 0;
const noCatalogResult = sandbox.handleAnalyzeInpatientOrder({
  images: [{ mimeType: 'image/jpeg', base64: 'ZmFrZS1pbWFnZQ==' }],
  drugCatalog: []
});
assert.strictEqual(noCatalogResult.ok, true, 'Thiếu danh mục nội bộ vẫn phải gọi AI và trả kết quả');
assert.strictEqual(requestCount, 1);
assert.strictEqual(noCatalogResult.result.drugs[0].identity.catalogStatus, 'unavailable');

console.log('Inpatient Apps Script one-pass AI regression tests: OK');
