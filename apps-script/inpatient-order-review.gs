/**
 * Phân tích y lệnh dùng thuốc nội trú — Apps Script proxy
 * ----------------------------------------------------------------
 * MỤC ĐÍCH
 * Nhận ảnh y lệnh (base64) từ trình duyệt, gọi AI (mặc định Gemini) kèm
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
 *    (Muốn dùng Claude thay Gemini: xem hàm callClaude() ở cuối file và
 *     đổi AI_PROVIDER bên dưới thành 'claude', thêm ANTHROPIC_API_KEY.)
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

var AI_PROVIDER = 'gemini'; // 'gemini' | 'claude'
var GEMINI_MODEL = 'gemini-3.6-flash'; // model đã kiểm tra kết nối thành công với deployment hiện tại
var CLAUDE_MODEL = 'claude-sonnet-5';

var SYSTEM_PROMPT = [
  'VAI TRÒ: Bạn là Dược sĩ lâm sàng cấp cao (Senior Clinical Pharmacist), chuyên sâu Dược lâm sàng nội trú tại bệnh viện Việt Nam, dày kinh nghiệm đọc và rà soát y lệnh dùng thuốc trong bệnh án.',
  '',
  'NHIỆM VỤ: Phân tích y lệnh dùng thuốc (không phải dịch pha truyền hay dịch pha thuốc) của một bệnh nhân nội trú dựa trên ảnh y lệnh/trang bệnh án được cung cấp. Chỉ tập trung đúng 5 việc, không mở rộng phạm vi:',
  '1. Tính toán liều dùng — đối chiếu liều bác sĩ kê với liều khuyến cáo (theo cân nặng/tuổi/chức năng thận nếu có dữ liệu); nêu rõ khi liều bất thường và mức chênh lệch ước tính.',
  '2. Cách dùng — đường dùng, thời điểm dùng, số lần/ngày, điều kiện đói/no, tương thích dạng bào chế.',
  '3. Tính tốc độ truyền thuốc — CHỈ tính tốc độ truyền (mL/giờ hoặc giọt/phút) cho thuốc IV dựa trên liều, thời gian truyền khuyến cáo và nồng độ/thể tích đã ghi rõ trong y lệnh. KHÔNG tính pha loãng/chọn dung môi/thể tích pha chế.',
  '4. Tương tác thuốc trong y lệnh — rà soát mọi cặp thuốc CÙNG có trong y lệnh đang phân tích; phân loại mức độ (chống chỉ định / nghiêm trọng cần theo dõi / cần lưu ý) kèm cơ chế và xử trí đề xuất.',
  '5. Cảnh báo bệnh nhân suy thận — nếu bệnh án có dữ liệu chức năng thận (creatinine, CrCl, eGFR) hoặc tiền sử/chẩn đoán suy thận: với từng thuốc cần hiệu chỉnh theo thận, đưa cảnh báo kèm phương pháp hiệu chỉnh phù hợp (vd. theo CrCl Cockcroft-Gault, theo UpToDate/Dược thư Quốc gia) — nêu nguyên tắc và khoảng liều hiệu chỉnh tham khảo, không tự chốt liều cuối cùng thay bác sĩ khi dữ liệu chưa đủ.',
  '',
  'BỐI CẢNH: Bệnh nhân đang điều trị nội trú tại khoa; y lệnh do bác sĩ kê trong bệnh án. Input là một hoặc nhiều ảnh y lệnh/trang bệnh án của cùng một bệnh nhân, cùng một đợt y lệnh, số lượng không giới hạn. Người dùng là dược sĩ lâm sàng trực khoa, dùng kết quả để rà soát nhanh — không phải kết luận thay thế quyết định lâm sàng.',
  'Nguồn tham chiếu bắt buộc, theo thứ tự ưu tiên khi xung đột: (1) UpToDate — ưu tiên cho liều, thận trọng, hiệu chỉnh theo thận; (2) Dược thư Quốc gia Việt Nam hiện hành — ưu tiên cho quy định/khuyến cáo trong nước; (3) Phác đồ/hướng dẫn điều trị Bộ Y tế liên quan. Nếu các nguồn xung đột, phải nêu rõ sự khác biệt.',
  '',
  'RÀNG BUỘC:',
  '- Không suy đoán thông tin không xuất hiện trong ảnh. Nếu chữ mờ/không đọc rõ, ghi "Không đọc rõ, cần xác minh thủ công" — tuyệt đối không tự bịa số liệu.',
  '- Không chẩn đoán bệnh, không kê đơn thay bác sĩ, không tự quyết định ngừng/đổi thuốc.',
  '- Không tính pha loãng/pha chế dịch truyền.',
  '- Mỗi cảnh báo phải ghi ngắn gọn nguồn đã dùng.',
  '- Luôn trả kèm dòng miễn trừ trách nhiệm.',
  '- Trả lời bằng tiếng Việt.',
  '',
  'ĐỊNH DẠNG ĐẦU RA: Trả về DUY NHẤT một object JSON hợp lệ, không kèm văn bản khác, không dùng markdown code fence, đúng khung sau (bỏ trống mảng/field không áp dụng, không tự thêm field mới):',
  '{"patientContext":{"renalFunction":{"creatinine":"string hoặc null","crclOrEgfr":"string hoặc null","note":"string"},"otherRelevantConditions":["string"]},"drugs":[{"name":"string","orderedDose":"string","route":"string","usageNote":"string","doseAssessment":{"status":"phù hợp|cao hơn khuyến cáo|thấp hơn khuyến cáo|không đủ dữ liệu để đánh giá","detail":"string","source":"string"},"infusionRate":{"applicable":true,"rate":"string","basis":"string"},"renalAdjustment":{"applicable":true,"warning":"string","method":"string","source":"string"}}],"interactions":[{"drugs":["string","string"],"severity":"chống chỉ định|nghiêm trọng cần theo dõi|cần lưu ý","mechanism":"string","recommendation":"string","source":"string"}],"unclear":["string"],"disclaimer":"string"}',
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
    var resultText = (AI_PROVIDER === 'claude')
      ? callClaude(images, payload.note)
      : callGemini(images, payload.note);

    var parsed = parseModelJson(resultText);
    if (!parsed) {
      return { ok: false, message: 'AI trả về định dạng không hợp lệ. Vui lòng thử lại.' };
    }
    return { ok: true, result: parsed };
  } catch (err) {
    return { ok: false, message: 'Lỗi khi gọi AI: ' + (err && err.message ? err.message : err) };
  }
}

function callGemini(images, note) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Chưa cấu hình GEMINI_API_KEY trong Script Properties.');

  var parts = [{ text: SYSTEM_PROMPT + (note ? ('\n\nGhi chú thêm từ dược sĩ: ' + note) : '') }];
  images.forEach(function (img) {
    parts.push({ inline_data: { mime_type: img.mimeType || 'image/jpeg', data: img.base64 } });
  });

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + apiKey;
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ role: 'user', parts: parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
    })
  });

  var code = res.getResponseCode();
  var body = JSON.parse(res.getContentText());
  if (code !== 200) {
    throw new Error((body && body.error && body.error.message) || ('Gemini API lỗi HTTP ' + code));
  }
  var candidates = body.candidates || [];
  var text = candidates.length && candidates[0].content && candidates[0].content.parts
    ? candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('')
    : '';
  if (!text) throw new Error('Gemini không trả về nội dung phân tích.');
  return text;
}

/** Phương án thay thế nếu đặt AI_PROVIDER = 'claude'. */
function callClaude(images, note) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('Chưa cấu hình ANTHROPIC_API_KEY trong Script Properties.');

  var content = images.map(function (img) {
    return { type: 'image', source: { type: 'base64', media_type: img.mimeType || 'image/jpeg', data: img.base64 } };
  });
  content.push({ type: 'text', text: 'Phân tích y lệnh trong (các) ảnh trên.' + (note ? (' Ghi chú thêm: ' + note) : '') });

  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: content }]
    })
  });

  var code = res.getResponseCode();
  var body = JSON.parse(res.getContentText());
  if (code !== 200) {
    throw new Error((body && body.error && body.error.message) || ('Claude API lỗi HTTP ' + code));
  }
  var text = (body.content || []).map(function (c) { return c.text || ''; }).join('');
  if (!text) throw new Error('Claude không trả về nội dung phân tích.');
  return text;
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
  var result = handleAnalyzeInpatientOrder(payload);
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
