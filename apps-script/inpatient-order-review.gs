/**
 * Phân tích y lệnh dùng thuốc nội trú — Apps Script proxy
 * ----------------------------------------------------------------
 * MỤC ĐÍCH
 * Nhận ảnh y lệnh (base64) từ trình duyệt, gọi Gemini kèm
 * system prompt cố định, trả kết quả JSON đã phân tích về cho client.
 * API key KHÔNG BAO GIỜ nằm trong code client — chỉ lưu trong
 * Script Properties của dự án Apps Script này.
 *
 * CÁCH TRIỂN KHAI
 * 1. Mở dự án Apps Script hiện có (cùng dự án đang chạy
 *    clinical-update-secure-client.js / vpmed-history-sync.js), tạo thêm
 *    file .gs mới, dán toàn bộ nội dung này vào.
 * 2. Project Settings → Script Properties → thêm khóa:
 *      GEMINI_API_KEY = <API key Gemini của bạn>
 *    Proxy tự thử Gemini 3.5 Flash-Lite khi Gemini 3.6 Flash quá tải.
 * 3. Trong hàm doPost(e) hiện có của dự án (nếu đã có action router chung),
 *    thêm nhánh: if (action === 'analyzeInpatientOrder') return
 *    handleAnalyzeInpatientOrder(payload); Nếu dự án chưa có router, hàm
 *    doPost ở cuối file này có thể dùng trực tiếp cho deployment riêng.
 * 4. Deploy → New deployment → Web app → Execute as: Me → Who has access:
 *    Anyone with the link. Copy URL /exec vào WEB_APP_URL trong
 *    assets/inpatient-order-review.js.
 *
 * QUYỀN RIÊNG TƯ
 * - Ảnh y lệnh được gửi ra ngoài tới nhà cung cấp AI để phân tích — đây là
 *   ngoại lệ có chủ đích so với các module khác của hệ thống (vốn xử lý
 *   OCR hoàn toàn cục bộ). Giao diện client PHẢI hiển thị cảnh báo và yêu
 *   cầu người dùng xác nhận trước khi gửi (xem inpatient-order-review.js).
 * - Không ghi log nội dung ảnh hoặc kết quả phân tích vào Google Sheet hay
 *   nơi lưu trữ lâu dài; chỉ xử lý trong bộ nhớ của request rồi trả về.
 */

var GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];

var BHYT_TEXT_PROMPT = [
  'VAI TRÒ: Dược sĩ kiểm tra đơn thuốc ngoại trú BHYT tại Việt Nam.',
  'INPUT chỉ là văn bản OCR đã được lọc thông tin định danh; có thể sai, thiếu hoặc lặp do OCR nhiều lượt.',
  'NHIỆM VỤ: phát hiện điểm cần xác minh về tên thuốc, hàm lượng, liều/cách dùng, trùng hoạt chất, tương tác, mã ICD và dấu hiệu phân loại BHYT/dịch vụ.',
  'Không tự kết luận thanh toán, xuất toán hay tính hợp lệ pháp lý. Không bịa dữ liệu bị thiếu. Mọi nhận định phải yêu cầu đối chiếu đơn gốc, HDSD/SPC, phác đồ Bộ Y tế và quy định BHYT hiện hành.',
  'Chỉ trả một JSON object hợp lệ, không markdown, đúng cấu trúc:',
  '{"summary":"string","issues":[{"category":"OCR|thuốc|liều-cách dùng|tương tác|ICD-BHYT","severity":"cao|vừa|thấp","finding":"string","recommendation":"string"}],"confidence":"cao|trung bình|thấp","disclaimer":"string"}'
].join('\n');

var SYSTEM_PROMPT = [
  'VAI TRÒ: Bạn là Dược sĩ lâm sàng cấp cao (Senior Clinical Pharmacist), chuyên sâu Dược lâm sàng nội trú tại bệnh viện Việt Nam, dày kinh nghiệm đọc và rà soát y lệnh dùng thuốc trong bệnh án.',
  '',
  'NHIỆM VỤ: Phân tích y lệnh dùng thuốc (không phải dịch pha truyền hay dịch pha thuốc) của một bệnh nhân nội trú dựa trên ảnh y lệnh/trang bệnh án được cung cấp. Chỉ tập trung đúng 5 việc, không mở rộng phạm vi:',
  '1. Tính toán liều dùng — đối chiếu liều bác sĩ kê với liều khuyến cáo (theo cân nặng/tuổi/chức năng thận nếu có dữ liệu); tách rõ liều nạp và liều duy trì; nêu rõ khi liều bất thường và mức chênh lệch ước tính.',
  '2. Cách dùng — đường dùng, thời điểm dùng, số lần/ngày, điều kiện đói/no, tương thích dạng bào chế.',
  '3. Tính tốc độ truyền thuốc — CHỈ tính tốc độ truyền (mL/giờ hoặc giọt/phút) cho thuốc IV dựa trên liều, thời gian truyền khuyến cáo và nồng độ/thể tích đã ghi rõ trong y lệnh. KHÔNG tính pha loãng/chọn dung môi/thể tích pha chế.',
  '4. Tương tác thuốc trong y lệnh — rà soát mọi cặp thuốc CÙNG có trong y lệnh đang phân tích; phân loại mức độ (chống chỉ định / nghiêm trọng cần theo dõi / cần lưu ý) kèm cơ chế và xử trí đề xuất.',
  '5. Cảnh báo bệnh nhân suy thận — ưu tiên rà soát NGAY mọi thuốc thải trừ qua thận hoặc độc thận. Với từng thuốc, nêu rõ cơ sở chọn mức liều (CrCl Cockcroft-Gault hay eGFR, giá trị và thời điểm SCr), liều nạp, liều duy trì/khoảng cách, theo dõi và thời điểm đánh giá lại. Chỉ đưa chế độ liều số khi đủ dữ liệu và nguồn áp dụng đúng chỉ định/đường dùng. Nếu AKI/SCr biến động, không áp một dải CrCl tĩnh: dùng xu hướng SCr, nước tiểu, TDM và yêu cầu đánh giá lại liên tiếp. Nếu IHD/CRRT, dùng khuyến cáo riêng theo phương thức/cường độ lọc và thời điểm dùng thuốc; không suy diễn từ CrCl.',
  '',
  'BỐI CẢNH: Bệnh nhân đang điều trị nội trú tại khoa; y lệnh do bác sĩ kê trong bệnh án. Input là một hoặc nhiều ảnh y lệnh/trang bệnh án của cùng một bệnh nhân, cùng một đợt y lệnh, số lượng không giới hạn. Người dùng là dược sĩ lâm sàng trực khoa, dùng kết quả để rà soát nhanh — không phải kết luận thay thế quyết định lâm sàng.',
  'Nguồn tham chiếu bắt buộc, theo thứ tự ưu tiên khi xung đột: (1) HDSD/SPC đã phê duyệt của đúng hoạt chất, hàm lượng, dạng bào chế và đường dùng; (2) quy trình/phác đồ chỉnh liều đã được bệnh viện phê duyệt; (3) Dược thư Quốc gia Việt Nam hiện hành và hướng dẫn Bộ Y tế; (4) hướng dẫn chuyên ngành hiện hành (KDIGO dùng cho nguyên tắc đánh giá chức năng thận; UpToDate/Sanford/Renal Drug Handbook dùng khi có nội dung phù hợp). Nếu các nguồn xung đột, phải nêu rõ sự khác biệt.',
  '',
  'RÀNG BUỘC:',
  '- Không suy đoán thông tin không xuất hiện trong ảnh. Nếu chữ mờ/không đọc rõ, ghi "Không đọc rõ, cần xác minh thủ công" — tuyệt đối không tự bịa số liệu.',
  '- Ghi chú có tiền tố "Dữ liệu thận do dược sĩ nhập" là dữ liệu có cấu trúc do người dùng cung cấp; dùng để kiểm chứng nhưng nếu xung đột với ảnh phải nêu xung đột, không tự chọn một giá trị im lặng.',
  '- Cockcroft-Gault/CKD-EPI chỉ phù hợp khi creatinine tương đối ổn định. Không đồng nhất giai đoạn CKD với ngưỡng chỉnh liều của từng thuốc. Ở thể trạng rất nhỏ/lớn, xem xét eGFR không chuẩn hóa BSA; với thuốc khoảng điều trị hẹp, ưu tiên cystatin C/mGFR hoặc TDM khi có.',
  '- Không chẩn đoán bệnh, không kê đơn thay bác sĩ, không tự quyết định ngừng/đổi thuốc.',
  '- Không tính pha loãng/pha chế dịch truyền.',
  '- Mỗi cảnh báo phải ghi ngắn gọn nguồn đã dùng. Không ghi tên nguồn như thể đã xác minh nếu không chắc; khi đó ghi rõ cần đối chiếu HDSD/quy trình bệnh viện.',
  '- Luôn trả kèm dòng miễn trừ trách nhiệm.',
  '- Trả lời bằng tiếng Việt.',
  '',
  'ĐỊNH DẠNG ĐẦU RA: Trả về DUY NHẤT một object JSON hợp lệ, không kèm văn bản khác, không dùng markdown code fence, đúng khung sau (bỏ trống mảng/field không áp dụng, không tự thêm field mới):',
  '{"patientContext":{"renalFunction":{"creatinine":"string hoặc null","crclOrEgfr":"string hoặc null","status":"ổn định|AKI/biến động|IHD|CRRT|chưa rõ","dataQuality":"đủ|thiếu|xung đột","note":"string"},"otherRelevantConditions":["string"]},"drugs":[{"name":"string (ưu tiên tên hoạt chất)","orderedDose":"string","route":"string","usageNote":"string","doseAssessment":{"status":"phù hợp|cao hơn khuyến cáo|thấp hơn khuyến cáo|không đủ dữ liệu để đánh giá","detail":"string","source":"string"},"infusionRate":{"applicable":true,"rate":"string","basis":"string"},"renalAdjustment":{"applicable":true,"priority":"rà soát ngay|trong ca trực|theo dõi","warning":"string","method":"string","suggestedRegimen":"string hoặc để trống nếu chưa đủ dữ liệu","loadingDoseNote":"string","monitoring":"string","source":"string"}}],"interactions":[{"drugs":["string","string"],"severity":"chống chỉ định|nghiêm trọng cần theo dõi|cần lưu ý","mechanism":"string","recommendation":"string","source":"string"}],"unclear":["string"],"disclaimer":"string"}',
  'Nếu ảnh không đọc được y lệnh nào hợp lệ, trả "drugs": [] và ghi rõ lý do trong "unclear".'
].join('\n');

/**
 * Điểm vào chính. payload = { images: [{mimeType, base64}], note?: string }
 * images: mảng ảnh y lệnh, không giới hạn số lượng (giới hạn thực tế do
 * Apps Script quota kích thước request — xem ghi chú cuối file).
 */
function handleAnalyzeInpatientOrder(payload) {
  var images = (payload && payload.images) || [];
  if (!images.length) {
    return { ok: false, message: 'Chưa nhận được ảnh y lệnh nào.' };
  }

  try {
    var resultText = callGemini(images, payload.note);

    var parsed = parseModelJson(resultText);
    if (!parsed) {
      return { ok: false, message: 'AI trả về định dạng không hợp lệ. Vui lòng thử lại.' };
    }
    return { ok: true, result: parsed };
  } catch (err) {
    var detail = err && err.message ? err.message : String(err);
    return { ok: false, message: 'Không thể phân tích lúc này. Vui lòng thử lại sau. Chi tiết: ' + detail };
  }
}

function handleAnalyzeBhytPrescriptionText(payload) {
  var text = String(payload && payload.ocrText || '').trim();
  if (!text) return { ok: false, message: 'Chưa nhận được văn bản OCR.' };
  if (text.length > 60000) return { ok: false, message: 'Văn bản OCR vượt giới hạn 60.000 ký tự.' };
  try {
    var resultText = callGeminiText(BHYT_TEXT_PROMPT, text);
    var parsed = parseModelJson(resultText);
    if (!parsed) return { ok: false, message: 'AI trả về định dạng không hợp lệ. Vui lòng thử lại.' };
    return { ok: true, result: parsed };
  } catch (err) {
    return { ok: false, message: 'Không thể phân tích văn bản OCR lúc này. Chi tiết: ' + (err && err.message ? err.message : err) };
  }
}

function callGemini(images, note) {
  var parts = [{
    text: 'Phân tích y lệnh trong (các) ảnh theo đúng hướng dẫn và chỉ trả về một object JSON hợp lệ.' +
      (note ? ('\n\nGhi chú thêm từ dược sĩ: ' + note) : '')
  }];
  images.forEach(function (img) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        data: img.base64
      }
    });
  });
  return requestGemini(SYSTEM_PROMPT, parts, 8192);
}

function callGeminiText(instructions, inputText) {
  return requestGemini(instructions, [{
    text: 'Phân tích văn bản OCR sau đây theo đúng cấu trúc đã yêu cầu và chỉ trả về một object JSON hợp lệ.\n\n' + inputText
  }], 4096);
}

function requestGemini(instructions, parts, maxOutputTokens) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Chưa cấu hình GEMINI_API_KEY trong Script Properties.');

  var request = {
    systemInstruction: { parts: [{ text: instructions }] },
    contents: [{ role: 'user', parts: parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: maxOutputTokens
    }
  };
  var errors = [];

  for (var modelIndex = 0; modelIndex < GEMINI_MODELS.length; modelIndex++) {
    var model = GEMINI_MODELS[modelIndex];
    for (var attempt = 0; attempt < 3; attempt++) {
      var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
        encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);
      var res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        muteHttpExceptions: true,
        payload: JSON.stringify(request)
      });
      var code = res.getResponseCode();
      var body;
      try { body = JSON.parse(res.getContentText()); } catch (e) { body = {}; }

      if (code >= 200 && code < 300) {
        var text = extractGeminiText(body);
        if (text) return text;
        errors.push(model + ': không có nội dung trả về');
        break;
      }

      var detail = (body.error && body.error.message) || ('HTTP ' + code);
      var retryable = code === 429 || code >= 500;
      if (!retryable || attempt === 2) {
        errors.push(model + ': ' + detail);
        break;
      }
      Utilities.sleep(Math.pow(2, attempt) * 1000);
    }
  }

  throw new Error('Gemini không khả dụng sau khi đã thử model chính và dự phòng. ' + errors.join(' | '));
}

function extractGeminiText(body) {
  var chunks = [];
  (body.candidates || []).forEach(function (candidate) {
    (((candidate || {}).content || {}).parts || []).forEach(function (part) {
      if (part && part.text) chunks.push(part.text);
    });
  });
  return chunks.join('');
}

/** Gỡ markdown code fence nếu model lỡ bọc, rồi parse JSON an toàn. */
function parseModelJson(text) {
  var cleaned = String(text || '').trim().replace(/^```json\s*|^```\s*|```$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}

/**
 * Dùng nếu triển khai deployment RIÊNG chỉ cho tính năng này (không dùng
 * chung router doPost hiện có của dự án). Nếu đã có doPost khác trong cùng
 * dự án Apps Script, XÓA hàm này và gọi handleAnalyzeInpatientOrder() từ
 * router chung để tránh xung đột "doPost đã được định nghĩa".
 */
function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var result = payload.action === 'analyzeBhytPrescriptionText'
    ? handleAnalyzeBhytPrescriptionText(payload)
    : handleAnalyzeInpatientOrder(payload);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * GHI CHÚ GIỚI HẠN THỰC TẾ
 * - Apps Script Web App giới hạn kích thước request ~50MB và thời gian
 *   chạy 6 phút/lần gọi (tài khoản cá nhân). Nhiều ảnh độ phân giải cao
 *   cùng lúc có thể vượt ngưỡng này dù không có giới hạn "cứng" về số
 *   lượng ảnh trong code — client nên nén ảnh trước khi gửi (đã áp dụng
 *   trong assets/inpatient-order-review.js).
 * - Đây là proxy tạm thời phù hợp kiến trúc hiện tại (GitHub Pages +
 *   Apps Script). Khi nhánh security/backend-migration (NestJS/Prisma)
 *   hoàn tất, nên chuyển endpoint này sang backend chính thức để quản lý
 *   khóa API, rate-limit và log audit tốt hơn.
 */
