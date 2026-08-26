(function () {
  'use strict';

  const SOURCE = 'Cơ sở dữ liệu Kháng sinh – Chỉnh liều Thận, cập nhật 23/07/2026 (nguồn nền ghi trong tệp: Sanford Guide 2025 / Renal Drug Handbook 5th Ed.)';
  const data = {
    vancomycin: {
      active: 'Vancomycin', referenceBrand: 'Vancocin', standard: '15–20 mg/kg mỗi 8–12 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '1 g mỗi 12 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '1 g mỗi 24 giờ hoặc 15–20 mg/kg mỗi 24 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '1 g mỗi 48 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '1 g mỗi 72 giờ hoặc hiệu chỉnh theo TDM' }
      ],
      hd: { load: '15–20 mg/kg', maintenance: '500–1.000 mg định kỳ dựa trên TDM trước lọc', post: 'Thường bổ sung 500 mg sau HD nếu dùng chế độ liều chuẩn; ưu tiên TDM', note: 'Màng high-flux có thể loại khoảng 20–30% vancomycin.' },
      crrt: { cvvh: '1 g mỗi 24 giờ (hoặc nạp 15 mg/kg, duy trì theo TDM)', cvvhd: '1 g mỗi 24 giờ (hoặc duy trì theo TDM)', cvvhdf: '1–1,5 g mỗi 24 giờ hoặc truyền liên tục 20–25 mg/kg/24 giờ', note: 'TDM rất quan trọng vì độ thanh thải qua CRRT biến động.' },
      tdm: 'AUC/MIC 400–600; nồng độ đáy 15–20 mcg/mL ở nhiễm trùng nặng hoặc 10–15 mcg/mL ở nhiễm trùng thông thường. Lấy mẫu ngay trước liều thứ 4 khi đạt trạng thái ổn định; suy thận tiến triển cần đo lại sớm hơn.',
      safety: { accumulation: 'Rất cao khi suy thận', renal: 'Cao; tăng khi phối hợp aminoglycosid hoặc lợi tiểu', neuro: 'Thấp', priority: 'Mức 1', monitoring: 'Theo dõi TDM đáy/AUC và creatinin mỗi 48 giờ.' }
    },
    meropenem: {
      active: 'Meropenem', referenceBrand: 'Meronem', standard: '1 g mỗi 8 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '1 g mỗi 8 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '1 g mỗi 12 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '500 mg mỗi 12 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '500 mg mỗi 24 giờ' }
      ],
      hd: { load: '1 g', maintenance: '500 mg mỗi 24 giờ', post: 'Dùng ngay sau buổi lọc máu vào ngày chạy thận', note: 'Bị loại đáng kể qua màng lọc hiệu năng cao.' },
      crrt: { cvvh: '1 g mỗi 12 giờ', cvvhd: '1 g mỗi 12 giờ', cvvhdf: '1 g mỗi 8–12 giờ', note: 'Có thể dùng 1 g mỗi 8 giờ trong nhiễm khuẩn nặng do Pseudomonas hoặc vi khuẩn đề kháng.' },
      safety: { accumulation: 'Tích lũy khi liều cao', renal: 'Thấp', neuro: 'Trung bình; nguy cơ co giật nếu không chỉnh liều', priority: 'Mức 2', monitoring: 'Theo dõi triệu chứng thần kinh trung ương ở bệnh nhân suy thận nặng.' }
    },
    imipenem_cilastatin: {
      active: 'Imipenem/Cilastatin', referenceBrand: 'Tienam', standard: '500 mg mỗi 6 giờ hoặc 1 g mỗi 8 giờ (tính theo thành phần imipenem)',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '500 mg mỗi 6 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '250 mg mỗi 6 giờ hoặc 500 mg mỗi 8 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '250 mg mỗi 8 giờ hoặc 500 mg mỗi 12 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '250 mg mỗi 12 giờ' }
      ],
      hd: { load: '500 mg–1 g', maintenance: '250 mg mỗi 12–24 giờ', post: 'Bổ sung sau HD nếu thời điểm dùng trùng buổi lọc', note: 'Nguy cơ co giật tăng khi tích lũy ở bệnh nhân vô niệu.' },
      crrt: { cvvh: '500 mg mỗi 8 giờ', cvvhd: '500 mg mỗi 8 giờ', cvvhdf: '500 mg mỗi 6–8 giờ', note: 'Theo dõi sát độc tính thần kinh trung ương và co giật.' },
      safety: { accumulation: 'Tích lũy mạnh', renal: 'Thấp', neuro: 'Cao; nguy cơ co giật ở bệnh nhân suy thận', priority: 'Mức 1', monitoring: 'Hạn chế dùng khi CrCl <15 mL/phút; cân nhắc lựa chọn khác nếu có tiền sử co giật.' }
    },
    ceftazidime: {
      active: 'Ceftazidime', referenceBrand: 'Fortum', standard: '2 g mỗi 8 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '2 g mỗi 8 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '1 g mỗi 12 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '1 g mỗi 24 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '500 mg mỗi 24 giờ hoặc mỗi 48 giờ' }
      ],
      hd: { load: '1 g', maintenance: '500 mg mỗi 24 giờ', post: '500 mg sau mỗi buổi lọc máu', note: 'Thải trừ mạnh qua HD.' },
      crrt: { cvvh: '1–2 g mỗi 12 giờ', cvvhd: '1 g mỗi 12 giờ', cvvhdf: '2 g mỗi 12 giờ hoặc 1 g mỗi 8 giờ', note: 'Cân nhắc liều tối đa khi điều trị Pseudomonas aeruginosa.' },
      safety: { accumulation: 'Tích lũy trung bình', renal: 'Thấp', neuro: 'Thấp đến trung bình', priority: 'Mức 2', monitoring: 'Theo dõi chức năng thận định kỳ.' }
    },
    piperacillin_tazobactam: {
      active: 'Piperacillin/Tazobactam', referenceBrand: 'Zosyn', standard: '4,5 g mỗi 6 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '4,5 g mỗi 6 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '3,375 g mỗi 6 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '2,25 g mỗi 6 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '2,25 g mỗi 8 giờ' }
      ],
      hd: { load: '4,5 g', maintenance: '2,25 g mỗi 8 giờ hoặc 3,375 g mỗi 12 giờ', post: 'Bổ sung 0,75 g sau mỗi chu kỳ HD', note: 'HD loại khoảng 30% piperacillin và 40% tazobactam.' },
      crrt: { cvvh: '3,375 g mỗi 8 giờ hoặc 4,5 g mỗi 8 giờ', cvvhd: '3,375 g mỗi 8 giờ', cvvhdf: '4,5 g mỗi 8 giờ hoặc truyền kéo dài 4 giờ', note: 'Ưu tiên truyền kéo dài khi phác đồ bệnh viện cho phép để tối ưu fT>MIC.' },
      safety: { accumulation: 'Tích lũy trung bình', renal: 'Thấp; tăng khi phối hợp vancomycin', neuro: 'Thấp; co giật khi liều rất cao', priority: 'Mức 2', monitoring: 'Theo dõi tổn thương thận cấp khi phối hợp vancomycin.' }
    },
    amikacin: {
      active: 'Amikacin', referenceBrand: 'Amikin', standard: '15 mg/kg mỗi 24 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '15 mg/kg mỗi 24 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '7,5 mg/kg mỗi 24 giờ hoặc kéo dài khoảng cách theo TDM' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '7,5 mg/kg mỗi 48 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '7,5 mg/kg mỗi 72 giờ hoặc hiệu chỉnh theo TDM' }
      ],
      hd: { load: '7,5–10 mg/kg', maintenance: 'Theo TDM trước lọc', post: '5–7,5 mg/kg sau mỗi buổi lọc máu', note: 'Bắt buộc theo dõi nồng độ đỉnh và đáy.' },
      crrt: { cvvh: '7,5–10 mg/kg mỗi 24 giờ', cvvhd: '7,5–10 mg/kg mỗi 24 giờ', cvvhdf: '10 mg/kg mỗi 24 giờ', note: 'Cần TDM thường quy để tránh tích lũy.' },
      tdm: 'Chế độ 1 lần/ngày: đỉnh 60–80 mcg/mL, đáy <1–2 mcg/mL. Chế độ chia liều: đỉnh 20–30 mcg/mL, đáy <5 mcg/mL. Đỉnh lấy 30 phút sau khi kết thúc truyền 30 phút; đáy lấy ngay trước liều tiếp theo.',
      safety: { accumulation: 'Rất cao', renal: 'Rất cao; nguy cơ tổn thương ống thận cấp', neuro: 'Độc tính thính giác và tiền đình cao', priority: 'Mức 1', monitoring: 'Đo TDM đỉnh/đáy; giới hạn thời gian điều trị theo đánh giá lâm sàng.' }
    },
    levofloxacin: {
      active: 'Levofloxacin', referenceBrand: 'Tavanic', standard: '750 mg mỗi 24 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '750 mg mỗi 24 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '750 mg liều đầu, sau đó 750 mg mỗi 48 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '500 mg liều đầu, sau đó 250 mg mỗi 48 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '500 mg liều đầu, sau đó 250 mg mỗi 48 giờ' }
      ],
      hd: { load: '500–750 mg', maintenance: '250–500 mg mỗi 48 giờ', post: 'Không cần liều bổ sung đặc hiệu; dùng sau HD', note: 'Tránh dùng lịch hàng ngày ở bệnh nhân HD.' },
      crrt: { cvvh: '500 mg mỗi 24 giờ', cvvhd: '500 mg mỗi 24 giờ', cvvhdf: '500–750 mg mỗi 24 giờ', note: 'Độ thanh thải qua CRRT cao hơn HD ngắt quãng.' },
      safety: { accumulation: 'Tích lũy trung bình', renal: 'Thấp', neuro: 'Thấp đến trung bình; có thể kích thích thần kinh hoặc gây ảo giác', priority: 'Mức 2', monitoring: 'Giảm liều hoặc kéo dài khoảng cách để tránh tích lũy.' }
    },
    ciprofloxacin: {
      active: 'Ciprofloxacin', referenceBrand: 'Ciprobay', standard: '400 mg IV mỗi 8–12 giờ', ivOnly: true,
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '400 mg IV mỗi 12 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '400 mg IV mỗi 12 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '400 mg IV mỗi 24 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '400 mg IV mỗi 24 giờ' }
      ],
      hd: { load: '400 mg IV hoặc 500 mg uống', maintenance: '400 mg IV mỗi 24 giờ hoặc 500 mg uống mỗi 24 giờ', post: 'Không cần liều bổ sung', note: 'Thải trừ qua HD thấp; dùng sau HD.' },
      crrt: { cvvh: '400 mg IV mỗi 12 giờ', cvvhd: '400 mg IV mỗi 12 giờ', cvvhdf: '400 mg IV mỗi 8–12 giờ', note: 'CRRT làm tăng độ thanh thải; dùng liều gần liều thường.' },
      safety: { accumulation: 'Tích lũy thấp', renal: 'Thấp; hiếm gặp viêm thận kẽ', neuro: 'Thấp', priority: 'Mức 2', monitoring: 'Đảm bảo đủ nước để giảm nguy cơ tinh thể niệu.' }
    },
    colistin: {
      active: 'Colistin (CMS)', referenceBrand: 'Colistat', standard: 'Liều nạp 9 MIU, sau đó 4,5 MIU mỗi 12 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '4,5 MIU mỗi 12 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '2,5–3,5 MIU mỗi 12 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '1,5–2,5 MIU mỗi 12 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '1–1,5 MIU mỗi 24 giờ' }
      ],
      hd: { load: '9 MIU', maintenance: '2,25–3 MIU mỗi 24 giờ', post: 'Bổ sung 1,5 MIU sau mỗi buổi HD', note: 'Xác nhận đơn vị CMS/colistin của đúng chế phẩm trước dùng.' },
      crrt: { cvvh: '4,5 MIU mỗi 12 giờ', cvvhd: '4,5 MIU mỗi 12 giờ', cvvhdf: '4,5 MIU mỗi 12 giờ hoặc cao hơn theo chuyên gia', note: 'Có thể bị hấp phụ và loại qua quả lọc CRRT.' },
      safety: { accumulation: 'Rất cao', renal: 'Rất cao; độc tính ống thận liên quan liều', neuro: 'Cao; dị cảm, yếu cơ, ức chế hô hấp', priority: 'Mức 1', monitoring: 'Theo dõi lượng nước tiểu và dấu hiệu yếu cơ hằng ngày.' }
    },
    metronidazole: {
      active: 'Metronidazole', referenceBrand: 'Flagyl', standard: '500 mg mỗi 8 giờ',
      bands: [
        { label: 'CrCl ≥50 mL/phút', min: 50, max: Infinity, text: '500 mg mỗi 8 giờ' },
        { label: 'CrCl 30–49 mL/phút', min: 30, max: 50, text: '500 mg mỗi 8 giờ' },
        { label: 'CrCl 15–29 mL/phút', min: 15, max: 30, text: '500 mg mỗi 8 giờ' },
        { label: 'CrCl <15 mL/phút (chưa lọc máu)', min: 0, max: 15, text: '500 mg mỗi 12 giờ' }
      ],
      hd: { load: '500 mg', maintenance: '500 mg mỗi 12 giờ hoặc 250 mg mỗi 8 giờ', post: 'Dùng liều theo phác đồ ngay sau HD', note: 'Metronidazole và chất chuyển hóa có thể bị loại qua HD.' },
      crrt: { cvvh: '500 mg mỗi 12 giờ', cvvhd: '500 mg mỗi 12 giờ', cvvhdf: '500 mg mỗi 8–12 giờ', note: 'Độ thanh thải được phục hồi trong CRRT.' },
      safety: { accumulation: 'Thấp', renal: 'Không', neuro: 'Thấp đến trung bình', priority: 'Mức 3', monitoring: 'Theo dõi dấu hiệu thần kinh ngoại biên nếu điều trị kéo dài.' }
    }
  };

  const norm = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  function keyOf(active) {
    const value = norm(active).replace(/hydrochloride|hydrochlorid/g, '').replace(/\*/g, '').trim();
    if (value.includes('spiramycin')) return '';
    if (value.includes('vancomycin')) return 'vancomycin';
    if (value.includes('meropenem')) return 'meropenem';
    if (value.includes('imipenem')) return 'imipenem_cilastatin';
    if (value.includes('ceftazidim')) return 'ceftazidime';
    if (value.includes('piperacilin') || value.includes('piperacillin')) return 'piperacillin_tazobactam';
    if (value.includes('amikacin')) return 'amikacin';
    if (value.includes('levofloxacin')) return 'levofloxacin';
    if (value.includes('ciprofloxacin')) return 'ciprofloxacin';
    if (value.includes('colistin')) return 'colistin';
    if (value.includes('metronidazol')) return 'metronidazole';
    return '';
  }
  function routeCompatible(entry, route) {
    return !(entry?.ivOnly && norm(route).includes('uong'));
  }
  function match(active, route) {
    const key = keyOf(active), entry = data[key];
    return entry && routeCompatible(entry, route) ? { key, entry } : null;
  }
  function hdText(entry) {
    const hd = entry.hd;
    return `Liều nạp: ${hd.load}. Liều duy trì: ${hd.maintenance}. Sau HD: ${hd.post}. ${hd.note}`;
  }
  function crrtText(entry) {
    const crrt = entry.crrt;
    return `CVVH: ${crrt.cvvh}. CVVHD: ${crrt.cvvhd}. CVVHDF: ${crrt.cvvhdf}. ${crrt.note}`;
  }

  const fallbackGet = window.VPMED_GET_RENAL_DOSE;
  window.VPMED_GET_RENAL_DOSE = function (active, crcl, route) {
    const found = match(active, route);
    if (found) {
      const hit = found.entry.bands.find(band => crcl >= band.min && crcl < band.max) || found.entry.bands[found.entry.bands.length - 1];
      return { standard: found.entry.standard, rules: found.entry.bands, hit, hd: hdText(found.entry), crrt: crrtText(found.entry), verified: SOURCE };
    }
    return typeof fallbackGet === 'function' ? fallbackGet(active, crcl, route) : null;
  };

  (window.VPMED_DRUGS || []).forEach(drug => {
    const found = match(drug.active, drug.route);
    if (!found) return;
    const { key, entry } = found;
    if (key === 'vancomycin') return; // Mô-đun Vancomycin chuyên biệt giữ nguyên nguồn và chỉ cập nhật 4 mức CrCl.
    drug.renal = entry.bands.map(band => `${band.label}: ${band.text}`);
    drug.hd = hdText(entry);
    drug.crrt = crrtText(entry);
    if (entry.tdm) drug.tdm = entry.tdm;
  });

  window.VPMED_RENAL_DATABASE_20260723 = data;
  window.VPMED_RENAL_DB_MATCH = match;
})();
