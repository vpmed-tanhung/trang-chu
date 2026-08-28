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
  'NHIỆM VỤ: Đọc trực tiếp ảnh y lệnh và phân tích y lệnh dùng thuốc (không phải dịch pha truyền hay dịch pha thuốc) của một bệnh nhân nội trú trong CÙNG MỘT LƯỢT GỌI AI và CÙNG MỘT PHẢN HỒI JSON. Chỉ tập trung đúng 5 việc, không mở rộng phạm vi:',
  'QUY TRÌNH BẮT BUỘC TRONG MỘT LƯỢT: Với từng dòng y lệnh, trước hết chép nguyên văn phần nhìn thấy vào identity.rawName và orderedDose; sau đó mới phân tích lâm sàng dựa đúng trên tên/hoạt chất vừa nhận diện. Không tách thành lượt nhận diện riêng và không dùng một thuốc khác để thay thế phần chữ trong ảnh.',
  'QUY TẮC NHẬN DIỆN: Từ tên đọc được trong ảnh, phải nhận diện cả tên biệt dược/tên thương mại do nhà sản xuất đặt và hoạt chất tương ứng. Không sửa tên nhìn thấy theo trí nhớ, không tự hoàn thiện chữ bị khuất/mờ và không chọn một tên gần giống khi ảnh không đủ rõ. identity.rawName chép nguyên văn; identity.brand ghi tên thương mại nhận diện được; identity.activeIngredient ghi hoạt chất thực sự được dùng cho toàn bộ đánh giá lâm sàng. Không tự tạo catalogId: luôn để catalogId="".',
  'DANH MỤC NỘI BỘ CHỈ THAM KHẢO: AI phải tự đọc, tự nhận diện và phân tích thuốc dựa trên ảnh cùng kiến thức dược lâm sàng. Một thuốc không có trong danh mục nội bộ không có nghĩa là ngoài phạm vi phân tích và không được dùng làm lý do từ chối phân tích. Sau phản hồi AI, mã chương trình chỉ dùng danh mục để bổ sung cảnh báo đối chiếu; không được xóa hoặc khóa kết quả AI.',
  'ĐIỀU KIỆN PHÂN TÍCH: Khi tên thương mại/biệt dược được đọc rõ và hoạt chất được nhận diện đủ tin cậy, phải tiếp tục phân tích liều, cách dùng, tốc độ truyền, hiệu chỉnh thận và tương tác dù thuốc chưa có trong danh mục nội bộ. Chỉ khi chính chữ trong ảnh thật sự mờ, tên có nhiều cách hiểu hoặc không xác định được hoạt chất thì mới để trống phần không chắc và ghi cụ thể vào unclear thay vì đoán.',
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
  '- Không suy đoán thông tin không xuất hiện trong ảnh. Nếu chữ mờ/không đọc rõ, ghi "Không đọc rõ, cần xác minh thủ công" — tuyệt đối không tự bịa số liệu, không tự nối phần chữ thiếu và không dùng ngữ cảnh lâm sàng để đoán tên thuốc.',
  '- Tên thuốc, hàm lượng, liều, đường dùng và tần suất phải được đọc trực tiếp từ ảnh trong lượt phân tích này. identity.rawName phải giữ nguyên đúng phần chữ đọc được, kể cả khi chưa đầy đủ; catalogId luôn để trống để hệ thống đối chiếu sau. Không được bịa tên thuốc, sửa thành tên quen thuộc hơn hoặc đổi sang một biệt dược/generic khác.',
  '- identity.brand phải ghi tên biệt dược/tên thương mại nhận diện được; identity.activeIngredient phải là hoạt chất bạn đã dùng để đưa ra đánh giá lâm sàng. Không được bỏ qua thuốc chỉ vì tên thương mại chưa có trong danh mục nội bộ. Nếu chính việc nhận diện hoạt chất không chắc chắn thì để trống activeIngredient, đặt doseAssessment.status="không đủ dữ liệu để đánh giá", infusionRate.applicable=false, renalAdjustment.applicable=false và ghi rõ trong unclear.',
  '- Mọi kết luận về liều, truyền, thận và tương tác của một thuốc phải cùng dựa trên identity.rawName và identity.activeIngredient của chính thuốc đó. Không được phân tích theo một hoạt chất nhưng hiển thị tên thuốc khác.',
  '- Ghi chú có tiền tố "Dữ liệu thận do dược sĩ nhập" là dữ liệu có cấu trúc do người dùng cung cấp; dùng để kiểm chứng nhưng nếu xung đột với ảnh phải nêu xung đột, không tự chọn một giá trị im lặng.',
  '- Cockcroft-Gault/CKD-EPI chỉ phù hợp khi creatinine tương đối ổn định. Không đồng nhất giai đoạn CKD với ngưỡng chỉnh liều của từng thuốc. Ở thể trạng rất nhỏ/lớn, xem xét eGFR không chuẩn hóa BSA; với thuốc khoảng điều trị hẹp, ưu tiên cystatin C/mGFR hoặc TDM khi có.',
  '- Không chẩn đoán bệnh, không kê đơn thay bác sĩ, không tự quyết định ngừng/đổi thuốc.',
  '- Không tính pha loãng/pha chế dịch truyền.',
  '- Mỗi cảnh báo phải ghi ngắn gọn nguồn đã dùng. Không ghi tên nguồn như thể đã xác minh nếu không chắc; khi đó ghi rõ cần đối chiếu HDSD/quy trình bệnh viện.',
  '- Luôn trả kèm dòng miễn trừ trách nhiệm.',
  '- Trả lời bằng tiếng Việt.',
  '',
  'ĐỊNH DẠNG ĐẦU RA: Trả về DUY NHẤT một object JSON hợp lệ, không kèm văn bản khác, không dùng markdown code fence, đúng khung sau (bỏ trống mảng/field không áp dụng, không tự thêm field mới):',
  '{"patientContext":{"renalFunction":{"creatinine":"string hoặc null","crclOrEgfr":"string hoặc null","status":"ổn định|AKI/biến động|IHD|CRRT|chưa rõ","dataQuality":"đủ|thiếu|xung đột","note":"string"},"otherRelevantConditions":["string"]},"drugs":[{"name":"string","identity":{"rawName":"tên chép nguyên văn từ ảnh","status":"exact|not_found|ambiguous|unreadable","catalogId":"string hoặc rỗng","brand":"string hoặc rỗng","activeIngredient":"string hoặc rỗng","strength":"string hoặc rỗng","route":"string hoặc rỗng","registrationNumber":"string hoặc rỗng"},"orderedDose":"string","route":"string","usageNote":"string","doseAssessment":{"status":"phù hợp|cao hơn khuyến cáo|thấp hơn khuyến cáo|không đủ dữ liệu để đánh giá","detail":"string","source":"string"},"infusionRate":{"applicable":true,"rate":"string","basis":"string"},"renalAdjustment":{"applicable":true,"priority":"rà soát ngay|trong ca trực|theo dõi","warning":"string","method":"string","suggestedRegimen":"string hoặc để trống nếu chưa đủ dữ liệu","loadingDoseNote":"string","monitoring":"string","source":"string"}}],"interactions":[{"drugs":["string","string"],"severity":"chống chỉ định|nghiêm trọng cần theo dõi|cần lưu ý","mechanism":"string","recommendation":"string","source":"string"}],"unclear":["string"],"disclaimer":"string"}',
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

  var drugCatalog = sanitizeDrugCatalog(payload && payload.drugCatalog);

  try {
    var resultText = callGeminiAnalysis(images, payload.note);

    var parsed = normalizeAnalysisResult(parseModelJson(resultText));
    if (!parsed) {
      return { ok: false, message: 'AI trả về định dạng phân tích không hợp lệ. Vui lòng thử lại.' };
    }
    return { ok: true, result: enforceCatalogIdentity(parsed, drugCatalog) };
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

function callGeminiAnalysis(images, note) {
  var parts = [{
    text: 'Đọc trực tiếp và phân tích toàn bộ y lệnh trong (các) ảnh theo đúng hướng dẫn trong MỘT lượt gọi AI; chỉ trả về một object JSON hợp lệ.' +
      '\nVới từng thuốc: chép nguyên văn tên và dòng y lệnh trước; nhận diện tên biệt dược/tên thương mại cùng hoạt chất rồi phân tích đầy đủ liều, cách dùng, tốc độ truyền, thận và tương tác khi đủ rõ.' +
      '\nKhông được từ chối hoặc loại thuốc chỉ vì thuốc chưa có trong danh mục nội bộ. identity.rawName giữ đúng phần chữ nhìn thấy; identity.brand ghi tên thương mại; identity.activeIngredient ghi hoạt chất dùng để phân tích; identity.catalogId luôn để trống.' +
      '\nChỉ khi chữ trong ảnh hoặc hoạt chất thật sự không chắc chắn mới để trống phần không chắc và ghi vào unclear; không đoán phần chữ mờ, không tự hoàn thiện tên thuốc, không thay bằng tên gần giống.' +
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

function sanitizeDrugCatalog(input) {
  if (!Array.isArray(input)) return [];
  var seen = {};
  return input.slice(0, 600).map(function (item) {
    item = item || {};
    return {
      catalogId: String(item.catalogId || '').slice(0, 80),
      brand: String(item.brand || '').slice(0, 200),
      activeIngredient: String(item.activeIngredient || '').slice(0, 300),
      strength: String(item.strength || '').slice(0, 120),
      route: String(item.route || '').slice(0, 80),
      registrationNumber: String(item.registrationNumber || '').slice(0, 80)
    };
  }).filter(function (item) {
    if (!item.catalogId || !item.brand || !item.activeIngredient || seen[item.catalogId]) return false;
    seen[item.catalogId] = true;
    return true;
  });
}

function normalizeCatalogBrand(value) {
  return normalizeIdentityText(String(value || '').split('(')[0])
    .replace(/\b(?:ttkn|syt|dv|bhyt)\s*\d+\b/g, ' ')
    .replace(/\b(\d+)\s+(mg|g|mcg|ug|ml|iu|ui)\b/g, '$1$2')
    .replace(/\s+/g, ' ').trim();
}

function catalogEntriesSameIdentity(entries) {
  if (!entries.length) return false;
  var first = entries[0];
  return entries.every(function (entry) {
    return identityActiveEquivalent(entry.activeIngredient, first.activeIngredient)
      && normalizeIdentityText(entry.strength) === normalizeIdentityText(first.strength);
  });
}

function exactCatalogMatch(rawName, catalog) {
  var raw = normalizeCatalogBrand(rawName);
  if (raw.length < 4) return { status: 'unreadable', entry: null };
  var exact = catalog.filter(function (entry) { return normalizeCatalogBrand(entry.brand) === raw; });
  if (exact.length === 1 || (exact.length > 1 && catalogEntriesSameIdentity(exact))) {
    return { status: 'exact', entry: exact[0] };
  }
  if (exact.length > 1) return { status: 'ambiguous', entry: null };
  var prefix = catalog.filter(function (entry) {
    var brand = normalizeCatalogBrand(entry.brand);
    return brand.length >= 5 && (raw.indexOf(brand + ' ') === 0 || brand.indexOf(raw + ' ') === 0);
  });
  if (prefix.length === 1 || (prefix.length > 1 && catalogEntriesSameIdentity(prefix))) {
    return { status: 'exact', entry: prefix[0] };
  }
  return { status: prefix.length > 1 ? 'ambiguous' : 'not_found', entry: null };
}

function resolveCatalogIdentities(ocrDrugs, catalog) {
  return ocrDrugs.slice(0, 100).map(function (ocr) {
    ocr = ocr || {};
    var rawName = String(ocr.rawName || '').slice(0, 240);
    var match = ocr.readable === false
      ? { status: 'unreadable', entry: null }
      : catalogMatchFromOrderLine(rawName, catalog);
    if (!match.entry) {
      return {
        rawName: rawName, orderedText: String(ocr.orderedText || '').slice(0, 500),
        status: match.status, catalogId: '', brand: rawName,
        activeIngredient: '', strength: '', route: '', registrationNumber: ''
      };
    }
    return {
      rawName: rawName, orderedText: String(ocr.orderedText || '').slice(0, 500),
      status: 'exact', catalogId: match.entry.catalogId, brand: match.entry.brand,
      activeIngredient: match.entry.activeIngredient, strength: match.entry.strength,
      route: match.entry.route, registrationNumber: match.entry.registrationNumber
    };
  });
}

function normalizeIdentityText(value) {
  return String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
}

function identityActiveTokens(value) {
  var ignored = { duoi:1, dang:1, tuong:1, duong:1, natri:1, sodium:1, kali:1, potassium:1, hydrat:1, hydrate:1, hydrochlorid:1, hydrochloride:1 };
  return normalizeIdentityText(value).split(' ').map(function (token) {
    return token === 'ampicillin' ? 'ampicilin' : token;
  }).filter(function (token) { return token.length >= 4 && !ignored[token] && !/^\d/.test(token); });
}

function identityActiveEquivalent(left, right) {
  var a = identityActiveTokens(left);
  var b = identityActiveTokens(right);
  if (!a.length || !b.length) return false;
  var overlap = a.filter(function (token) { return b.indexOf(token) !== -1; }).length;
  return overlap === Math.min(a.length, b.length) && overlap / Math.max(a.length, b.length) >= 0.5;
}

function enforceCatalogIdentity(result, catalog) {
  result = result && typeof result === 'object' ? result : {};
  result.drugs = Array.isArray(result.drugs) ? result.drugs : [];
  result.unclear = Array.isArray(result.unclear) ? result.unclear : [];
  var byId = {};
  catalog.forEach(function (entry) { byId[entry.catalogId] = entry; });

  result.drugs.forEach(function (drug) {
    drug = drug || {};
    var identity = drug.identity || {};
    var entry = identity.status === 'exact' ? byId[String(identity.catalogId || '')] : null;
    if (!entry) {
      var recovered = catalogMatchFromOrderLine(identity.rawName || drug.tradeName || drug.brand || drug.name || '', catalog);
      if (recovered.entry) entry = recovered.entry;
    }
    var rawName = String(identity.rawName || drug.tradeName || drug.brand || drug.name || '');
    var declaredBrand = String(identity.brand || drug.tradeName || drug.brand || rawName);
    var declaredActive = String(identity.activeIngredient || drug.activeIngredient || drug.genericName || '');
    if (!entry) {
      drug.identity = {
        rawName: rawName,
        status: String(identity.status || (rawName ? 'exact' : 'unreadable')),
        catalogStatus: catalog.length ? 'not_found' : 'unavailable',
        catalogId: '',
        brand: declaredBrand,
        activeIngredient: declaredActive,
        strength: String(identity.strength || drug.strength || ''),
        route: String(identity.route || drug.route || ''),
        registrationNumber: String(identity.registrationNumber || '')
      };
      drug.tradeName = drug.tradeName || declaredBrand;
      drug.activeIngredient = drug.activeIngredient || declaredActive;
      if (catalog.length) {
        result.unclear.push('Thuốc "' + (rawName || 'chưa đọc rõ tên') + '" chưa có trong danh mục nội bộ; kết quả AI vẫn được giữ để dược sĩ đối chiếu.');
      }
      return;
    }

    var mismatch = declaredActive && !identityActiveEquivalent(declaredActive, entry.activeIngredient);
    if (mismatch) {
      drug.identity = {
        rawName: rawName, status: String(identity.status || 'exact'), catalogStatus: 'conflict',
        catalogId: '', brand: declaredBrand, activeIngredient: declaredActive,
        strength: String(identity.strength || drug.strength || ''),
        route: String(identity.route || drug.route || ''),
        registrationNumber: String(identity.registrationNumber || ''),
        catalogReference: {
          catalogId: entry.catalogId, brand: entry.brand, activeIngredient: entry.activeIngredient,
          strength: entry.strength, route: entry.route, registrationNumber: entry.registrationNumber
        }
      };
      result.unclear.push('Cần đối chiếu thuốc "' + (rawName || declaredBrand) + '": AI nhận hoạt chất "' + declaredActive + '" nhưng danh mục nội bộ ghi "' + entry.activeIngredient + '". Kết quả AI không bị khóa.');
      return;
    }

    drug.identity = {
      rawName: rawName, status: 'exact', catalogStatus: 'matched',
      catalogId: entry.catalogId, brand: entry.brand,
      activeIngredient: entry.activeIngredient, strength: entry.strength,
      route: entry.route, registrationNumber: entry.registrationNumber
    };
    drug.tradeName = entry.brand;
    drug.activeIngredient = entry.activeIngredient;
    drug.name = entry.brand + ' (' + entry.activeIngredient + (entry.strength ? '; ' + entry.strength : '') + ')';
  });

  result.unclear = result.unclear.filter(function (item, index, array) { return item && array.indexOf(item) === index; });
  return result;
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

/** Tìm một fragment JSON cân bằng trong text, có xử lý chuỗi và ký tự escape. */
function extractBalancedJsonFragment(text, startIndex) {
  var source = String(text || '');
  var opener = source.charAt(startIndex);
  var closer = opener === '{' ? '}' : opener === '[' ? ']' : '';
  if (!closer) return '';
  var depth = 0;
  var inString = false;
  var escaped = false;
  for (var i = startIndex; i < source.length; i++) {
    var ch = source.charAt(i);
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === opener) depth++;
    if (ch === closer) {
      depth--;
      if (depth === 0) return source.slice(startIndex, i + 1);
    }
  }
  return '';
}

/** Parse JSON chịu được markdown fence hoặc phần giải thích thừa trước/sau JSON. */
function parseModelJson(text) {
  var raw = String(text || '').trim();
  if (!raw) return null;
  var cleaned = raw
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/^\s*json\s*[:\-]?\s*/i, '')
    .trim();

  var candidates = [cleaned];
  var starts = [];
  var objectStart = cleaned.indexOf('{');
  var arrayStart = cleaned.indexOf('[');
  if (objectStart >= 0) starts.push(objectStart);
  if (arrayStart >= 0) starts.push(arrayStart);
  starts.sort(function (a, b) { return a - b; });
  starts.forEach(function (index) {
    var fragment = extractBalancedJsonFragment(cleaned, index);
    if (fragment) candidates.push(fragment);
  });

  for (var i = 0; i < candidates.length; i++) {
    try { return JSON.parse(candidates[i]); } catch (e) {}
  }
  return null;
}

function normalizeIdentityDrugRow(item) {
  if (typeof item === 'string') {
    return { rawName: item.trim(), orderedText: item.trim(), readable: true };
  }
  item = item && typeof item === 'object' ? item : {};
  var rawName = String(item.rawName || item.name || item.drug || item.medicine || item.medication || item.tradeName || item.brand || '').trim();
  var orderedText = String(item.orderedText || item.order || item.line || item.text || item.doseLine || rawName).trim();
  if (!rawName) return null;
  return { rawName: rawName, orderedText: orderedText, readable: item.readable !== false };
}

function identityRowsFromParsed(parsed) {
  if (!parsed) return [];
  var rows = [];
  if (Array.isArray(parsed)) rows = parsed;
  else if (Array.isArray(parsed.drugs)) rows = parsed.drugs;
  else if (Array.isArray(parsed.medications)) rows = parsed.medications;
  else if (Array.isArray(parsed.medicines)) rows = parsed.medicines;
  else if (Array.isArray(parsed.items)) rows = parsed.items;
  else if (parsed.drugs && typeof parsed.drugs === 'object') rows = Object.keys(parsed.drugs).map(function (key) { return parsed.drugs[key]; });
  return rows.map(normalizeIdentityDrugRow).filter(function (row) { return row && row.rawName; });
}

function catalogMatchFromOrderLine(rawText, catalog) {
  var direct = exactCatalogMatch(rawText, catalog);
  if (direct.entry || direct.status === 'ambiguous') return direct;

  var normalizedLine = ' ' + normalizeIdentityText(rawText) + ' ';
  var matches = catalog.filter(function (entry) {
    var brand = normalizeCatalogBrand(entry.brand);
    return brand.length >= 4 && normalizedLine.indexOf(' ' + brand + ' ') !== -1;
  });
  if (matches.length === 1 || (matches.length > 1 && catalogEntriesSameIdentity(matches))) {
    matches.sort(function (a, b) { return normalizeCatalogBrand(b.brand).length - normalizeCatalogBrand(a.brand).length; });
    return { status: 'exact', entry: matches[0] };
  }
  return { status: matches.length > 1 ? 'ambiguous' : direct.status, entry: null };
}

function looseRawNameFromLine(line) {
  var value = String(line || '').trim()
    .replace(/^[-*•]+\s*/, '')
    .replace(/^\d+[.)\-:]\s*/, '')
    .replace(/^["']?(?:rawName|name|drug|medicine|medication|thuoc|tên thuốc)["']?\s*[:=]\s*/i, '')
    .replace(/^["']|["'],?$/g, '')
    .trim();
  if (!value || value.length < 3 || value.length > 240) return '';
  var doseIndex = value.search(/\s(?:\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ml|mL|iu|ui|đv|%|lọ|lo|ống|ong|viên|vien)\b|x\s*\d+\b)/i);
  if (doseIndex > 2) value = value.slice(0, doseIndex).trim();
  if (/^(?:drugs?|medications?|medicines?|result|json|object|danh sach|danh sách)\b/i.test(value)) return '';
  return value;
}

/**
 * Fallback định danh: đọc text thô từng dòng và ưu tiên đối chiếu tên thuốc
 * trực tiếp với danh mục nội trú. Không suy diễn hoạt chất từ kiến thức model.
 */
function fallbackParseIdentityText(text, catalog) {
  var raw = String(text || '').replace(/```(?:json)?/gi, '').replace(/```/g, '');
  var lines = raw.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
  var rows = [];
  var seen = {};

  function pushRow(rawName, orderedText) {
    rawName = String(rawName || '').trim();
    if (!rawName) return;
    var key = normalizeIdentityText(rawName);
    if (seen[key]) return;
    seen[key] = true;
    rows.push({ rawName: rawName, orderedText: String(orderedText || rawName).slice(0, 500), readable: true });
  }

  lines.forEach(function (line) {
    var match = catalogMatchFromOrderLine(line, catalog);
    if (match.entry) {
      pushRow(match.entry.brand, line);
      return;
    }
    var keyed = line.match(/["']?(?:rawName|name|drug|medicine|medication|thuoc|tên thuốc)["']?\s*[:=]\s*["']?([^"',}\]]{3,240})/i);
    if (keyed && keyed[1]) {
      pushRow(looseRawNameFromLine(keyed[1]) || keyed[1], line);
      return;
    }
    if (/\b\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ml|mL|iu|ui|đv|%|lọ|lo|ống|ong|viên|vien)\b/i.test(line)) {
      var loose = looseRawNameFromLine(line);
      if (loose) pushRow(loose, line);
    }
  });

  if (!rows.length && raw) {
    var normalizedWhole = ' ' + normalizeIdentityText(raw) + ' ';
    catalog.forEach(function (entry) {
      var brand = normalizeCatalogBrand(entry.brand);
      if (brand.length >= 4 && normalizedWhole.indexOf(' ' + brand + ' ') !== -1) pushRow(entry.brand, entry.brand);
    });
  }
  return rows.slice(0, 100);
}

function parseIdentityModelOutput(text, catalog) {
  var parsedRows = identityRowsFromParsed(parseModelJson(text));
  var fallbackRows = fallbackParseIdentityText(text, catalog || []);
  var rows = [];
  var seen = {};
  parsedRows.concat(fallbackRows).forEach(function (row) {
    var key = normalizeIdentityText(row.rawName);
    if (!row.rawName || seen[key]) return;
    seen[key] = true;
    rows.push(row);
  });
  return { drugs: rows.slice(0, 100) };
}

function normalizeAnalysisResult(parsed) {
  if (!parsed) return null;
  if (Array.isArray(parsed)) return { drugs: parsed, interactions: [], unclear: [] };
  if (typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed.drugs)) {
    if (Array.isArray(parsed.medications)) parsed.drugs = parsed.medications;
    else if (Array.isArray(parsed.medicines)) parsed.drugs = parsed.medicines;
    else if (parsed.drugs && typeof parsed.drugs === 'object') parsed.drugs = Object.keys(parsed.drugs).map(function (key) { return parsed.drugs[key]; });
    else parsed.drugs = [];
  }
  if (!Array.isArray(parsed.interactions)) parsed.interactions = [];
  if (!Array.isArray(parsed.unclear)) parsed.unclear = [];
  return parsed;
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
