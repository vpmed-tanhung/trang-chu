
/* ===== Module: Liều Kháng sinh Trẻ em (Nelson 2026) — namespaced với prefix nls/NLS_ ===== */

/* ════════════════════════════════════════════════════════
   DATA – Chapter 2 (Neonatal) + Chapter 18 (Pediatric)
   ════════════════════════════════════════════════════════ */
const NLS_DRUGS = [

/* ─── CHAPTER 2 – NEONATAL DOSING ─── */
{
  id:"ampicillin_neo",
  name:"Ampicillin (Sơ sinh)",
  nameNorm:"ampicillin so sinh",
  tradeName:"Ampicillin sodium",
  class:"Beta-lactam – Penicillin",
  classNorm:"beta lactam penicillin so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày – Thông thường",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày – Thông thường",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày – Thông thường",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày – Thông thường",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày – Thông thường",ageDays:[29,60],route:"IV, IM",dose:"200 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày – Viêm màng não GBS",ageDays:[0,7],weightMax:2,route:"IV",dose:"300 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày – Viêm màng não GBS",ageDays:[8,28],weightMax:2,route:"IV",dose:"300 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày – Viêm màng não GBS",ageDays:[0,7],weightMin:2,route:"IV",dose:"300 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày – Viêm màng não GBS",ageDays:[8,28],weightMin:2,route:"IV",dose:"300 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày – Viêm màng não GBS",ageDays:[29,60],route:"IV",dose:"300 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Phối hợp hiệp đồng kinh điển với gentamicin trong điều trị kinh nghiệm; <strong>Không có hoạt tính với vi khuẩn sinh beta-lactamase</strong> (ESBL, S. aureus); Liều viêm màng não GBS cao hơn nhiễm khuẩn huyết thông thường",
  maxDose:"300 mg/kg/ngày (GBS meningitis) | 200 mg/kg/ngày (29–60 ngày thông thường)",
  citation:"[4] Nelson’s 2026 Ch.2B",
  indications:"Điều trị kinh nghiệm nhiễm khuẩn sơ sinh sớm và muộn (phối hợp aminoglycoside); Viêm màng não do GBS và Listeria monocytogenes; Nhiễm khuẩn huyết và tiết niệu sơ sinh"
},
{
  id:"cefazolin_ent_neo",
  name:"Cefazolin – Enterobacterales (Sơ sinh)",
  nameNorm:"cefazolin enterobacterales so sinh",
  tradeName:"Ancef",
  class:"Beta-lactam – Cephalosporin thế hệ 1",
  classNorm:"beta lactam cephalosporin the he 1",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"50 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM",dose:"100–150 mg/kg/ngày",interval:"Mỗi 6–8 giờ",notes:""}
  ],
  generalNotes:"Thấm kém vào dịch não tủy — chỉ dùng khi không có tổn thương thần kinh trung ương; <strong>Chỉ phù hợp khi MIC ≤ 4 mg/L</strong>; MIC ≤2 mg/L áp dụng liều như MSSA",
  maxDose:"12 g/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm Enterobacterales nhạy cảm (E. coli, Klebsiella) ở sơ sinh khi MIC đủ thấp; Nhiễm khuẩn tiết niệu sơ sinh do gram âm nhạy cảm; Là kháng sinh xuống thang phù hợp khi vi khuẩn nhạy cảm xác định"
},
{
  id:"cefazolin_mssa_neo",
  name:"Cefazolin – MSSA (Sơ sinh)",
  nameNorm:"cefazolin mssa so sinh",
  tradeName:"Ancef",
  class:"Beta-lactam – Cephalosporin thế hệ 1",
  classNorm:"beta lactam cephalosporin the he 1",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"50 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"50 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Hoạt tính diệt khuẩn tốt trên MSSA, độc tính thấp; <strong>Không dùng khi nghi ngờ MRSA</strong> hoặc vi khuẩn sinh beta-lactamase mạnh; Liều tăng gấp đôi khi viêm màng não",
  maxDose:"12 g/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn do MSSA ở sơ sinh; Lựa chọn thay thế nafcillin; Nhiễm khuẩn da mô mềm và xương khớp do tụ cầu nhạy methicillin"
},
{
  id:"cefepime_neo",
  name:"Cefepime (Sơ sinh)",
  nameNorm:"cefepime so sinh",
  tradeName:"Maxipime",
  class:"Beta-lactam – Cephalosporin thế hệ 4",
  classNorm:"beta lactam cephalosporin the he 4",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"60 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"60 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Truyền 3 giờ hoặc 200 mg/kg/ngày mỗi 6 giờ nếu MIC 8 mg/L"}
  ],
  generalNotes:"Hoạt tính gram dương tốt hơn ceftazidime, vẫn hiệu quả trên Pseudomonas; <strong>Truyền kéo dài 3 giờ khi MIC đạt 8 mg/L</strong>; Không có khác biệt đáng kể về độ an toàn so với ceftazidime",
  maxDose:"6 g/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn gram âm nặng nghi Pseudomonas ở sơ sinh; Nhiễm khuẩn huyết bệnh viện trong hồi sức sơ sinh; Nhiễm khuẩn huyết bệnh viện trong đơn vị hồi sức sơ sinh"
},
{
  id:"cefotaxime_neo",
  name:"Cefotaxime (Sơ sinh)",
  nameNorm:"cefotaxime so sinh",
  tradeName:"Claforan",
  class:"Beta-lactam – Cephalosporin thế hệ 3",
  classNorm:"beta lactam cephalosporin the he 3",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM",dose:"200 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Thấm tốt vào dịch não tủy, lựa chọn kinh điển phối hợp ampicillin; <strong>Ceftriaxone hoặc meropenem là lựa chọn thay thế phù hợp</strong>; Hiện không còn sản xuất tại một số thị trường — kiểm tra tình trạng cung ứng",
  maxDose:"12 g/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Viêm màng não sơ sinh gram âm (phối hợp ampicillin); Nhiễm khuẩn huyết sơ sinh do gram âm nhạy cảm; Phối hợp ampicillin trong phác đồ kinh nghiệm ban đầu"
},
{
  id:"ceftazidime_neo",
  name:"Ceftazidime (Sơ sinh)",
  nameNorm:"ceftazidime so sinh",
  tradeName:"Tazicef, Fortaz",
  class:"Beta-lactam – Cephalosporin thế hệ 3 (anti-Pseudomonas)",
  classNorm:"beta lactam cephalosporin the he 3 pseudomonas",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Dùng liều 0–7 ngày đến 14 ngày nếu cân nặng <1000g"},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Hoạt tính kháng Pseudomonas mạnh, lựa chọn hàng đầu khi nghi ngờ tác nhân này; <strong>Truyền kéo dài 3 giờ khi MIC tăng cao</strong> để tối ưu %T>MIC; Có thể giảm liều khi Enterobacterales MIC ≤4 mg/L",
  maxDose:"6–8 g/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn nặng do Pseudomonas aeruginosa ở sơ sinh; Nhiễm gram âm đa kháng; Nhiễm khuẩn bệnh viện trong môi trường hồi sức sơ sinh"
},
{
  id:"ceftriaxone_neo",
  name:"Ceftriaxone (Sơ sinh)",
  nameNorm:"ceftriaxone so sinh",
  tradeName:"Rocephin",
  class:"Beta-lactam – Cephalosporin thế hệ 3",
  classNorm:"beta lactam cephalosporin the he 3",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"50 mg/kg/liều",interval:"Mỗi 24 giờ",notes:"Thường tránh dùng trong sơ sinh"},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"50 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM",dose:"50 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"⛔ <strong>CHỐNG CHỈ ĐỊNH tuyệt đối khi truyền dung dịch chứa canxi tĩnh mạch</strong> — nguy cơ tắc mạch phổi, tử vong; Tránh dùng khi tăng bilirubin máu chưa điều trị; Chỉ chuyển ngoại trú khi bệnh nhân đã ổn định lâm sàng đủ điều kiện",
  maxDose:"2 g/liều",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Chuyển ngoại trú nhiễm khuẩn huyết GBS đã ổn định; Lậu cầu sơ sinh; Giang mai bẩm sinh (liều đặc biệt)"
},
{
  id:"clindamycin_neo",
  name:"Clindamycin (Sơ sinh)",
  nameNorm:"clindamycin so sinh",
  tradeName:"Cleocin",
  class:"Lincosamide",
  classNorm:"lincosamide",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, IM, PO",dose:"15 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, IM, PO",dose:"15 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM, PO",dose:"21 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM, PO",dose:"27 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM, PO",dose:"30 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Thay thế hợp lý cho MRSA nhạy cảm, thêm phổ yếm khí; <strong>Bắt buộc D-test trước khi dùng cho MRSA</strong> để loại trừ kháng cảm ứng; Theo dõi nguy cơ viêm đại tràng do C. difficile",
  maxDose:"2.7 g/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm MRSA ở sơ sinh khi cần thay thế vancomycin (vi khuẩn nhạy cảm); Nhiễm khuẩn da mô mềm; Nhiễm khuẩn yếm khí"
},
{
  id:"fluconazole_neo",
  name:"Fluconazole (Sơ sinh)",
  nameNorm:"fluconazole so sinh",
  tradeName:"Diflucan",
  class:"Antifungal – Azole",
  classNorm:"antifungal azole",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"Điều trị – tất cả nhóm",ageDays:[0,60],route:"IV, PO",dose:"12 mg/kg/ngày (LD: 25 mg/kg nếu GA≥30w; LD 9 mg/kg nếu <30w)",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",label:"Dự phòng – tất cả nhóm",ageDays:[0,60],route:"IV, PO",dose:"6 mg/kg/liều",interval:"2 lần/tuần",notes:""}
  ],
  generalNotes:"Thanh thải biến thiên ở sơ sinh non tháng, cần liều nạp đạt nồng độ ổn định nhanh; <strong>Ưu tiên amphotericin B liposomal/micafungin khi nghi TKTW hoặc kháng azole</strong>; Liều nạp khác nhau theo tuổi thai: GA ≥30 tuần dùng 25 mg/kg, GA <30 tuần dùng 9 mg/kg",
  maxDose:"12 mg/kg/ngày (điều trị), 6 mg/kg 2×/tuần (dự phòng)",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Candidiasis xâm lấn sơ sinh (huyết, màng não, nội tâm mạc); Dự phòng nấm xâm lấn ở sơ sinh non tháng nguy cơ cao; Dự phòng nấm xâm lấn ở sơ sinh non tháng nguy cơ cao"
},
{
  id:"gentamicin_neo",
  name:"Gentamicin – Aminoglycoside (Sơ sinh)",
  nameNorm:"gentamicin aminoglycoside so sinh",
  tradeName:"Garamycin",
  class:"Aminoglycoside",
  classNorm:"aminoglycoside",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",gaRequired:true,gaGroup:"lt30",pnaGroup:"0-14",label:"<30 tuần thai, 0–14 ngày",ageDays:[0,14],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 48 giờ",notes:"GA <30 tuần"},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"lt30",pnaGroup:"gt14",label:"<30 tuần thai, >14 ngày",ageDays:[15,60],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 36 giờ",notes:"GA <30 tuần"},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"30-34",pnaGroup:"0-10",label:"30–34 tuần thai, 0–10 ngày",ageDays:[0,10],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 36 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"30-34",pnaGroup:"gt10",label:"30–34 tuần thai, >10 ngày",ageDays:[11,60],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"ge35",pnaGroup:"0-7",label:"≥35 tuần thai, 0–7 ngày",ageDays:[0,7],route:"IV, IM",dose:"4 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"ge35",pnaGroup:"gt7",label:"≥35 tuần thai, >7 ngày",ageDays:[8,60],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"Phối hợp hiệp đồng kinh điển với ampicillin, hiệu quả phụ thuộc Cmax:MIC ≥8–10; <strong>Theo dõi sát chức năng thận và thính giác</strong>; Tránh phối hợp furosemide",
  maxDose:"Theo TDM",
  citation:"[4] Nelson's 2026 Ch.2C",
  indications:"Điều trị kinh nghiệm nhiễm khuẩn sơ sinh sớm/muộn (phối hợp ampicillin); Nhiễm khuẩn gram âm sơ sinh; Viêm màng não gram âm phối hợp beta-lactam"
},
{
  id:"amikacin_neo",
  name:"Amikacin – Aminoglycoside (Sơ sinh)",
  nameNorm:"amikacin aminoglycoside so sinh",
  tradeName:"Amikin",
  class:"Aminoglycoside",
  classNorm:"aminoglycoside",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",gaRequired:true,gaGroup:"lt30",pnaGroup:"0-14",label:"<30 tuần thai, 0–14 ngày",ageDays:[0,14],route:"IV, IM",dose:"15 mg/kg/liều",interval:"Mỗi 48 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"lt30",pnaGroup:"gt14",label:"<30 tuần thai, >14 ngày",ageDays:[15,60],route:"IV, IM",dose:"15 mg/kg/liều",interval:"Mỗi 36 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"30-34",pnaGroup:"0-10",label:"30–34 tuần thai, 0–10 ngày",ageDays:[0,10],route:"IV, IM",dose:"15 mg/kg/liều",interval:"Mỗi 36 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"30-34",pnaGroup:"gt10",label:"30–34 tuần thai, >10 ngày",ageDays:[11,60],route:"IV, IM",dose:"15 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"ge35",pnaGroup:"0-7",label:"≥35 tuần thai, 0–7 ngày",ageDays:[0,7],route:"IV, IM",dose:"15 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"ge35",pnaGroup:"gt7",label:"≥35 tuần thai, >7 ngày",ageDays:[8,60],route:"IV, IM",dose:"17.5 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"Phổ rộng hơn gentamicin, bền vững với nhiều enzym bất hoạt aminoglycoside; <strong>Độc tính thận/thính giác cao hơn gentamicin</strong> — theo dõi nồng độ đỉnh/đáy chặt chẽ; Phân liều theo tuổi thai và tuổi sau sinh tương tự gentamicin",
  maxDose:"Theo TDM",
  citation:"[4] Nelson's 2026 Ch.2C",
  indications:"Nhiễm khuẩn gram âm sơ sinh đã kháng gentamicin; Enterobacterales sinh ESBL; Viêm màng não gram âm phối hợp beta-lactam; Nhiễm Pseudomonas trong hồi sức sơ sinh"
},
{
  id:"vancomycin_neo",
  name:"Vancomycin (Sơ sinh)",
  nameNorm:"vancomycin so sinh",
  tradeName:"Vancocin",
  class:"Glycopeptide",
  classNorm:"glycopeptide",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",scrRequired:true,gaGroup:"le28",label:"GA ≤28w, SCr <0.5 mg/dL",ageDays:[0,60],route:"IV",dose:"15 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"le28",label:"GA ≤28w, SCr 0.5–0.7",ageDays:[0,60],route:"IV",dose:"20 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"le28",label:"GA ≤28w, SCr 0.8–1.0",ageDays:[0,60],route:"IV",dose:"15 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"le28",label:"GA ≤28w, SCr 1.1–1.4",ageDays:[0,60],route:"IV",dose:"10 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"le28",label:"GA ≤28w, SCr >1.4",ageDays:[0,60],route:"IV",dose:"15 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 48 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"gt28",label:"GA >28w, SCr <0.7",ageDays:[0,60],route:"IV",dose:"15 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"gt28",label:"GA >28w, SCr 0.7–0.9",ageDays:[0,60],route:"IV",dose:"20 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"gt28",label:"GA >28w, SCr 1.0–1.2",ageDays:[0,60],route:"IV",dose:"15 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"gt28",label:"GA >28w, SCr 1.3–1.6",ageDays:[0,60],route:"IV",dose:"10 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",scrRequired:true,gaGroup:"gt28",label:"GA >28w, SCr >1.6",ageDays:[0,60],route:"IV",dose:"15 mg/kg/liều + LD 20 mg/kg",interval:"Mỗi 48 giờ",notes:""}
  ],
  generalNotes:"Mục tiêu AUC₂₄/MIC ≥400 mg·h/L cho MRSA MIC ≤1 mg/L; <strong>Ưu tiên giám sát AUC24 thay vì nồng độ đáy đơn thuần</strong>; Truyền chậm ≥60 phút phòng hội chứng Red Man",
  maxDose:"Điều chỉnh theo TDM (AUC)",
  citation:"[4] Nelson's 2026 Ch.2D",
  indications:"Nhiễm MRSA ở sơ sinh; Nhiễm khuẩn liên quan catheter do tụ cầu coagulase âm tính; Nhiễm khuẩn gram dương kháng beta-lactam; Kinh nghiệm khởi phát muộn nghi MRSA"
},
{
  id:"metronidazole_neo",
  name:"Metronidazole (Sơ sinh)",
  nameNorm:"metronidazole so sinh",
  tradeName:"Flagyl",
  class:"Nitroimidazole",
  classNorm:"nitroimidazole",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, PO",dose:"15 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"LD 15 mg/kg"},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, PO",dose:"15 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, PO",dose:"22.5 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"LD 15 mg/kg"},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, PO",dose:"30 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, PO",dose:"30 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Thấm tốt vào dịch não tủy, dùng được cho viêm màng não yếm khí; <strong>Khoảng cách liều điều chỉnh sau 14 ngày tuổi</strong> (khác mốc 7 ngày của beta-lactam); Chuyển sang đường uống ngay khi lâm sàng cho phép",
  maxDose:"30 mg/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn yếm khí ở sơ sinh; Phối hợp điều trị viêm ruột hoại tử (NEC) nặng; Viêm phúc mạc sơ sinh"
},
{
  id:"meropenem_neo",
  name:"Meropenem (Sơ sinh)",
  nameNorm:"meropenem so sinh",
  tradeName:"Merrem",
  class:"Beta-lactam – Carbapenem",
  classNorm:"beta lactam carbapenem",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày (Sepsis/IAI)",ageDays:[0,7],weightMax:2,route:"IV",dose:"40 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày (Sepsis/IAI)",ageDays:[8,28],weightMax:2,route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Điều chỉnh sau 14 ngày thay vì 7 ngày"},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày (Sepsis/IAI)",ageDays:[0,7],weightMin:2,route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày (Sepsis/IAI)",ageDays:[8,28],weightMin:2,route:"IV",dose:"90 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày (Sepsis/IAI)",ageDays:[29,60],route:"IV",dose:"90 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày (Viêm màng não/CRO MIC 4–8)",ageDays:[0,7],weightMax:2,route:"IV",dose:"80 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày (Viêm màng não/CRO)",ageDays:[8,28],weightMax:2,route:"IV",dose:"120 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g (Viêm màng não/CRO)",ageDays:[0,60],weightMin:2,route:"IV",dose:"120 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Carbapenem phổ rộng nhất ở sơ sinh, thấm tốt vào dịch não tủy; <strong>Nên hạn chế sử dụng để bảo tồn hiệu quả</strong>; Nguy cơ co giật thấp hơn imipenem",
  maxDose:"120 mg/kg/ngày (viêm màng não/CRO)",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn gram âm nặng kháng cephalosporin thế hệ 3; Viêm màng não do Enterobacterales kháng cephalosporin; Nhiễm khuẩn đa kháng không còn lựa chọn khác"
},
{
  id:"nafcillin_neo",
  name:"Nafcillin / Oxacillin (Sơ sinh)",
  nameNorm:"nafcillin oxacillin so sinh",
  tradeName:"Nafcil, Bactocill",
  class:"Beta-lactam – Penicillin kháng penicillinase",
  classNorm:"beta lactam penicillin khang penicillinase",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"50 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Dùng liều 0–7 ngày đến 14 ngày nếu cân nặng <1000g"},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Thuốc lựa chọn hàng đầu cho MSSA, bền vững với penicillinase tụ cầu; <strong>Không có hoạt tính với MRSA</strong>; Trẻ <1000g duy trì liều 0–7 ngày đến 14 ngày tuổi",
  maxDose:"200 mg/kg/ngày (viêm màng não)",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn MSSA ở sơ sinh: da mô mềm, viêm xương khớp; Viêm màng não do MSSA (liều tăng gấp đôi); Nhiễm khuẩn huyết do MSSA"
},
{
  id:"pip_tazo_neo",
  name:"Piperacillin/Tazobactam (Sơ sinh)",
  nameNorm:"piperacillin tazobactam pip tazo so sinh",
  tradeName:"Zosyn",
  class:"Beta-lactam/BLI – Penicillin phổ rộng",
  classNorm:"beta lactam bli penicillin pho rong",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV",dose:"300 mg PIP/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV",dose:"320 mg PIP/kg/ngày",interval:"Mỗi 6 giờ",notes:"Chuyển mỗi 6 giờ khi PMA >30 tuần"},
    {ageGroup:"neonate",label:">2000g",ageDays:[0,60],weightMin:2,route:"IV",dose:"320 mg PIP/kg/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Phổ rộng nhờ tazobactam ức chế beta-lactamase; <strong>Chuyển sang mỗi 6 giờ khi tuổi thai hiệu chỉnh >30 tuần</strong> do thanh thải thận tăng; Liều tính theo thành phần piperacillin",
  maxDose:"320 mg PIP/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn gram âm phổ rộng nghi đa tác nhân; Vi khuẩn sinh beta-lactamase; Viêm phúc mạc/nhiễm khuẩn ổ bụng yếm khí"
},
{
  id:"linezolid_neo",
  name:"Linezolid (Sơ sinh)",
  nameNorm:"linezolid so sinh",
  tradeName:"Zyvox",
  class:"Oxazolidinone",
  classNorm:"oxazolidinone",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV, PO",dose:"20 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g + 8–28 ngày tất cả",ageDays:[0,60],route:"IV, PO",dose:"30 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Thay thế vancomycin khi vi khuẩn kháng hoặc không thể theo dõi TDM; <strong>Theo dõi công thức máu hàng tuần nếu >14 ngày</strong> do nguy cơ ức chế tủy xương; Sinh khả dụng PO gần 100%, có thể chuyển đổi IV/PO linh hoạt",
  maxDose:"600 mg/liều",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm MRSA ở sơ sinh; Nhiễm Enterococcus kháng vancomycin (VRE); Khi vancomycin không phù hợp hoặc không hiệu quả"
},
{
  id:"penicillin_g_neo",
  name:"Penicillin G – Crystalline (Sơ sinh)",
  nameNorm:"penicillin g crystalline so sinh",
  tradeName:"Pfizerpen",
  class:"Beta-lactam – Penicillin",
  classNorm:"beta lactam penicillin",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"GBS sepsis/Giang mai – ≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV",dose:"100,000 U/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"GBS sepsis/Giang mai – ≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV",dose:"150,000 U/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"GBS sepsis/Giang mai – >2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV",dose:"100,000 U/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"GBS sepsis/Giang mai – >2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV",dose:"150,000 U/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"GBS meningitis – ≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV",dose:"450,000 U/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"GBS meningitis – ≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV",dose:"500,000 U/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"neonate",label:"GBS meningitis – >2000g",ageDays:[0,60],weightMin:2,route:"IV",dose:"450,000–500,000 U/kg/ngày",interval:"Mỗi 6–8 giờ",notes:""}
  ],
  generalNotes:"Hoạt tính diệt khuẩn mạnh nhất trên GBS và Listeria; <strong>Giang mai bẩm sinh bắt buộc dùng đủ 10 ngày, không thay thế được bằng ampicillin</strong>; Xuống thang ngay khi xác định tác nhân",
  maxDose:"500,000 U/kg/ngày (viêm màng não)",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Viêm màng não/nhiễm khuẩn huyết do GBS sơ sinh (lựa chọn hàng đầu); Giang mai bẩm sinh; Nhiễm Listeria (phối hợp aminoglycoside)"
},

/* ─── CHAPTER 18 – PEDIATRIC SYSTEMIC DOSING ─── */
{
  id:"acyclovir_ch18",
  name:"Acyclovir",
  nameNorm:"acyclovir",
  tradeName:"Zovirax",
  class:"Antiviral – Nucleoside analog",
  classNorm:"antiviral nucleoside analog",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em (IV)",route:"IV",dose:"15–45 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 1,500 mg/m²/ngày"},
    {ageGroup:"child",label:"Trẻ em (PO – susp)",route:"PO",dose:"900 mg/m²/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"child",label:"Trẻ em (PO – cap/tab)",route:"PO",dose:"60–80 mg/kg/ngày",interval:"Mỗi 6–8 giờ",notes:"Liều tối đa 3,200 mg/ngày"}
  ],
  generalNotes:"Liều cao 45 mg/kg/ngày IV cho HSV nặng/viêm não/VZV; <strong>Bảo đảm đủ nước khi truyền để phòng độc thận do lắng đọng tinh thể</strong>; Đổi foscarnet nếu kháng thuốc",
  maxDose:"3,200 mg/ngày (PO); 1,500 mg/m²/ngày (IV)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm HSV da-niêm và sinh dục; Nhiễm Varicella zoster (thủy đậu, zona); Viêm não do HSV"
},
{
  id:"amikacin_ch18",
  name:"Amikacin",
  nameNorm:"amikacin",
  tradeName:"Amikin",
  class:"Aminoglycoside",
  classNorm:"aminoglycoside",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"IV, IM",dose:"15–22.5 mg/kg/ngày",interval:"Mỗi 8–24 giờ",notes:"Theo dõi nồng độ thuốc nếu có thể"},
    {ageGroup:"child",label:"Xơ nang (CF)",route:"IV",dose:"30–35 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"Lựa chọn hàng thứ hai khi gram âm kháng gentamicin; <strong>Liều cao hơn (30–35 mg/kg/ngày) cần thiết ở bệnh nhân xơ nang</strong> do thanh thải tăng; Đỉnh mục tiêu 20–35 mg/L (≥10×MIC), đáy <7 mg/L",
  maxDose:"Theo TDM",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn gram âm đa kháng đã kháng gentamicin; Đợt cấp xơ nang do Pseudomonas/NTM; Phối hợp điều trị kinh nghiệm nhiễm khuẩn nặng"
},
{
  id:"amoxicillin_ch18",
  name:"Amoxicillin",
  nameNorm:"amoxicillin",
  tradeName:"Amoxil",
  class:"Beta-lactam – Penicillin",
  classNorm:"beta lactam penicillin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Liều chuẩn",route:"PO",dose:"40–45 mg/kg/ngày",interval:"Mỗi 8–12 giờ",notes:""},
    {ageGroup:"child",label:"Liều cao",route:"PO",dose:"80–90 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"AOM, viêm phổi"},
    {ageGroup:"child",label:"Pen-R S. pneumoniae AOM",route:"PO",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Sinh khả dụng PO cao (75–90%), vượt trội ampicillin; <strong>Liều cao 80–90 mg/kg/ngày bắt buộc tại vùng dịch tễ phế cầu kháng penicillin</strong>; Liều tối đa 4 g/ngày",
  maxDose:"4,000 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm tai giữa cấp và viêm họng liên cầu nhóm A (first-line); Viêm phổi cộng đồng nhẹ-trung bình; Nhiễm khuẩn tiết niệu không biến chứng"
},
{
  id:"amoxclav_ch18",
  name:"Amoxicillin/Clavulanate",
  nameNorm:"amoxicillin clavulanate augmentin",
  tradeName:"Augmentin",
  class:"Beta-lactam/BLI – Penicillin",
  classNorm:"beta lactam bli penicillin augmentin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"infant",label:"<3 tháng tuổi (4:1)",route:"PO",dose:"30 mg amox/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"≥3 tháng, <40 kg – AOM/xoang (14:1 ES)",route:"PO",dose:"90 mg amox/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 4,000 mg amox/ngày"},
    {ageGroup:"child",label:"≥3 tháng, <40 kg (7:1)",route:"PO",dose:"25 hoặc 45 mg amox/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"≥40 kg",route:"PO",dose:"90 mg amox/kg/ngày (AOM/viêm xoang)",interval:"Mỗi 12 giờ",notes:"Hoặc viêm phổi hít mỗi 8 giờ"}
  ],
  generalNotes:"Clavulanate khôi phục hoạt tính trên chủng đề kháng; <strong>Bắt buộc dạng tỷ lệ 14:1 khi cần liều cao 90 mg/kg/ngày</strong> để tránh quá liều clavulanate gây tiêu chảy; Dạng 7:1 dùng cho liều thông thường, không cần liều cao",
  maxDose:"4,000 mg amox/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm tai giữa cấp kháng thuốc hoặc nguy cơ cao vi khuẩn sinh beta-lactamase; Viêm xoang do vi khuẩn; Nhiễm khuẩn da mô mềm; Vết cắn động vật/người"
},
{
  id:"ampicillin_iv_ch18",
  name:"Ampicillin (IV/IM – Nhi)",
  nameNorm:"ampicillin iv im nhi",
  tradeName:"Ampicillin sodium",
  class:"Beta-lactam – Penicillin",
  classNorm:"beta lactam penicillin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Nhiễm khuẩn thông thường",route:"IV, IM",dose:"50–200 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Liều tối đa 8 g/ngày"},
    {ageGroup:"child",label:"Viêm nội tâm mạc / viêm màng não",route:"IV, IM",dose:"300–400 mg/kg/ngày",interval:"Mỗi 4–6 giờ",notes:"Liều tối đa 12 g/ngày"}
  ],
  generalNotes:"Liều cao 300–400 mg/kg/ngày cho viêm màng não/nội tâm mạc; <strong>Theo dõi phát ban dạng sởi khi đồng nhiễm EBV</strong> — không phải dị ứng penicillin thật sự; Phối hợp aminoglycoside cho Enterococcus để hiệp đồng diệt khuẩn",
  maxDose:"12 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm màng não do Listeria hoặc Enterococcus nhạy cảm; Viêm nội tâm mạc do Enterococcus (phối hợp aminoglycoside); Nhiễm khuẩn huyết/tiết niệu nặng"
},
{
  id:"ampicillin_po_ch18",
  name:"Ampicillin (PO – Nhi)",
  nameNorm:"ampicillin po uong nhi",
  tradeName:"Ampicillin trihydrate",
  class:"Beta-lactam – Penicillin",
  classNorm:"beta lactam penicillin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"<20 kg",route:"PO",dose:"50–100 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"child",label:"≥20 kg và người lớn",route:"PO",dose:"1–2 g/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Sinh khả dụng PO thấp hơn đáng kể so với amoxicillin; <strong>Ưu tiên amoxicillin PO trong hầu hết chỉ định tương đương</strong>; Vai trò lâm sàng hiện nay hạn chế",
  maxDose:"2 g/ngày (PO)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn tiết niệu nhẹ; Nhiễm khuẩn hô hấp/tiết niệu mức độ nhẹ-trung bình do vi khuẩn nhạy cảm; Dùng khi cần duy trì phổ ampicillin nhưng không cần điều trị tĩnh mạch"
},
{
  id:"azithromycin_ch18",
  name:"Azithromycin",
  nameNorm:"azithromycin zithromax",
  tradeName:"Zithromax",
  class:"Macrolide",
  classNorm:"macrolide",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"AOM (5 ngày)",route:"PO",dose:"10 mg/kg ngày 1, rồi 5 mg/kg × 4 ngày",interval:"Mỗi 24 giờ",notes:"Hoặc 10 mg/kg × 3 ngày"},
    {ageGroup:"child",label:"AOM (1 liều)",route:"PO",dose:"30 mg/kg",interval:"Liều duy nhất",notes:""},
    {ageGroup:"child",label:"Viêm họng",route:"PO",dose:"12 mg/kg/ngày × 5 ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa tổng 2,500 mg"},
    {ageGroup:"child",label:"Viêm xoang",route:"PO",dose:"10 mg/kg/ngày × 3 ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa tổng 1.5 g"},
    {ageGroup:"child",label:"Viêm phổi cộng đồng (CABP)",route:"PO",dose:"10 mg/kg ngày 1, rồi 5 mg/kg × 4 ngày",interval:"Mỗi 24 giờ",notes:"Hoặc 60 mg/kg ER 1 liều, tối đa 2 g"},
    {ageGroup:"child",label:"Dạng IV",route:"IV",dose:"10 mg/kg",interval:"Mỗi 24 giờ",notes:"Liều tối đa 500 mg"}
  ],
  generalNotes:"T½ nội bào >68 giờ cho phép liệu trình ngắn ngày; <strong>Theo dõi khoảng QTc</strong>; Tương tác warfarin, digoxin, ergotamine",
  maxDose:"500 mg/liều (IV); 2,500 mg tổng (viêm họng PO)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm phổi không điển hình (Mycoplasma/Chlamydia pneumoniae); Viêm tai giữa thất bại beta-lactam; Viêm họng khi dị ứng penicillin; Dự phòng MAC ở HIV"
},
{
  id:"cefazolin_ch18",
  name:"Cefazolin (Nhi)",
  nameNorm:"cefazolin nhi",
  tradeName:"Ancef",
  class:"Beta-lactam – Cephalosporin thế hệ 1",
  classNorm:"beta lactam cephalosporin the he 1",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"IV, IM",dose:"25–100 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"child",label:"Nhiễm khuẩn nặng",route:"IV, IM",dose:"100–150 mg/kg/ngày",interval:"Mỗi 6 giờ hoặc truyền liên tục",notes:"Liều tối đa 12 g/ngày"}
  ],
  generalNotes:"Hoạt tính ổn định trên MSSA, liên cầu và nhiều gram âm cộng đồng; <strong>Tiêu chuẩn vàng dự phòng phẫu thuật</strong> nhờ dược động học phù hợp; Không có hoạt tính với MRSA",
  maxDose:"12 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Dự phòng kháng sinh trước phẫu thuật (first-line); Nhiễm khuẩn MSSA và liên cầu nhạy cảm; Nhiễm khuẩn da mô mềm nhẹ-trung bình"
},
{
  id:"cefaclor_ch18",
  name:"Cefaclor",
  nameNorm:"cefaclor ceclor",
  tradeName:"Ceclor",
  class:"Beta-lactam – Cephalosporin thế hệ 2",
  classNorm:"beta lactam cephalosporin the he 2",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"PO",dose:"20–40 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1 g/ngày"}
  ],
  generalNotes:"Cephalosporin thế hệ 2 đường uống, sinh khả dụng thấp hơn cefuroxime; <strong>Hoạt tính phế cầu kém ổn định hơn thế hệ 3 đường uống</strong>; Bao phủ H. influenzae và M. catarrhalis",
  maxDose:"1 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm tai giữa cấp; Nhiễm khuẩn hô hấp trên do H. influenzae/M. catarrhalis; Nhiễm khuẩn tiết niệu nhẹ"
},
{
  id:"cefadroxil_ch18",
  name:"Cefadroxil",
  nameNorm:"cefadroxil duricef",
  tradeName:"Duricef",
  class:"Beta-lactam – Cephalosporin thế hệ 1",
  classNorm:"beta lactam cephalosporin the he 1",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Nhiễm khuẩn thông thường",route:"PO",dose:"30 mg/kg/ngày",interval:"Mỗi 12–24 giờ",notes:"Liều tối đa 2 g/ngày"},
    {ageGroup:"child",label:"Xương khớp",route:"PO",dose:"75–150 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 4 g/ngày"}
  ],
  generalNotes:"T½ dài (1,5–2 giờ) cho phép dùng mỗi 12–24 giờ; <strong>Tần suất thấp hơn cephalexin cải thiện tuân thủ điều trị</strong>; Liều tối đa 4 g/ngày cho nhiễm khuẩn xương khớp",
  maxDose:"4 g/ngày (xương khớp)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn da mô mềm và viêm amidan do liên cầu/tụ cầu nhạy cảm; Nhiễm khuẩn tiết niệu không biến chứng; Xuống thang xương khớp"
},
{
  id:"cefdinir_ch18",
  name:"Cefdinir",
  nameNorm:"cefdinir omnicef",
  tradeName:"Omnicef",
  class:"Beta-lactam – Cephalosporin thế hệ 3 (oral)",
  classNorm:"beta lactam cephalosporin the he 3 oral",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"PO",dose:"14 mg/kg/ngày",interval:"Mỗi 12–24 giờ",notes:"Liều tối đa 600 mg/ngày"}
  ],
  generalNotes:"Bao phủ H. influenzae, M. catarrhalis, phế cầu nhạy cảm; <strong>Thuận tiện liều một lần/ngày</strong> cải thiện tuân thủ ở trẻ em; Liều tối đa 600 mg/ngày",
  maxDose:"600 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm tai giữa cấp; Viêm phổi cộng đồng nhẹ; Nhiễm khuẩn da mô mềm; Viêm họng khi dị ứng penicillin nhẹ"
},
{
  id:"cefepime_ch18",
  name:"Cefepime (Nhi)",
  nameNorm:"cefepime nhi maxipime",
  tradeName:"Maxipime",
  class:"Beta-lactam – Cephalosporin thế hệ 4",
  classNorm:"beta lactam cephalosporin the he 4",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"IV, IM",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 4 g/ngày"},
    {ageGroup:"child",label:"Sốt giảm bạch cầu trung tính",route:"IV, IM",dose:"150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 6 g/ngày"}
  ],
  generalNotes:"Bền vững với hầu hết AmpC beta-lactamase; <strong>Liều cao hơn cho sốt giảm bạch cầu và nhiễm khuẩn nặng</strong>; Liều cao hơn cho sốt giảm bạch cầu trung tính",
  maxDose:"6 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Sốt giảm bạch cầu trung tính kinh nghiệm; Nhiễm Pseudomonas aeruginosa; Nhiễm khuẩn gram âm bệnh viện nặng"
},
{
  id:"cefiderocol_ch18",
  name:"Cefiderocol",
  nameNorm:"cefiderocol fetroja",
  tradeName:"Fetroja",
  class:"Beta-lactam – Cephalosporin siderophore",
  classNorm:"beta lactam cephalosporin siderophore",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"≥3 tháng tuổi",route:"IV",dose:"180 mg/kg/ngày",interval:"Mỗi 8 giờ, truyền trong 3 giờ",notes:""},
    {ageGroup:"child",label:"Người lớn",route:"IV",dose:"2 g/liều",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Cơ chế siderophore xâm nhập qua kênh vận chuyển sắt; <strong>Bền vững với hầu hết cơ chế đề kháng carbapenem</strong>; Cần hội chẩn chuyên khoa nhiễm trước khi dùng",
  maxDose:"6 g/ngày (theo người lớn)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn gram âm đa kháng/toàn kháng (MDR/XDR); Chủng kháng carbapenem khi không còn lựa chọn khác; Cần hội chẩn chuyên khoa nhiễm trước khi chỉ định"
},
{
  id:"cefixime_ch18",
  name:"Cefixime",
  nameNorm:"cefixime suprax",
  tradeName:"Suprax",
  class:"Beta-lactam – Cephalosporin thế hệ 3 (oral)",
  classNorm:"beta lactam cephalosporin the he 3 oral",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"PO",dose:"8 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa 400 mg/ngày"},
    {ageGroup:"child",label:"Nhiễm khuẩn nặng (step-down)",route:"PO",dose:"Đến 20 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""}
  ],
  generalNotes:"Ổn định cao với beta-lactamase, bao phủ tốt gram âm đường tiết niệu; <strong>Hoạt tính gram dương hạn chế hơn các thế hệ trước</strong>; Liều tối đa 400 mg/ngày",
  maxDose:"400 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn tiết niệu; Viêm tai giữa cấp; Viêm họng liên cầu nhóm A; Lậu cầu sinh dục-tiết niệu không biến chứng"
},
{
  id:"cefotaxime_ch18",
  name:"Cefotaxime (Nhi)",
  nameNorm:"cefotaxime claforan nhi",
  tradeName:"Claforan",
  class:"Beta-lactam – Cephalosporin thế hệ 3",
  classNorm:"beta lactam cephalosporin the he 3",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"IV, IM",dose:"150–180 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 8 g/ngày"},
    {ageGroup:"child",label:"Viêm màng não",route:"IV",dose:"200–225 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Liều tối đa 12 g/ngày"}
  ],
  generalNotes:"Phổ tương tự ceftriaxone nhưng không cạnh tranh gắn albumin với bilirubin; <strong>An toàn hơn ceftriaxone ở trẻ tăng bilirubin máu</strong>; Liều viêm màng não cao hơn liều nhiễm khuẩn thông thường",
  maxDose:"12 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm màng não do vi khuẩn nhạy cảm; Nhiễm khuẩn gram âm nặng khi chống chỉ định ceftriaxone (tăng bilirubin, cần canxi IV); Thay thế ceftriaxone trong các tình huống cần tránh tương tác canxi"
},
{
  id:"cefpodoxime_ch18",
  name:"Cefpodoxime",
  nameNorm:"cefpodoxime vantin",
  tradeName:"Vantin",
  class:"Beta-lactam – Cephalosporin thế hệ 3 (oral)",
  classNorm:"beta lactam cephalosporin the he 3 oral",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"PO",dose:"10 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 400 mg/ngày"}
  ],
  generalNotes:"Bao phủ tốt H. influenzae, M. catarrhalis, phế cầu nhạy cảm và E. coli; <strong>Lựa chọn phù hợp cho bước xuống thang (step-down)</strong>; Liều tối đa 400 mg/ngày",
  maxDose:"400 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm tai giữa cấp; Viêm phổi cộng đồng nhẹ; Nhiễm khuẩn tiết niệu; Xuống thang sau điều trị tĩnh mạch"
},
{
  id:"ceftaroline_ch18",
  name:"Ceftaroline (Nhi)",
  nameNorm:"ceftaroline teflaro nhi",
  tradeName:"Teflaro",
  class:"Beta-lactam – Cephalosporin thế hệ 5 (anti-MRSA)",
  classNorm:"beta lactam cephalosporin the he 5 mrsa",
  source:"ch18",
  dosingRows:[
    {ageGroup:"neonate",label:"0–<2 tháng",ageDays:[0,60],route:"IV",dose:"18 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"infant",label:"≥2 tháng–<2 tuổi",route:"IV",dose:"24 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"child",label:"≥2 tuổi",route:"IV",dose:"36 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"child",label:">33 kg / người lớn",route:"IV",dose:"1.2 g/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"Xơ nang (CF)",route:"IV",dose:"45–60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 3 g/ngày"}
  ],
  generalNotes:"<strong>Beta-lactam duy nhất có hoạt tính diệt khuẩn trực tiếp trên MRSA</strong> nhờ ái lực cao với PBP2a; Không thay thế vancomycin cho nhiễm khuẩn nội mạch nặng; Liều khác nhau theo tuổi và cân nặng, chuyển sang liều người lớn khi >33 kg",
  maxDose:"3 g/ngày (CF); 1.2 g/ngày (thông thường >33kg)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn da mô mềm và viêm phổi cộng đồng nặng nghi MRSA; Nhiễm khuẩn xương khớp do tụ cầu kháng methicillin; Lựa chọn beta-lactam khi cần phổ kháng MRSA"
},
{
  id:"ceftazidime_ch18",
  name:"Ceftazidime (Nhi)",
  nameNorm:"ceftazidime nhi tazicef fortaz",
  tradeName:"Tazicef, Fortaz",
  class:"Beta-lactam – Cephalosporin thế hệ 3 (anti-Pseudomonas)",
  classNorm:"beta lactam cephalosporin the he 3 pseudomonas",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"IV, IM",dose:"90–150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 6 g/ngày"},
    {ageGroup:"child",label:"Pseudomonas nặng",route:"IV",dose:"200–300 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 12 g/ngày"},
    {ageGroup:"child",label:"Béo phì",route:"IV",dose:"Liều tối đa 8 g/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Lựa chọn hàng đầu cho Pseudomonas chưa đa kháng; <strong>Truyền kéo dài 3–4 giờ cải thiện hiệu quả diệt khuẩn</strong> khi MIC tiệm cận ngưỡng nhạy cảm; Liều cao hơn (max 8 g/ngày chia mỗi 6 giờ) ở trẻ béo phì",
  maxDose:"12 g/ngày (Pseudomonas nặng)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm Pseudomonas aeruginosa; Sốt giảm bạch cầu trung tính kinh nghiệm; Đợt cấp xơ nang; Nhiễm khuẩn gram âm bệnh viện nặng"
},
{
  id:"ceftriaxone_ch18",
  name:"Ceftriaxone (Nhi)",
  nameNorm:"ceftriaxone nhi rocephin",
  tradeName:"Rocephin",
  class:"Beta-lactam – Cephalosporin thế hệ 3",
  classNorm:"beta lactam cephalosporin the he 3",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"IV, IM",dose:"50–75 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa 2 g/ngày"},
    {ageGroup:"child",label:"Viêm màng não",route:"IV",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 4 g/ngày"},
    {ageGroup:"child",label:"AOM",route:"IM",dose:"50 mg/kg",interval:"1–3 liều, mỗi 24 giờ",notes:"Liều tối đa 1 g/liều"}
  ],
  generalNotes:"T½ dài cho phép dùng một lần/ngày, thuận tiện ngoại trú; <strong>Không phối hợp dung dịch chứa canxi IV trong 48 giờ</strong>; Theo dõi sỏi mật giả khi >7–10 ngày",
  maxDose:"4 g/ngày (viêm màng não)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm màng não; Nhiễm khuẩn huyết/viêm phổi cộng đồng nặng; Nhiễm khuẩn xương khớp; Lậu cầu và giang mai; Bệnh Lyme"
},
{
  id:"cefuroxime_po_ch18",
  name:"Cefuroxime (Nhi – PO)",
  nameNorm:"cefuroxime ceftin nhi po",
  tradeName:"Ceftin",
  class:"Beta-lactam – Cephalosporin thế hệ 2",
  classNorm:"beta lactam cephalosporin the he 2",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"PO",dose:"20–30 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1 g/ngày"},
    {ageGroup:"child",label:"Xương khớp",route:"PO",dose:"Đến 100 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 3 g/ngày"}
  ],
  generalNotes:"Bao phủ H. influenzae, phế cầu nhạy cảm và một số tụ cầu; <strong>Hấp thu cải thiện rõ rệt khi uống cùng bữa ăn</strong>; Liều tối đa 3 g/ngày",
  maxDose:"3 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm tai giữa cấp; Nhiễm khuẩn hô hấp trên; Xuống thang sau cefuroxime tĩnh mạch trong nhiễm khuẩn xương khớp"
},
{
  id:"cefuroxime_iv_ch18",
  name:"Cefuroxime (Nhi – IV)",
  nameNorm:"cefuroxime zinacef nhi iv",
  tradeName:"Zinacef",
  class:"Beta-lactam – Cephalosporin thế hệ 2",
  classNorm:"beta lactam cephalosporin the he 2",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"IV, IM",dose:"100–150 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 6 g/ngày"}
  ],
  generalNotes:"Bao phủ cả gram dương và nhiều gram âm cộng đồng; <strong>Không bền vững với ESBL</strong> — cần xuống thang khi phân lập chủng này; Liều tối đa 6 g/ngày",
  maxDose:"6 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn trung bình-nặng trước khi có kết quả vi sinh; Viêm phổi cộng đồng; Viêm mô tế bào"
},
{
  id:"cephalexin_ch18",
  name:"Cephalexin",
  nameNorm:"cephalexin keflex",
  tradeName:"Keflex",
  class:"Beta-lactam – Cephalosporin thế hệ 1",
  classNorm:"beta lactam cephalosporin the he 1",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Thông thường",route:"PO",dose:"25–50 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"Xương khớp / nặng",route:"PO",dose:"75–100 mg/kg/ngày",interval:"Mỗi 6–8 giờ",notes:"Liều tối đa 4 g/ngày"}
  ],
  generalNotes:"Độ an toàn cao, phổ tập trung MSSA/liên cầu; <strong>Không có hoạt tính với MRSA</strong> — thêm clindamycin/TMP-SMX nếu nghi CA-MRSA; Liều tối đa 4 g/ngày",
  maxDose:"4 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn da mô mềm do MSSA/liên cầu (first-line ngoại trú); Nhiễm khuẩn tiết niệu không biến chứng; Xuống thang xương khớp MSSA"
},
{
  id:"ciprofloxacin_ch18",
  name:"Ciprofloxacin",
  nameNorm:"ciprofloxacin cipro",
  tradeName:"Cipro",
  class:"Fluoroquinolone",
  classNorm:"fluoroquinolone",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"PO",route:"PO",dose:"20–40 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1.5 g/ngày"},
    {ageGroup:"child",label:"IV",route:"IV",dose:"20–30 mg/kg/ngày",interval:"Mỗi 8–12 giờ",notes:"Liều tối đa 1.2 g/ngày"}
  ],
  generalNotes:"Dữ liệu >7.300 trẻ không ghi nhận tổn thương khớp vĩnh viễn; <strong>Vẫn chỉ dùng khi không có thay thế phù hợp</strong>; Tránh dùng cùng cation hóa trị 2-3",
  maxDose:"1.5 g/ngày (PO)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn tiết niệu phức tạp; Đợt cấp xơ nang do Pseudomonas; Thương hàn đa kháng; Bệnh than; Tularemia"
},
{
  id:"clarithromycin_ch18",
  name:"Clarithromycin",
  nameNorm:"clarithromycin biaxin",
  tradeName:"Biaxin",
  class:"Macrolide",
  classNorm:"macrolide",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"PO",dose:"15 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1 g/ngày"}
  ],
  generalNotes:"Ức chế mạnh CYP3A4, nhiều tương tác thuốc quan trọng; <strong>Theo dõi khoảng QTc</strong>; Không khuyến cáo cho trẻ <6 tháng",
  maxDose:"1 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm phổi không điển hình do Mycoplasma; Nhiễm Mycobacterium avium complex (MAC); Tiệt trừ H. pylori (phối hợp)"
},
{
  id:"clindamycin_ch18",
  name:"Clindamycin (Nhi)",
  nameNorm:"clindamycin nhi cleocin",
  tradeName:"Cleocin",
  class:"Lincosamide",
  classNorm:"lincosamide",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"PO",route:"PO",dose:"10–25 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 1.8 g/ngày"},
    {ageGroup:"child",label:"PO – CA-MRSA / AOM",route:"PO",dose:"30–40 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"child",label:"IV, IM",route:"IV, IM",dose:"20–40 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 2.7 g/ngày. Chuyển 1:1 khi dùng PO."}
  ],
  generalNotes:"Chuyển đổi PO:IV 1:1 nhờ sinh khả dụng cao (~90%); <strong>Bắt buộc D-test trước khi dùng cho MRSA</strong>; Theo dõi nguy cơ viêm đại tràng do C. difficile",
  maxDose:"2.7 g/ngày (IV)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn da mô mềm/xương khớp do CA-MRSA; Nhiễm khuẩn yếm khí; Viêm phổi hít; Dự phòng viêm nội tâm mạc khi dị ứng penicillin"
},
{
  id:"colistimethate_ch18",
  name:"Colistimethate (Colistin)",
  nameNorm:"colistimethate colistin",
  tradeName:"Coly-Mycin M",
  class:"Polymyxin",
  classNorm:"polymyxin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"IV, IM",dose:"2.5–5 mg colistin base/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 360 mg/ngày colistin base"}
  ],
  generalNotes:"⚠️ <strong>Độc thận đáng kể, theo dõi creatinine mỗi 48 giờ</strong>; Chú ý đơn vị quy đổi: 1 mg base = 2,7 mg colistimethate = 30.000 IU; Thuốc cứu cánh cuối khi không còn lựa chọn an toàn hơn",
  maxDose:"360 mg colistin base/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm Acinetobacter baumannii đa kháng; Nhiễm Pseudomonas đa kháng; Thuốc cứu cánh cuối khi không còn lựa chọn khác"
},
{
  id:"daptomycin_ch18",
  name:"Daptomycin",
  nameNorm:"daptomycin cubicin",
  tradeName:"Cubicin",
  class:"Lipopeptide",
  classNorm:"lipopeptide",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"SSSI – 1–2 tuổi",route:"IV",dose:"10 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"SSSI – 2–6 tuổi",route:"IV",dose:"9 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"SSSI – 7–11 tuổi",route:"IV",dose:"7 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"SSSI – 12–17 tuổi",route:"IV",dose:"5 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"S. aureus nhiễm khuẩn huyết – 1–6 tuổi",route:"IV",dose:"12 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"S. aureus nhiễm khuẩn huyết – 7–11 tuổi",route:"IV",dose:"9 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"S. aureus nhiễm khuẩn huyết – 12–17 tuổi",route:"IV",dose:"7 mg/kg",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"Cơ chế diệt khuẩn qua khử cực màng tế bào; <strong>Không dùng cho viêm phổi</strong> (bất hoạt bởi surfactant); Theo dõi CPK hàng tuần, ngừng nếu tăng >5 lần",
  maxDose:"Theo cân nặng",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn huyết do MRSA/VRE; Nhiễm khuẩn da mô mềm phức tạp gram dương; Viêm nội tâm mạc do tụ cầu/Enterococcus kháng thuốc khác"
},
{
  id:"fluconazole_ch18",
  name:"Fluconazole (Nhi)",
  nameNorm:"fluconazole nhi diflucan",
  tradeName:"Diflucan",
  class:"Antifungal – Azole",
  classNorm:"antifungal azole",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"PO, IV",dose:"6–12 mg/kg",interval:"Mỗi 24 giờ",notes:"Liều tối đa 800 mg/ngày"}
  ],
  generalNotes:"Ức chế CYP2C9/CYP3A4, nhiều tương tác thuốc; <strong>Liều cao 800–1.000 mg/ngày cho nhiễm nấm thần kinh trung ương</strong>; Kiểm tra MIC với Candida non-albicans",
  maxDose:"800 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Candida xâm lấn và niêm mạc; Nhiễm Cryptococcus; Nấm họng-thực quản ở suy giảm miễn dịch"
},
{
  id:"gentamicin_ch18",
  name:"Gentamicin (Nhi)",
  nameNorm:"gentamicin nhi",
  tradeName:"Garamycin",
  class:"Aminoglycoside",
  classNorm:"aminoglycoside",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em (>60 ngày tuổi)",route:"IV, IM",dose:"3–7.5 mg/kg/ngày",interval:"Mỗi 8–24 giờ",notes:"Có phác đồ riêng cho sơ sinh"}
  ],
  generalNotes:"Chế độ liều một lần/ngày (ODD) được ưu tiên, giảm độc tính tích lũy; <strong>Không phối hợp đồng thời amphotericin B</strong> (cộng hưởng độc thận); Đỉnh mục tiêu 6–12 mg/L, đáy <1 mg/L với chế độ ODD",
  maxDose:"Theo TDM",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn gram âm nghiêm trọng; Phối hợp điều trị hiệp đồng viêm nội tâm mạc Enterococcus/Streptococcus; Viêm màng não gram âm phối hợp beta-lactam"
},
{
  id:"isoniazid_ch18",
  name:"Isoniazid (INH)",
  nameNorm:"isoniazid inh lao",
  tradeName:"Nydrazid",
  class:"Antimycobacterial",
  classNorm:"antimycobacterial lao",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Hàng ngày",route:"PO, IV, IM",dose:"10–15 mg/kg/ngày",interval:"Mỗi 12–24 giờ",notes:"Liều tối đa 300 mg/ngày"},
    {ageGroup:"child",label:"2 lần/tuần (DOT)",route:"PO",dose:"20–30 mg/kg",interval:"2×/tuần",notes:"Liều tối đa 900 mg/liều"}
  ],
  generalNotes:"Nền tảng mọi phác đồ điều trị lao; <strong>Không dùng đơn độc do nguy cơ kháng nhanh</strong>; Bổ sung pyridoxine (B6) dự phòng bệnh thần kinh ngoại biên",
  maxDose:"300 mg/ngày (hàng ngày); 900 mg/liều (DOT)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Điều trị lao hoạt động (phối hợp đa thuốc); Lao tiềm ẩn; Dự phòng sau phơi nhiễm"
},
{
  id:"linezolid_ch18",
  name:"Linezolid (Nhi)",
  nameNorm:"linezolid nhi zyvox",
  tradeName:"Zyvox",
  class:"Oxazolidinone",
  classNorm:"oxazolidinone",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"<12 tuổi",route:"IV, PO",dose:"30 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"child",label:"≥12 tuổi",route:"IV, PO",dose:"20 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1,200 mg/ngày"}
  ],
  generalNotes:"Sinh khả dụng PO ~100%, chuyển đổi IV→PO tỷ lệ 1:1; <strong>Theo dõi công thức máu hàng tuần khi >14 ngày</strong>; Hạn chế thực phẩm giàu tyramine",
  maxDose:"1,200 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm MRSA hoặc Enterococcus kháng vancomycin (VRE); Lao đa kháng thuốc (MDR-TB, phối hợp); Thay thế khi vancomycin không phù hợp hoặc kháng thuốc"
},
{
  id:"meropenem_ch18",
  name:"Meropenem (Nhi)",
  nameNorm:"meropenem nhi merrem",
  tradeName:"Merrem",
  class:"Beta-lactam – Carbapenem",
  classNorm:"beta lactam carbapenem",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Nhiễm khuẩn thông thường",route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 3 g/ngày (thường)"},
    {ageGroup:"child",label:"Viêm màng não",route:"IV",dose:"120 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 6 g/ngày"},
    {ageGroup:"child",label:"Xơ nang / MDR",route:"IV",dose:"Đến 120 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 6 g/ngày"}
  ],
  generalNotes:"Phổ rộng, nguy cơ co giật thấp hơn imipenem — lựa chọn ưu tiên cho viêm màng não gram âm; <strong>Truyền kéo dài 3–4 giờ khi MIC cao</strong>; Phối hợp colistin/fosfomycin khi gặp CRE",
  maxDose:"6 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Enterobacterales sinh ESBL, Pseudomonas đa kháng; Viêm màng não gram âm; Đợt cấp xơ nang đa kháng; Viêm phổi bệnh viện; Nhiễm khuẩn ổ bụng phức tạp"
},
{
  id:"metronidazole_ch18",
  name:"Metronidazole (Nhi)",
  nameNorm:"metronidazole nhi flagyl",
  tradeName:"Flagyl",
  class:"Nitroimidazole",
  classNorm:"nitroimidazole",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"IV, PO",dose:"22.5–30 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 1.5 g/ngày (30 mg/kg/ngày IV)"},{ageGroup:"child",label:"Clostridioides difficile",route:"PO",dose:"30 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Phổ bao phủ yếm khí và một số ký sinh trùng đơn bào; <strong>Tránh dùng 3 tháng đầu thai kỳ</strong>; Vị kim loại khi uống là tác dụng phụ lành tính",
  maxDose:"1.5 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn yếm khí; Viêm đại tràng do C. difficile; Nhiễm Giardia lamblia; Tiệt trừ H. pylori (phối hợp); Viêm phúc mạc"
},
{
  id:"micafungin_ch18",
  name:"Micafungin",
  nameNorm:"micafungin mycamine",
  tradeName:"Mycamine",
  class:"Antifungal – Echinocandin",
  classNorm:"antifungal echinocandin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"neonate",label:"Sơ sinh",ageDays:[0,60],route:"IV",dose:"10 mg/kg",interval:"Mỗi 24 giờ",notes:"Có phác đồ riêng cho sơ sinh"},
    {ageGroup:"infant",label:"1–<4 tháng",route:"IV",dose:"4 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"≥4 tháng",route:"IV",dose:"2 mg/kg",interval:"Mỗi 24 giờ",notes:"Liều tối đa 100 mg/ngày"},
    {ageGroup:"child",label:"Candida thực quản ≥4 tháng, ≤30 kg",route:"IV",dose:"3 mg/kg",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"Candida thực quản ≥4 tháng, >30 kg",route:"IV",dose:"2.5 mg/kg",interval:"Mỗi 24 giờ",notes:"Liều tối đa 150 mg/ngày"}
  ],
  generalNotes:"Ít tương tác thuốc hơn nhóm azole; <strong>Không cần theo dõi nồng độ thuốc (TDM)</strong>, đơn giản hóa quản lý lâm sàng so với voriconazole; Liều dự phòng thấp hơn liều điều trị đáng kể",
  maxDose:"150 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Candidiasis xâm lấn; Dự phòng nhiễm nấm xâm lấn ở bệnh nhân ghép tạng/tủy hoặc nguy cơ cao; Lựa chọn đầu tay khi cần điều trị nấm không theo dõi TDM"
},
{
  id:"nitrofurantoin_ch18",
  name:"Nitrofurantoin",
  nameNorm:"nitrofurantoin furadantin macrodantin",
  tradeName:"Furadantin / Macrodantin",
  class:"Nitrofuran",
  classNorm:"nitrofuran",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Điều trị",route:"PO",dose:"5–7 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Liều tối đa 400 mg/ngày"},
    {ageGroup:"child",label:"Dự phòng UTI",route:"PO",dose:"1–2 mg/kg",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"Chỉ đạt nồng độ điều trị trong nước tiểu, không đủ ở mô thận/máu; <strong>Không dùng khi nghi nhiễm khuẩn huyết/viêm đài bể thận</strong>; Chống chỉ định <1 tháng tuổi",
  maxDose:"400 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn tiết niệu dưới không biến chứng; Dự phòng nhiễm khuẩn tiết niệu tái phát; Chỉ đạt nồng độ điều trị trong nước tiểu"
},
{
  id:"oseltamivir_ch18",
  name:"Oseltamivir",
  nameNorm:"oseltamivir tamiflu",
  tradeName:"Tamiflu",
  class:"Antiviral – Neuraminidase inhibitor",
  classNorm:"antiviral neuraminidase inhibitor",
  source:"ch18",
  dosingRows:[
    {ageGroup:"neonate",label:"Sơ sinh thiếu tháng <38 tuần PMA",ageDays:[0,60],route:"PO",dose:"2 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"Sơ sinh thiếu tháng 38–40 tuần PMA",ageDays:[0,60],route:"PO",dose:"3 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"Sơ sinh đủ tháng / >40 tuần PMA đến 8 tháng",route:"PO",dose:"6 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"infant",label:"9–11 tháng",route:"PO",dose:"7 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"≥12 tháng, ≤15 kg",route:"PO",dose:"60 mg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"≥12 tháng, >15–23 kg",route:"PO",dose:"90 mg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"≥12 tháng, >23–40 kg",route:"PO",dose:"120 mg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"≥12 tháng, >40 kg",route:"PO",dose:"150 mg/ngày",interval:"Mỗi 12 giờ",notes:""}
  ],
  generalNotes:"<strong>Hiệu quả tối đa khi bắt đầu trong 48 giờ từ khởi phát triệu chứng</strong>; Liệu trình điều trị chuẩn 5 ngày; Dự phòng sau phơi nhiễm 10 ngày",
  maxDose:"150 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Điều trị cúm mùa do virus cúm A và B; Dự phòng cúm sau phơi nhiễm; Giảm thời gian và mức độ nặng của triệu chứng cúm"
},
{
  id:"penicillin_g_benz_ch18",
  name:"Penicillin G Benzathine (Nhi)",
  nameNorm:"penicillin g benzathine bicillin nhi",
  tradeName:"Bicillin L-A",
  class:"Beta-lactam – Penicillin",
  classNorm:"beta lactam penicillin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ <27 kg",route:"IM",dose:"600,000 U",interval:"Liều duy nhất hoặc mỗi 3–4 tuần",notes:""},
    {ageGroup:"child",label:"Trẻ ≥27 kg và người lớn",route:"IM",dose:"1,200,000 U",interval:"Liều duy nhất hoặc mỗi 3–4 tuần",notes:""}
  ],
  generalNotes:"Phóng thích chậm duy trì nồng độ diệt khuẩn 3–4 tuần/mũi tiêm; ⛔ <strong>Chỉ tiêm bắp — tuyệt đối không tiêm tĩnh mạch</strong> (nguy cơ tử vong); Là nền tảng của dự phòng thấp tim thứ phát dài hạn",
  maxDose:"1,200,000 U/liều",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Dự phòng tái phát thấp tim cấp dài hạn (first-line); Viêm họng liên cầu nhóm A khi lo ngại tuân thủ; Giang mai giai đoạn sớm"
},
{
  id:"penicillin_v_ch18",
  name:"Penicillin V (PO)",
  nameNorm:"penicillin v po uong",
  tradeName:"Pen-Vee K",
  class:"Beta-lactam – Penicillin",
  classNorm:"beta lactam penicillin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"PO",dose:"25–50 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Liều tối đa 2 g/ngày"}
  ],
  generalNotes:"Ổn định trong acid dạ dày nên dùng đường uống được; <strong>Không phù hợp cho nhiễm khuẩn cần nồng độ huyết thanh cao</strong> do phổ hẹp; Liều tối đa 2 g/ngày",
  maxDose:"2 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm họng-amidan do liên cầu nhóm A (điều trị chuẩn 10 ngày); Dự phòng thấp tim dạng uống; Lựa chọn đường uống khi không thể tiêm bắp"
},
{
  id:"pip_tazo_ch18",
  name:"Piperacillin/Tazobactam (Nhi)",
  nameNorm:"piperacillin tazobactam zosyn nhi",
  tradeName:"Zosyn",
  class:"Beta-lactam/BLI – Penicillin phổ rộng",
  classNorm:"beta lactam bli penicillin pho rong",
  source:"ch18",
  dosingRows:[
    {ageGroup:"infant",label:"2–9 tháng",route:"IV",dose:"240–320 mg PIP/kg/ngày",interval:"Mỗi 8 giờ (IAI)",notes:""},
    {ageGroup:"child",label:">9 tháng",route:"IV",dose:"300–400 mg PIP/kg/ngày",interval:"Mỗi 6 giờ (HAP)",notes:"Liều tối đa 16 g PIP/ngày"}
  ],
  generalNotes:"Phổ rộng bao phủ gram âm, beta-lactamase và yếm khí; <strong>Liều cao hơn cần thiết cho viêm phổi bệnh viện</strong>; Không hiệu quả với MRSA và E. faecium",
  maxDose:"16 g PIP/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn gram âm phổ rộng có yếu tố yếm khí; Viêm phúc mạc/nhiễm khuẩn ổ bụng phức tạp; Viêm phổi bệnh viện"
},
{
  id:"rifampin_ch18",
  name:"Rifampin",
  nameNorm:"rifampin rifadin rifampicin",
  tradeName:"Rifadin",
  class:"Rifamycin",
  classNorm:"rifamycin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Lao (hàng ngày)",route:"PO, IV",dose:"15–20 mg/kg",interval:"Mỗi 24 giờ",notes:"Liều tối đa 600 mg/ngày"},
    {ageGroup:"child",label:"Lao (2 lần/tuần DOT)",route:"PO",dose:"15–20 mg/kg/liều",interval:"2×/tuần",notes:"Liều tối đa 600 mg/liều"},
    {ageGroup:"child",label:"Dự phòng não mô cầu (2 ngày)",route:"PO",dose:"20 mg/kg/ngày",interval:"Mỗi 12 giờ × 2 ngày",notes:"Liều tối đa 1.2 g/ngày"}
  ],
  generalNotes:"Cảm ứng mạnh CYP450, nhiều tương tác thuốc quan trọng (OCP, warfarin, corticosteroid); <strong>Không dùng đơn độc do nguy cơ kháng nhanh</strong>; Gây đổi màu đỏ cam vô hại cho nước tiểu, nước mắt và mồ hôi",
  maxDose:"600 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Điều trị lao (phối hợp đa thuốc); Dự phòng sau phơi nhiễm não mô cầu; Nhiễm S. aureus phối hợp kháng sinh diệt khuẩn khác"
},
{
  id:"tmp_smx_ch18",
  name:"TMP/SMX (Cotrimoxazole)",
  nameNorm:"trimethoprim sulfamethoxazole tmp smx cotrimoxazole bactrim septra",
  tradeName:"Bactrim, Septra",
  class:"Sulfonamide/Trimethoprim",
  classNorm:"sulfonamide trimethoprim",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Nhiễm khuẩn thông thường",route:"PO, IV",dose:"8 mg TMP/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"child",label:"Nhiễm khuẩn MIC 1 (vi khuẩn)",route:"PO, IV",dose:"12 mg TMP/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 640 mg TMP/ngày"},
    {ageGroup:"child",label:"Dự phòng UTI",route:"PO",dose:"2 mg TMP/kg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"Điều trị PCP",route:"PO, IV",dose:"15–20 mg TMP/kg/ngày",interval:"Mỗi 6–8 giờ",notes:"Không giới hạn max"},
    {ageGroup:"child",label:"Dự phòng PCP",route:"PO",dose:"150 mg TMP/m²/ngày",interval:"Mỗi 24 giờ hoặc mỗi 12 giờ, 3 lần/tuần",notes:"Liều tối đa 320 mg TMP/ngày"}
  ],
  generalNotes:"Phổ rộng, vai trò quan trọng dự phòng Pneumocystis ở suy giảm miễn dịch; <strong>Tránh dùng <2 tháng tuổi và thiếu G6PD</strong>; Theo dõi creatinine, CBC khi kéo dài",
  maxDose:"640 mg TMP/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Dự phòng/điều trị Pneumocystis jirovecii; Nhiễm CA-MRSA da mô mềm; Nhiễm Stenotrophomonas/Nocardia; Dự phòng tiết niệu tái phát; Thương hàn"
},
{
  id:"tobramycin_ch18",
  name:"Tobramycin",
  nameNorm:"tobramycin nebcin",
  tradeName:"Nebcin, Tobi",
  class:"Aminoglycoside",
  classNorm:"aminoglycoside",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"IV/IM",route:"IV, IM",dose:"3–7.5 mg/kg/ngày",interval:"Mỗi 8–24 giờ",notes:"CF: 7–10 mg/kg/ngày"},
    {ageGroup:"child",label:"Khí dung (≥6 tuổi)",route:"Inhaled",dose:"600 mg/ngày",interval:"Mỗi 12 giờ",notes:""}
  ],
  generalNotes:"Hoạt tính kháng Pseudomonas mạnh hơn gentamicin; <strong>Dạng khí dung cho trẻ ≥6 tuổi</strong> theo chu kỳ 28 ngày dùng/28 ngày nghỉ; Đỉnh mục tiêu 6–12 mg/L, đáy <2 mg/L",
  maxDose:"Theo TDM",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Đợt cấp xơ nang do Pseudomonas (dạng khí dung duy trì); Nhiễm Pseudomonas toàn thân; Phối hợp điều trị kinh nghiệm gram âm nặng"
},
{
  id:"valacyclovir_ch18",
  name:"Valacyclovir",
  nameNorm:"valacyclovir valtrex",
  tradeName:"Valtrex",
  class:"Antiviral – Nucleoside analog (prodrug)",
  classNorm:"antiviral nucleoside analog prodrug",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"VZV (≥3 tháng)",route:"PO",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 1 g/liều"},
    {ageGroup:"child",label:"HSV (≥3 tháng)",route:"PO",dose:"40 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1 g/liều"}
  ],
  generalNotes:"Tiền chất của acyclovir, sinh khả dụng PO cao hơn 3–5 lần; <strong>Chỉ phù hợp cho HSV/VZV không nặng</strong> — thể nặng vẫn cần acyclovir IV; Liều tối đa 1 g/liều",
  maxDose:"1 g/liều",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm HSV và VZV mức độ không nặng (thay thế acyclovir PO); Dự phòng CMV sau ghép tạng; Thuận tiện hơn acyclovir nhờ tần suất dùng thuốc thấp hơn"
},
{
  id:"vancomycin_ch18",
  name:"Vancomycin (Nhi >60 ngày)",
  nameNorm:"vancomycin nhi tre em",
  tradeName:"Vancocin",
  class:"Glycopeptide",
  classNorm:"glycopeptide",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Nhiễm khuẩn thông thường",route:"IV",dose:"40–60 mg/kg/ngày",interval:"Mỗi 6–8 giờ",notes:"Có phác đồ riêng cho trẻ < 60 ngày tuổi"},
    {ageGroup:"child",label:"Viêm màng não / nhiễm khuẩn nặng",route:"IV",dose:"60–80 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Mục tiêu AUC₂₄/MIC ≥400 mg·h/L cho MRSA MIC ≤1 mg/L; <strong>Không dùng đơn độc cho viêm màng não</strong> — phối hợp rifampin/cephalosporin thế hệ 3; Truyền chậm ≥60 phút phòng hội chứng Red Man",
  maxDose:"80 mg/kg/ngày (theo TDM)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm MRSA/MRSE; Enterococcus kháng ampicillin; Viêm màng não gram dương kháng penicillin; Nhiễm khuẩn gram dương nặng kháng beta-lactam"
},
{
  id:"dalbavancin_ch18",
  name:"Dalbavancin",
  nameNorm:"dalbavancin dalvance",
  tradeName:"Dalvance",
  class:"Glycopeptide thế hệ 2 – Lipoglycopeptide",
  classNorm:"glycopeptide lipoglycopeptide",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"<6 tuổi",route:"IV",dose:"22.5 mg/kg",interval:"Liều duy nhất",notes:""},
    {ageGroup:"child",label:"≥6 tuổi",route:"IV",dose:"18 mg/kg",interval:"Liều duy nhất",notes:"Liều tối đa 1,500 mg"}
  ],
  generalNotes:"T½ ~350 giờ cho phép hoàn tất liệu trình với một hoặc hai liều; <strong>Không cần theo dõi nồng độ thuốc</strong>, phù hợp mô hình ngoại trú; Liều theo tuổi: <6 tuổi dùng 22,5 mg/kg; ≥6 tuổi dùng 18 mg/kg",
  maxDose:"1,500 mg",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn da mô mềm cấp tính (ABSSSI) do gram dương; Nhiễm MRSA; Ưu tiên khi cần điều trị ngoại trú"
},
{
  id:"ceftazavibactam_ch18",
  name:"Ceftazidime/Avibactam",
  nameNorm:"ceftazidime avibactam avycaz caz avi",
  tradeName:"Avycaz",
  class:"Beta-lactam/BLI – Cephalosporin thế hệ 3 + Avibactam",
  classNorm:"beta lactam bli cephalosporin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"infant",label:"3–<6 tháng",route:"IV",dose:"120 mg ceftazidime/kg/ngày",interval:"Mỗi 8 giờ, truyền trong 2 giờ",notes:""},
    {ageGroup:"child",label:"≥6 tháng",route:"IV",dose:"150 mg ceftazidime/kg/ngày",interval:"Mỗi 8 giờ, truyền trong 2 giờ",notes:"Liều tối đa 6 g ceftazidime/ngày"}
  ],
  generalNotes:"Avibactam ức chế bền vững KPC và OXA-48; <strong>Không hiệu quả với metallo-beta-lactamase (NDM, VIM)</strong> — phối hợp aztreonam khi nghi ngờ nhóm enzym này; Liều cao hơn (200–300 mg/kg/ngày) cho nhiễm Pseudomonas nặng",
  maxDose:"6 g ceftazidime/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Enterobacterales kháng carbapenem sinh KPC; Pseudomonas aeruginosa đa kháng khi lựa chọn khác thất bại; Cần xác định cơ chế đề kháng trước khi chỉ định"
},
{
  id:"ceftolozane_tazo_ch18",
  name:"Ceftolozane/Tazobactam",
  nameNorm:"ceftolozane tazobactam zerbaxa",
  tradeName:"Zerbaxa",
  class:"Beta-lactam/BLI – Cephalosporin thế hệ 5 + Tazobactam",
  classNorm:"beta lactam bli cephalosporin the he 5",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"IV",dose:"60 mg ceftolozane/kg/ngày",interval:"Mỗi 8 giờ",notes:"Liều tối đa 3 g ceftolozane/ngày"}
  ],
  generalNotes:"Hoạt tính kháng Pseudomonas vượt trội nhờ ái lực cao với PBP3; <strong>Không hiệu quả với vi khuẩn sinh carbapenemase</strong> (KPC, metallo-beta-lactamase); Liều tính theo thành phần ceftolozane",
  maxDose:"3 g ceftolozane/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Pseudomonas aeruginosa đa kháng đã kháng ceftazidime và piperacillin/tazobactam; Nhiễm khuẩn gram âm phức tạp cần phổ kháng Pseudomonas mạnh; Dành cho nhiễm khuẩn phức tạp đã thất bại điều trị chuẩn"
}


,
{
  id:"ceftazavibactam_neo",
  name:"Ceftazidime/Avibactam (S\u01a1 sinh)",
  nameNorm:"ceftazidime avibactam caz avi so sinh",
  tradeName:"Avycaz",
  class:"Beta-lactam/BLI \u2013 Cephalosporin th\u1ebf h\u1ec7 3 + Avibactam",
  classNorm:"beta lactam bli cephalosporin avibactam caz avi",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"IV",dose:"60 mg ceftazidime/kg/ngày",interval:"Mỗi 8 giờ",notes:"Truy\u1ec1n 3 gi\u1edd m\u1ed7i li\u1ec1u"},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"IV",dose:"60 mg ceftazidime/kg/ngày",interval:"Mỗi 8 giờ",notes:"Truy\u1ec1n 3 gi\u1edd m\u1ed7i li\u1ec1u"},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"IV",dose:"60 mg ceftazidime/kg/ngày",interval:"Mỗi 8 giờ",notes:"Truy\u1ec1n 3 gi\u1edd m\u1ed7i li\u1ec1u"},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"IV",dose:"60 mg ceftazidime/kg/ngày",interval:"Mỗi 8 giờ",notes:"Truy\u1ec1n 3 gi\u1edd m\u1ed7i li\u1ec1u"},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"IV",dose:"90 mg ceftazidime/kg/ngày",interval:"Mỗi 8 giờ",notes:"T\u0103ng li\u1ec1u \u1edf 29\u201360 ng\u00e0y"}
  ],
  generalNotes:"Mở rộng phổ điều trị cho vi khuẩn đa kháng hiếm gặp ở hồi sức sơ sinh; <strong>Không hiệu quả với metallo-beta-lactamase</strong>; Cần hội chẩn chuyên khoa nhiễm trước khi dùng",
  maxDose:"90 mg ceftazidime/kg/ngày (29\u201360 ng\u00e0y)",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Nhiễm khuẩn nặng ở sơ sinh do Enterobacterales kháng carbapenem; Nhiễm chủng sinh KPC, OXA-48; Pseudomonas đa kháng"
},
{
  id:"ceftolozane_tazo_neo",
  name:"Ceftolozane/Tazobactam (S\u01a1 sinh)",
  nameNorm:"ceftolozane tazobactam zerbaxa so sinh",
  tradeName:"Zerbaxa",
  class:"Beta-lactam/BLI \u2013 Cephalosporin th\u1ebf h\u1ec7 5 + Tazobactam",
  classNorm:"beta lactam bli cephalosporin tazobactam zerbaxa so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u201328 ng\u00e0y",ageDays:[0,28],weightMax:2,route:"IV",dose:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u",interval:"\u2014",notes:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u"},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"IV",dose:"60 mg ceftolozane/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"IV",dose:"60 mg ceftolozane/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"IV",dose:"60 mg ceftolozane/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Lựa chọn dự trữ khi kháng sinh kháng Pseudomonas tiêu chuẩn thất bại; <strong>Chưa có dữ liệu liều ≤2000g</strong>; Không hiệu quả với vi khuẩn sinh carbapenemase",
  maxDose:"60 mg ceftolozane/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Pseudomonas aeruginosa đa kháng ở sơ sinh đủ cân (>2000g); Chủng đã kháng ceftazidime; Lựa chọn dự trữ khi kháng sinh kháng Pseudomonas tiêu chuẩn thất bại"
},
{
  id:"ceftaroline_neo",
  name:"Ceftaroline (S\u01a1 sinh)",
  nameNorm:"ceftaroline teflaro so sinh",
  tradeName:"Teflaro",
  class:"Beta-lactam \u2013 Cephalosporin th\u1ebf h\u1ec7 5 (anti-MRSA)",
  classNorm:"beta lactam cephalosporin the he 5 mrsa so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"18 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"18 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"18 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"IV, IM",dose:"18 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"FDA phê duyệt cho sơ sinh từ 2019, beta-lactam duy nhất hiệu quả trên MRSA; <strong>Ưu điểm lớn nhất: không cần theo dõi nồng độ thuốc (TDM)</strong>; Liều tăng dần theo tuổi sau sinh, tối đa 36 mg/kg/ngày",
  maxDose:"18 mg/kg/ngày (mỗi 8 giờ)",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Nhiễm khuẩn gram dương ở sơ sinh do MRSA; Nhiễm tụ cầu coagulase âm tính kháng methicillin; Thay thế vancomycin khi không thể theo dõi nồng độ thuốc"
},
{
  id:"ciprofloxacin_neo",
  name:"Ciprofloxacin (S\u01a1 sinh)",
  nameNorm:"ciprofloxacin cipro so sinh",
  tradeName:"Cipro IV",
  class:"Fluoroquinolone",
  classNorm:"fluoroquinolone so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"IV",dose:"15 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"IV",dose:"15 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"IV",dose:"25 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"IV",dose:"25 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"IV",dose:"25 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""}
  ],
  generalNotes:"⚠️ <strong>Chỉ dành dự trữ khi không có kháng sinh thay thế hiệu quả</strong> do lo ngại lý thuyết về tổn thương sụn khớp; Cần hội chẩn chuyên khoa nhiễm; Theo dõi khoảng QTc trong quá trình điều trị",
  maxDose:"25 mg/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Nhiễm khuẩn gram âm đa kháng ở sơ sinh khi không còn lựa chọn khác; Pseudomonas đa kháng; Tularemia (phối hợp gentamicin)"
}

,
/* ─── 5 THUỐC MỚI – CHAPTER 2 NEONATAL (Table 2B pp.98-100) ─── */
{
  id:"azithromycin_neo",
  name:"Azithromycin (S\u01a1 sinh)",
  nameNorm:"azithromycin zithromax so sinh",
  tradeName:"Zithromax IV",
  class:"Macrolide",
  classNorm:"macrolide so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"T\u1ea5t c\u1ea3 nh\u00f3m (0\u201360 ng\u00e0y), m\u1ecdi c\u00e2n n\u1eb7ng",ageDays:[0,60],route:"IV, PO",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Li\u1ec1u duy nh\u1ea5t m\u1ed7i ng\u00e0y, kh\u00f4ng ph\u00e2n bi\u1ec7t c\u00e2n n\u1eb7ng hay tu\u1ed5i"}
  ],
  generalNotes:"Thay thế erythromycin được ưu tiên, ít tác dụng phụ hơn; ⚠️ <strong>Cảnh báo nguy cơ hẹp môn vị phì đại khi dùng <6 tuần tuổi</strong>; Liều Ureaplasma gấp đôi liều thông thường",
  maxDose:"10 mg/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Viêm phổi/viêm kết mạc sơ sinh do Chlamydia trachomatis; Ho gà do Bordetella pertussis; Nhiễm Ureaplasma spp. (liều cao)"
},
{
  id:"aztreonam_neo",
  name:"Aztreonam (S\u01a1 sinh)",
  nameNorm:"aztreonam azactam so sinh",
  tradeName:"Azactam",
  class:"Monobactam",
  classNorm:"monobactam so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"IV, IM",dose:"60 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"IV, IM",dose:"90 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"D\u00f9ng li\u1ec1u 0\u20137 ng\u00e0y \u0111\u1ebfn 14 ng\u00e0y n\u1ebfu c\u00e2n n\u1eb7ng <1000g"},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"IV, IM",dose:"90 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"IV, IM",dose:"120 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"IV, IM",dose:"120 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:""}
  ],
  generalNotes:"Monobactam duy nhất, chỉ hoạt tính trên gram âm hiếu khí; <strong>An toàn cho bệnh nhân dị ứng penicillin/cephalosporin</strong> nhờ phản ứng chéo rất thấp; Phối hợp ceftazidime/avibactam khi nghi ngờ metallo-beta-lactamase",
  maxDose:"120 mg/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Nhiễm gram âm hiếu khí ở sơ sinh dị ứng beta-lactam khác; Phối hợp ceftazidime/avibactam điều trị metallo-beta-lactamase; Nhiễm Pseudomonas/Enterobacterales nhạy cảm"
},
{
  id:"amoxicillin_neo",
  name:"Amoxicillin (S\u01a1 sinh)",
  nameNorm:"amoxicillin amoxil so sinh",
  tradeName:"Amoxil",
  class:"Beta-lactam \u2013 Penicillin",
  classNorm:"beta lactam penicillin so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"PO",dose:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u",interval:"\u2014",notes:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u"},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"PO",dose:"75 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"FDA: susceptible H. influenzae non-CNS. D\u00f9ng 25 ho\u1eb7c 50 mg/mL suspension"},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"PO",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"PO",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Li\u1ec1u cao h\u01a1n 75 mg/kg/ngày cho E. coli step-down (MIC \u22648 mg/L)"},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"PO",dose:"100 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""}
  ],
  generalNotes:"Chỉ có dạng uống ở sơ sinh tại Mỹ; <strong>Chỉ chuyển sang khi đã xác định vi khuẩn nhạy cảm và lâm sàng ổn định</strong>; Chưa có dữ liệu liều ≤2000g, 0–7 ngày tuổi",
  maxDose:"100 mg/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Xuống thang nhiễm khuẩn tiết niệu sơ sinh do E. coli nhạy cảm; Nhiễm H. influenzae không xâm lấn ngoài thần kinh trung ương; Phù hợp khi lâm sàng đã ổn định và xác định vi khuẩn nhạy cảm"
},
{
  id:"amoxclav_neo",
  name:"Amoxicillin/Clavulanate (S\u01a1 sinh)",
  nameNorm:"amoxicillin clavulanate augmentin amoxclav so sinh",
  tradeName:"Augmentin",
  class:"Beta-lactam/BLI \u2013 Penicillin",
  classNorm:"beta lactam bli penicillin augmentin so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"PO",dose:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u",interval:"\u2014",notes:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u"},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"PO",dose:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u",interval:"\u2014",notes:"Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u"},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"PO",dose:"30 mg amox/kg/ngày",interval:"Mỗi 12 giờ",notes:"Li\u1ec1u t\u00ednh theo th\u00e0nh ph\u1ea7n amoxicillin"},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"PO",dose:"30 mg amox/kg/ngày",interval:"Mỗi 12 giờ",notes:"Li\u1ec1u t\u00ednh theo th\u00e0nh ph\u1ea7n amoxicillin"},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"PO",dose:"30 mg amox/kg/ngày",interval:"Mỗi 12 giờ",notes:"Li\u1ec1u t\u00ednh theo th\u00e0nh ph\u1ea7n amoxicillin"}
  ],
  generalNotes:"Vai trò giới hạn ở giai đoạn xuống thang, không phải lựa chọn khởi đầu; <strong>Chỉ có dữ liệu liều cho cân nặng >2000g</strong>; Không phải lựa chọn khởi đầu điều trị nhiễm khuẩn nặng",
  maxDose:"30 mg amox/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Xuống thang nhiễm khuẩn tiết niệu ở sơ sinh đủ cân (>2000g); Viêm tai giữa do vi khuẩn sinh beta-lactamase nhạy cảm; Cần dữ liệu vi khuẩn học xác định trước khi chuyển đổi"
},
{
  id:"erythromycin_neo",
  name:"Erythromycin (S\u01a1 sinh)",
  nameNorm:"erythromycin erythrocin so sinh",
  tradeName:"Erythrocin / Ilosone",
  class:"Macrolide",
  classNorm:"macrolide so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"T\u1ea5t c\u1ea3 nh\u00f3m (0\u201360 ng\u00e0y), m\u1ecdi c\u00e2n n\u1eb7ng",ageDays:[0,60],route:"IV, PO",dose:"40 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Li\u1ec1u nh\u01b0 nhau cho m\u1ecdi nh\u00f3m tu\u1ed5i v\u00e0 c\u00e2n n\u1eb7ng"}
  ],
  generalNotes:"Macrolide kinh điển, đang dần thay thế bởi azithromycin; ⚠️ <strong>Cảnh báo FDA về nguy cơ hẹp môn vị phì đại ở sơ sinh</strong>; Theo dõi sát triệu chứng nôn vọt, đặc biệt <2 tuần tuổi",
  maxDose:"40 mg/kg/ngày",
  citation:"[4] Nelson's 2026 Ch.2B",
  indications:"Viêm phổi/viêm kết mạc sơ sinh do Chlamydia trachomatis; Ho gà do Bordetella pertussis; Nhiễm Ureaplasma (hàng thứ hai)"
}

,
/* ─── 4 ENTRIES MỚI – CHAPTER 2 NEONATAL (Table 2B & 2C) ─── */
{
  id:"tobramycin_neo",
  name:"Tobramycin (Sơ sinh)",
  nameNorm:"tobramycin nebcin so sinh aminoglycoside",
  tradeName:"Nebcin",
  class:"Aminoglycoside",
  classNorm:"aminoglycoside so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",gaRequired:true,gaGroup:"lt30",pnaGroup:"0-14",label:"GA <30 tuần, 0–14 ngày (PNA)",ageDays:[0,14],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 48 giờ",notes:"Liều theo GA/PNA"},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"lt30",pnaGroup:"gt14",label:"GA <30 tuần, >14 ngày (PNA)",ageDays:[15,60],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 36 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"30-34",pnaGroup:"0-10",label:"GA 30–34 tuần, 0–10 ngày (PNA)",ageDays:[0,10],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 36 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"30-34",pnaGroup:"gt10",label:"GA 30–34 tuần, >10 ngày (PNA)",ageDays:[11,60],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"ge35",pnaGroup:"0-7",label:"GA ≥35 tuần, 0–7 ngày (PNA)",ageDays:[0,7],route:"IV, IM",dose:"4 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",gaRequired:true,gaGroup:"ge35",pnaGroup:"gt7",label:"GA ≥35 tuần, >7 ngày (PNA)",ageDays:[8,60],route:"IV, IM",dose:"5 mg/kg/liều",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"Phân liều theo GA/PNA tương tự gentamicin; <strong>Ưu tiên hơn khi nghi ngờ Pseudomonas aeruginosa</strong> nhờ hoạt tính nội tại mạnh hơn; Nồng độ mục tiêu tương tự gentamicin (đỉnh 6–12 mg/L)",
  maxDose:"Theo TDM (5 mg/kg/liều tối đa)",
  citation:"[4] Nelson’s 2026 Ch.2C",
  indications:"Nhiễm gram âm hiếu khí sơ sinh nghi Pseudomonas/Enterobacterales; Phối hợp điều trị viêm màng não gram âm; Đợt cấp xơ nang sơ sinh"
},
{
  id:"daptomycin_neo",
  name:"Daptomycin (Sơ sinh)",
  nameNorm:"daptomycin cubicin so sinh lipopeptide",
  tradeName:"Cubicin",
  class:"Lipopeptide",
  classNorm:"lipopeptide so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"Tất cả nhóm (0–60 ngày), mọi cân nặng",ageDays:[0,60],route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"liều như nhau cho mọi nhóm; cảnh báo: potential neurotoxicity"}
  ],
  generalNotes:"⚠️ <strong>Nguy cơ độc thần kinh đáng kể</strong> — chỉ dùng khi không còn lựa chọn khác; <strong>Không dùng cho viêm phổi</strong> (bất hoạt bởi surfactant); Theo dõi CPK định kỳ",
  maxDose:"12 mg/kg/ngày (mỗi 12 giờ sơ sinh)",
  citation:"[4] Nelson’s 2026 Ch.2B",
  indications:"Nhiễm gram dương nặng ở sơ sinh do MRSA kháng vancomycin và linezolid; Nhiễm Enterococcus đa kháng; Thuốc cứu cánh cuối"
},
{
  id:"amphotericin_b_neo",
  name:"Amphotericin B – 3 dạng (Sơ sinh)",
  nameNorm:"amphotericin b deoxycholate lipid complex liposomal ambiosome abelcet so sinh antifungal",
  tradeName:"Fungizone / Abelcet / AmBisome",
  class:"Antifungal – Polyene",
  classNorm:"antifungal polyene amphotericin so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"AmB Deoxycholate (AmB-D) – tất cả nhóm",ageDays:[0,60],route:"IV",dose:"1 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Truyền chậm 4–6 giờ; theo dõi chức năng thận, kali, magiê máu"},
    {ageGroup:"neonate",label:"AmB Lipid Complex (ABLC/Abelcet) – tất cả nhóm",ageDays:[0,60],route:"IV",dose:"5 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Truyền 2.5 mg/kg/h; lắc lọn trước khi truyền"},
    {ageGroup:"neonate",label:"AmB Liposomal (L-AmB/AmBisome) – tất cả nhóm",ageDays:[0,60],route:"IV",dose:"5 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Dạng ưu tiên trong NICU: ít độc thận nhất"}
  ],
  generalNotes:"Ba dạng bào chế khác biệt độc tính rõ rệt; <strong>L-AmB ưu tiên trong hồi sức sơ sinh nhờ ít độc thận nhất</strong>; Theo dõi creatinine, kali, magiê xuyên suốt",
  maxDose:"AmB-D: 1 mg/kg/ngày | ABLC: 5 mg/kg/ngày | L-AmB: 5 mg/kg/ngày",
  citation:"[4] Nelson’s 2026 Ch.2B",
  indications:"Candidiasis xâm lấn sơ sinh bao gồm thần kinh trung ương và mắt; Nhiễm Aspergillus trong hồi sức sơ sinh; Khi azole/echinocandin không phù hợp"
}

,
/* ─── ACYCLOVIR / GANCICLOVIR / VALGANCICLOVIR – CHAPTER 2 NEONATAL (Table 2B p.98-100) ─── */
{
  id:"acyclovir_neo",
  name:"Acyclovir (Sơ sinh)",
  nameNorm:"acyclovir zovirax hsv herpes so sinh",
  tradeName:"Zovirax IV",
  class:"Antiviral – Nucleoside analog",
  classNorm:"antiviral nucleoside analog so sinh hsv herpes",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày – Điều trị cấp (IV)",ageDays:[0,7],weightMax:2,route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:"Chỉ dùng IV cho điều trị cấp; truyền trong 1 giờ"},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày – Điều trị cấp (IV)",ageDays:[8,28],weightMax:2,route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày – Điều trị cấp (IV)",ageDays:[0,7],weightMin:2,route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày – Điều trị cấp (IV)",ageDays:[8,28],weightMin:2,route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày – Điều trị cấp (IV)",ageDays:[29,60],route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày – Dự phòng (PO sau IV)",ageDays:[8,28],weightMax:2,route:"PO",dose:"900 mg/m²/ngày",interval:"Mỗi 8 giờ",notes:"Chỉ bắt đầu sau khi hoàn thành điều trị IV cấp; — cho ≤2000g 0–7 ngày"},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày – Dự phòng (PO sau IV)",ageDays:[8,28],weightMin:2,route:"PO",dose:"900 mg/m²/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày – Dự phòng (PO sau IV)",ageDays:[29,60],route:"PO",dose:"900 mg/m²/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"Thể da-mắt-miệng dùng IV 14 ngày; <strong>Thể TKTW/lan tỏa cần IV 21 ngày kèm PCR dịch não tủy âm tính trước khi ngừng</strong>; Bảo đảm đủ nước phòng độc thận",
  maxDose:"60 mg/kg/ngày (IV cấp) | 900 mg/m²/ngày mỗi 8 giờ (PO dự phòng)",
  citation:"[4] Nelson’s 2026 Ch.2A & Ch.2B",
  indications:"Nhiễm HSV sơ sinh thể da-mắt-miệng, thần kinh trung ương hoặc lan tỏa; Dự phòng tái phát đường uống 6 tháng sau điều trị IV; Theo dõi PCR dịch não tủy để xác định thời gian điều trị"
},
{
  id:"ganciclovir_neo",
  name:"Ganciclovir (Sơ sinh)",
  nameNorm:"ganciclovir cytovene cmv cytomegalovirus so sinh",
  tradeName:"Cytovene IV",
  class:"Antiviral – Nucleoside analog (CMV)",
  classNorm:"antiviral nucleoside analog cmv cytomegalovirus so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Truyền chậm ≥ 1 giờ"},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""}
  ],
  generalNotes:"Mục tiêu giảm nguy cơ mất thính lực tiến triển, liệu trình chuẩn 6 tuần; <strong>Theo dõi công thức máu hàng tuần</strong> — ức chế tủy xương là tác dụng phụ giới hạn liều; Có thể chuyển sang valganciclovir uống sau 2–6 tuần đầu điều trị",
  maxDose:"12 mg/kg/ngày (mỗi 12 giờ)",
  citation:"[4] Nelson’s 2026 Ch.2B",
  indications:"Nhiễm CMV bẩm sinh có triệu chứng, đặc biệt tổn thương TKTW/mất thính lực; Viêm võng mạc do CMV ở sơ sinh; Cải thiện kết cục thính giác và thần kinh dài hạn"
},
{
  id:"valganciclovir_neo",
  name:"Valganciclovir (Sơ sinh)",
  nameNorm:"valganciclovir valcyte cmv cytomegalovirus so sinh",
  tradeName:"Valcyte",
  class:"Antiviral – Nucleoside analog (CMV prodrug)",
  classNorm:"antiviral nucleoside analog cmv cytomegalovirus prodrug so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"PO",dose:"Không có dữ liệu",interval:"—",notes:"Không có dữ liệu"},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"PO",dose:"Không có dữ liệu",interval:"—",notes:"Không có dữ liệu"},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"PO",dose:"32 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"PO",dose:"32 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"PO",dose:"32 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""}
  ],
  generalNotes:"Sinh khả dụng PO cao hơn ganciclovir uống 10 lần; <strong>Theo dõi công thức máu mỗi 2–4 tuần</strong>; Chưa có dữ liệu liều ≤2000g",
  maxDose:"32 mg/kg/ngày mỗi 12 giờ (chỉ >2000g)",
  citation:"[4] Nelson’s 2026 Ch.2B",
  indications:"Nhiễm CMV bẩm sinh có triệu chứng ở sơ sinh đủ cân (>2000g); Bước xuống thang sau ganciclovir IV; Hoàn tất liệu trình 6 tháng"
}

,
/* ─── MICAFUNGIN / VORICONAZOLE – CHAPTER 2 NEONATAL (Table 2B p.100) ─── */
{
  id:"micafungin_neo",
  name:"Micafungin (Sơ sinh)",
  nameNorm:"micafungin mycamine echinocandin so sinh antifungal",
  tradeName:"Mycamine",
  class:"Antifungal – Echinocandin",
  classNorm:"antifungal echinocandin so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"đồng nhất 10 mg/kg/ngày mỗi 24 giờ cho mọi nhóm sơ sinh"},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"Liều sơ sinh (10 mg/kg/ngày) cao hơn trẻ lớn do thanh thải tăng; <strong>An toàn thận hơn amphotericin B, ít tương tác hơn azole</strong>; Liều dự phòng thấp hơn liều điều trị",
  maxDose:"10 mg/kg/ngày",
  citation:"[4] Nelson’s 2026 Ch.2B",
  indications:"Candidiasis xâm lấn sơ sinh (huyết, TKTW, võng mạc); Dự phòng nấm xâm lấn trong hồi sức sơ sinh; Thay fluconazole khi nghi kháng azole"
},
{
  id:"voriconazole_neo",
  name:"Voriconazole (Sơ sinh)",
  nameNorm:"voriconazole vfend azole antifungal so sinh",
  tradeName:"Vfend",
  class:"Antifungal – Triazole thế hệ 2",
  classNorm:"antifungal triazole azole so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"≤2000g, 0–7 ngày",ageDays:[0,7],weightMax:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"—"},
    {ageGroup:"neonate",label:"≤2000g, 8–28 ngày",ageDays:[8,28],weightMax:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0–7 ngày",ageDays:[0,7],weightMin:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8–28 ngày",ageDays:[8,28],weightMin:2,route:"IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"29–60 ngày",ageDays:[29,60],route:"IV",dose:"16 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Tăng liều lên 16 mg/kg/ngày từ 29–60 ngày"}
  ],
  generalNotes:"Dữ liệu dược động học sơ sinh còn hạn chế; <strong>Theo dõi men gan và nồng độ đáy nếu có thể (mục tiêu 1–5,5 mg/L)</strong>; Rối loạn thị giác thường tự hồi phục",
  maxDose:"16 mg/kg/ngày mỗi 12 giờ (29–60 ngày)",
  citation:"[4] Nelson’s 2026 Ch.2B",
  indications:"Nhiễm Aspergillus trong hồi sức sơ sinh; Candida đã kháng echinocandin/amphotericin B; Nhiễm nấm sợi đa kháng"
}


,
/* ═══════════════════════════════════════════════════════════
   ENTRIES CÒN THIẾU – BỔ SUNG THEO NGUỒN
   - Ch.18 cho các thuốc chỉ có Ch.2
   - Ch.2 cho Dalbavancin & Rifampin (có trong Table 2B)
   ═══════════════════════════════════════════════════════════ */

/* Ch.18 – Amphotericin B (3 dạng) */
{
  id:"amphotericin_b_ch18",
  name:"Amphotericin B – 3 dạng (Nhi khoa)",
  nameNorm:"amphotericin b deoxycholate lipid complex liposomal ambisome abelcet nhi antifungal",
  tradeName:"Fungizone / Abelcet / AmBisome",
  class:"Antifungal \u2013 Polyene",
  classNorm:"antifungal polyene amphotericin nhi",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"AmB Deoxycholate (AmB-D) \u2013 Th\u00f4ng th\u01b0\u1eddng",route:"IV",dose:"1\u20131.5 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa 150 mg/ngày. Candida th\u1ef1c qu\u1ea3n ho\u1eb7c b\u00e0ng quang: 0.5 mg/kg/ngày"},
    {ageGroup:"child",label:"AmB Lipid Complex (ABLC/Abelcet)",route:"IV",dose:"5 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"L\u00ean \u0111\u1ebfn 10 mg/kg ho\u1eb7c 500 mg/ngày cho nhi\u1ec5m TKTW"},
    {ageGroup:"child",label:"AmB Liposomal (L-AmB/AmBisome)",route:"IV",dose:"5 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"L\u00ean \u0111\u1ebfn 10 mg/kg ho\u1eb7c 500 mg/ngày cho nhi\u1ec5m TKTW"}
  ],
  generalNotes:"AmB-D rẻ nhất nhưng độc thận cao nhất trong 3 dạng; <strong>ABLC/L-AmB ưu tiên khi cần liều cao hoặc nhiễm TKTW</strong>; Theo dõi creatinine, kali, magiê",
  maxDose:"AmB-D: 150 mg/ngày | ABLC/L-AmB: 10 mg/kg ho\u1eb7c 500 mg/ngày (TKTW)",
  citation:"[4] Nelson\u2019s 2026 Ch.18",
  indications:"Nhiễm Aspergillus xâm lấn; Candida xâm lấn (huyết, thần kinh trung ương); Nhiễm Mucor/Histoplasma; Nấm hệ thống kháng azole/echinocandin"
},

/* Ch.18 – Aztreonam */
{
  id:"aztreonam_ch18",
  name:"Aztreonam (Nhi khoa)",
  nameNorm:"aztreonam azactam nhi monobactam",
  tradeName:"Azactam",
  class:"Monobactam",
  classNorm:"monobactam nhi",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Tr\u1ebb em",route:"IV, IM",dose:"90\u2013120 mg/kg/ngày",interval:"M\u1ed7i 6\u20138 gi\u1edd",notes:"Liều tối đa 8 g/ngày (m\u1ee9c I)"}
  ],
  generalNotes:"Lựa chọn an toàn cho dị ứng beta-lactam nghiêm trọng (trừ phản ứng chéo hiếm với ceftazidime); <strong>Không có hoạt tính gram dương và yếm khí</strong>; Cần phối hợp kháng sinh khác nếu nghi đa tác nhân",
  maxDose:"8 g/ngày",
  citation:"[4] Nelson\u2019s 2026 Ch.18",
  indications:"Nhiễm gram âm hiếu khí nặng ở bệnh nhân dị ứng beta-lactam; Nhiễm Pseudomonas aeruginosa; Phối hợp ceftazidime/avibactam; Đợt cấp xơ nang"
},

/* Ch.18 – Erythromycin */
{
  id:"erythromycin_ch18",
  name:"Erythromycin (Nhi khoa)",
  nameNorm:"erythromycin erythrocin ilosone nhi macrolide",
  tradeName:"Erythrocin / E.E.S.",
  class:"Macrolide",
  classNorm:"macrolide nhi",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Erythromycin base / huy\u1ec1n d\u1ecbch (PO)",route:"PO",dose:"50 mg/kg/ngày",interval:"M\u1ed7i 6\u20138 gi\u1edd",notes:"Liều tối đa 4 g/ngày (m\u1ee9c I). \u0110\u1ed9ng l\u1ef1c GI: 12\u201340 mg/kg/ngày, tối đa 250 mg/li\u1ec1u"},
    {ageGroup:"child",label:"Erythromycin lactobionate (IV)",route:"IV",dose:"20 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Liều tối đa 4 g/ngày (m\u1ee9c I)"}
  ],
  generalNotes:"Phần lớn bị thay thế bởi azithromycin do ít tương tác hơn; ⚠️ <strong>Nguy cơ hẹp môn vị phì đại ở trẻ <6 tuần</strong>; Nhiều Ureaplasma đã kháng thuốc",
  maxDose:"4 g/ngày",
  citation:"[4] Nelson\u2019s 2026 Ch.18",
  indications:"Nhiễm Chlamydia trachomatis; Ho gà; Nhiễm Mycoplasma/viêm phổi không điển hình; Tăng động lực tiêu hóa (off-label)"
},

/* Ch.18 – Ganciclovir */
{
  id:"ganciclovir_ch18",
  name:"Ganciclovir (Nhi khoa)",
  nameNorm:"ganciclovir cytovene cmv cytomegalovirus nhi antiviral",
  tradeName:"Cytovene IV",
  class:"Antiviral \u2013 Nucleoside analog (CMV)",
  classNorm:"antiviral nucleoside analog cmv cytomegalovirus nhi",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"CMV \u0111i\u1ec1u tr\u1ecb (kh\u00f4ng b\u1ea9m sinh)",route:"IV",dose:"10 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"M\u1ee9c I. Kh\u00e1c v\u1edbi CMV b\u1ea9m sinh (s\u01a1 sinh)"},
    {ageGroup:"child",label:"CMV \u1ee9c ch\u1ebf t\u00e1i ph\u00e1t (suppression)",route:"IV",dose:"5 mg/kg",interval:"Mỗi 24 giờ",notes:"M\u1ee9c I"},
    {ageGroup:"child",label:"VZV \u0111i\u1ec1u tr\u1ecb (n\u1eb7ng)",route:"IV",dose:"10 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"M\u1ee9c III"}
  ],
  generalNotes:"Liều CMV không bẩm sinh (10 mg/kg/ngày) thấp hơn liều CMV bẩm sinh; <strong>Phân biệt rõ hai phác đồ để tránh nhầm liều</strong>; Theo dõi công thức máu định kỳ",
  maxDose:"Theo c\u00e2n n\u1eb7ng (10 mg/kg/ngày \u0111i\u1ec1u tr\u1ecb)",
  citation:"[4] Nelson\u2019s 2026 Ch.18",
  indications:"Nhiễm CMV xâm lấn không bẩm sinh; Viêm võng mạc CMV; Nhiễm CMV sau ghép tạng/tủy; VZV nặng không đáp ứng acyclovir"
},

/* Ch.18 – Nafcillin/Oxacillin */
{
  id:"nafcillin_ch18",
  name:"Nafcillin / Oxacillin (Nhi khoa)",
  nameNorm:"nafcillin oxacillin nallpen nhi beta lactam penicillin mssa",
  tradeName:"Nallpen / Bactocill",
  class:"Beta-lactam \u2013 Penicillin kh\u00e1ng penicillinase",
  classNorm:"beta lactam penicillin khang penicillinase nhi mssa",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Tr\u1ebb em (th\u00f4ng th\u01b0\u1eddng)",route:"IV, IM",dose:"150\u2013200 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"M\u1ee9c II. Ng\u01b0\u1eddi l\u1edbn: 6 g/ngày, t\u1ed1i \u0111a 12 g/ng\u00e0y (m\u1ee9c I), m\u1ed7i 4 gi\u1edd"}
  ],
  generalNotes:"Diệt khuẩn mạnh nhất và bằng chứng tốt nhất cho MSSA xâm lấn, vượt trội vancomycin trên chủng nhạy cảm; <strong>Không hiệu quả với MRSA</strong>; Cần làm kháng sinh đồ trước khi dùng kéo dài",
  maxDose:"200 mg/kg/ngày (Nhi) | 12 g/ngày (Ng\u01b0\u1eddi l\u1edbn)",
  citation:"[4] Nelson\u2019s 2026 Ch.18",
  indications:"Nhiễm khuẩn xâm lấn do MSSA; Viêm xương khớp; Viêm nội tâm mạc; Nhiễm khuẩn huyết"
},

/* Ch.18 – Valganciclovir (Nhi khoa) */
{
  id:"valganciclovir_ch18",
  name:"Valganciclovir (Nhi khoa)",
  nameNorm:"valganciclovir valcyte cmv cytomegalovirus nhi antiviral prodrug",
  tradeName:"Valcyte",
  class:"Antiviral \u2013 Nucleoside analog (CMV prodrug)",
  classNorm:"antiviral nucleoside analog cmv cytomegalovirus prodrug nhi",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"CMV b\u1ea9m sinh \u0111i\u1ec1u tr\u1ecb (PO)",route:"PO",dose:"32 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Khuy\u1ebfn c\u00e1o m\u1ee9c \u0111\u1ed9 ch\u1eddng c\u1ee9 II"},
    {ageGroup:"child",label:"D\u1ef1 ph\u00f2ng CMV sau gh\u00e9p (mg, kh\u00f4ng ph\u1ea3i mg/kg)",route:"PO",dose:"7 mg \u00d7 BSA \u00d7 CrCl (c\u00f4ng th\u1ee9c Schwartz)",interval:"Mỗi 24 giờ",notes:"Liều tối đa 900 mg/ngày (m\u1ee9c I). D\u1ef1 ph\u00f2ng \u2014 li\u1ec1u theo mg kh\u00f4ng theo mg/kg"}
  ],
  generalNotes:"Liều dự phòng sau ghép tính theo công thức cá thể hóa (BSA, Schwartz); <strong>Theo dõi công thức máu định kỳ</strong> do nguy cơ giảm bạch cầu trung tính; Tương tự ganciclovir đường tĩnh mạch về nguy cơ ức chế tủy xương",
  maxDose:"900 mg/ngày (d\u1ef1 ph\u00f2ng)",
  citation:"[4] Nelson\u2019s 2026 Ch.18",
  indications:"Nhiễm CMV bẩm sinh có triệu chứng (xuống thang sau ganciclovir IV); Dự phòng CMV sau ghép tạng/tủy; Bước xuống thang thuận tiện cho điều trị ngoại trú"
},

/* Ch.18 – Voriconazole (Nhi khoa) */
{
  id:"voriconazole_ch18",
  name:"Voriconazole (Nhi khoa)",
  nameNorm:"voriconazole vfend azole antifungal nhi triazole",
  tradeName:"Vfend",
  class:"Antifungal \u2013 Triazole th\u1ebf h\u1ec7 2",
  classNorm:"antifungal triazole azole nhi",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"\u22652 tu\u1ed5i v\u00e0 <50 kg (PO)",route:"PO",dose:"18 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 700 mg/ngày (m\u1ee9c I)"},
    {ageGroup:"child",label:"\u22652 tu\u1ed5i v\u00e0 <50 kg (IV) \u2013 Li\u1ec1u n\u1ea1p",route:"IV",dose:"18 mg/kg/ngày ng\u00e0y 1",interval:"Mỗi 12 giờ",notes:"Sau \u0111\u00f3 duy tr\u00ec 16 mg/kg/ngày mỗi 12 giờ (m\u1ee9c I)"},
    {ageGroup:"child",label:"\u22652 tu\u1ed5i v\u00e0 <50 kg (IV) \u2013 Duy tr\u00ec",route:"IV",dose:"16 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Sau ng\u00e0y 1 (m\u1ee9c I)"},
    {ageGroup:"child",label:"\u226550 kg (PO ho\u1eb7c IV)",route:"PO, IV",dose:"12 mg/kg/ngày LD ng\u00e0y 1, sau \u0111\u00f3 8 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"M\u1ee9c I"}
  ],
  generalNotes:"Nhiều tương tác qua CYP2C9/2C19/3A4; <strong>Không dùng cho trẻ <2 tuổi</strong>; Theo dõi nồng độ đáy (mục tiêu 1–5,5 mg/L)",
  maxDose:"700 mg/ngày (PO <50 kg) | theo TDM (IV)",
  citation:"[4] Nelson\u2019s 2026 Ch.18",
  indications:"Nhiễm Aspergillus xâm lấn (first-line); Candida kháng echinocandin/amphotericin B; Nhiễm nấm sợi hiếm (Fusarium, Scedosporium)"
},

/* Ch.2 – Dalbavancin (S\u01a1 sinh) */
{
  id:"dalbavancin_neo",
  name:"Dalbavancin (S\u01a1 sinh)",
  nameNorm:"dalbavancin dalvance lipoglycopeptide so sinh",
  tradeName:"Dalvance",
  class:"Glycopeptide th\u1ebf h\u1ec7 2 \u2013 Lipoglycopeptide",
  classNorm:"glycopeptide lipoglycopeptide so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"T\u1ea5t c\u1ea3 nh\u00f3m (0\u201360 ng\u00e0y), m\u1ecdi c\u00e2n n\u1eb7ng",ageDays:[0,60],route:"IV",dose:"22.5 mg/kg",interval:"Li\u1ec1u duy nh\u1ea5t",notes:"\u0111\u1ed3ng nh\u1ea5t 22.5 mg/kg 1 li\u1ec1u duy nh\u1ea5t cho m\u1ecdi nh\u00f3m"}
  ],
  generalNotes:"T½ rất dài (~350 giờ), điều trị trọn liệu trình chỉ một liều duy nhất; <strong>Chỉ giới hạn cho nhiễm khuẩn da mô mềm cấp tính</strong>; Chưa có đủ dữ liệu cho các vị trí nhiễm khuẩn khác ở sơ sinh",
  maxDose:"22.5 mg/kg (s\u01a1 sinh) \u2014 1 li\u1ec1u duy nh\u1ea5t",
  citation:"[4] Nelson\u2019s 2026 Ch.2B",
  indications:"Nhiễm khuẩn da mô mềm cấp tính gram dương ở sơ sinh; Nhiễm MRSA/MSSA; Cần liệu trình đơn giản hóa"
},

/* Ch.2 – Rifampin (S\u01a1 sinh) */
{
  id:"rifampin_neo",
  name:"Rifampin (S\u01a1 sinh)",
  nameNorm:"rifampin rifampicin rifadin so sinh",
  tradeName:"Rifadin",
  class:"Rifamycin",
  classNorm:"rifamycin so sinh",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"IV, PO",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"—"},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"IV, PO",dose:"15 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"IV, PO",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"IV, PO",dose:"15 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"T\u0103ng l\u00ean 15 mg/kg/ngày sau 7 ng\u00e0y tu\u1ed5i >2000g"},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"IV, PO",dose:"15 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""}
  ],
  generalNotes:"<strong>Không dùng đơn độc trong bất kỳ chỉ định nào</strong> do nguy cơ kháng nhanh; Gây đổi màu đỏ cam vô hại cho nước tiểu/nước mắt; Cần thông báo trước cho gia đình về đổi màu nước tiểu/nước mắt",
  maxDose:"15 mg/kg/ngày",
  citation:"[4] Nelson\u2019s 2026 Ch.2B",
  indications:"Hỗ trợ điều trị viêm màng não vi khuẩn ở sơ sinh (phối hợp); MRSA phối hợp vancomycin; Dự phòng sau phơi nhiễm não mô cầu"
},
{
  id:"imipenem_cilastatin_neo",
  name:"Imipenem/Cilastatin (S\u01a1 sinh)",
  nameNorm:"imipenem cilastatin so sinh primaxin carbapenem",
  tradeName:"Primaxin",
  class:"Beta-lactam \u2013 Carbapenem",
  classNorm:"beta lactam carbapenem",
  source:"ch2",
  dosingRows:[
    {ageGroup:"neonate",label:"\u22642000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMax:2,route:"IV",dose:"40 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:"\u22642000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMax:2,route:"IV",dose:"50 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 0\u20137 ng\u00e0y",ageDays:[0,7],weightMin:2,route:"IV",dose:"50 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:""},
    {ageGroup:"neonate",label:">2000g, 8\u201328 ng\u00e0y",ageDays:[8,28],weightMin:2,route:"IV",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""},
    {ageGroup:"neonate",label:"29\u201360 ng\u00e0y",ageDays:[29,60],route:"IV",dose:"75 mg/kg/ngày",interval:"Mỗi 8 giờ",notes:""}
  ],
  generalNotes:"⚠️ <strong>Nguy cơ co giật cao hơn meropenem rõ rệt</strong> — không phải lựa chọn đầu tay khi nghi tổn thương thần kinh trung ương; Ưu tiên meropenem cho viêm màng não; Cilastatin chỉ ức chế chuyển hóa thận, không có hoạt tính kháng khuẩn riêng",
  maxDose:"75 mg/kg/ngày (sơ sinh)",
  citation:"[4] Nelson's 2026 Ch.2",
  indications:"Nhiễm khuẩn gram âm đa kháng ở sơ sinh khi không có carbapenem khác phù hợp; Nhiễm khuẩn ổ bụng nặng; Cần cân nhắc kỹ giữa lợi ích và nguy cơ co giật"
},
{
  id:"imipenem_cilastatin_ch18",
  name:"Imipenem/Cilastatin (Nhi)",
  nameNorm:"imipenem cilastatin nhi primaxin carbapenem",
  tradeName:"Primaxin",
  class:"Beta-lactam \u2013 Carbapenem",
  classNorm:"beta lactam carbapenem",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Nhi\u1ec5m khu\u1ea9n th\u00f4ng th\u01b0\u1eddng",route:"IV",dose:"60 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Liều tối đa 2 g/ngày"},
    {ageGroup:"child",label:"Nhi\u1ec5m khu\u1ea9n n\u1eb7ng",route:"IV",dose:"100 mg/kg/ngày",interval:"Mỗi 6 giờ",notes:"Liều tối đa 4 g/ngày"}
  ],
  generalNotes:"Phổ rộng tương đương meropenem nhưng nguy cơ co giật cao hơn theo liều; <strong>Tránh dùng cho viêm màng não — chọn meropenem thay thế</strong>; Điều chỉnh liều khi suy giảm chức năng thận",
  maxDose:"4 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn gram âm đa kháng nặng; Nhiễm khuẩn ổ bụng phức tạp; Viêm phổi bệnh viện; Nhiễm khuẩn xương khớp nặng"
},
{
  id:"ertapenem_ch18",
  name:"Ertapenem",
  nameNorm:"ertapenem invanz carbapenem",
  tradeName:"Invanz",
  class:"Beta-lactam \u2013 Carbapenem",
  classNorm:"beta lactam carbapenem",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"3 th\u00e1ng \u2013 12 tu\u1ed5i",route:"IV, IM",dose:"30 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1 g/ngày"},
    {ageGroup:"child",label:"\u2265 13 tu\u1ed5i",route:"IV, IM",dose:"1 g/ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa 1 g/ngày"}
  ],
  generalNotes:"T½ dài (~4 giờ) cho phép dùng một lần/ngày ở trẻ ≥13 tuổi; <strong>Không có hoạt tính với Pseudomonas và Acinetobacter</strong>; Chưa khuyến cáo cho trẻ <3 tháng",
  maxDose:"1 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn ổ bụng phức tạp; Nhiễm khuẩn da mô mềm; Viêm phổi cộng đồng nặng; Nhiễm khuẩn tiết niệu phức tạp; Dự phòng phẫu thuật đại trực tràng"
},
{
  id:"anidulafungin_ch18",
  name:"Anidulafungin",
  nameNorm:"anidulafungin eraxis echinocandin",
  tradeName:"Eraxis",
  class:"Antifungal – Echinocandin",
  classNorm:"antifungal echinocandin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em (theo cân nặng)",route:"IV",dose:"3 mg/kg liều nạp ngày 1, sau đó 1,5 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"Người lớn",route:"IV",dose:"200 mg liều nạp ngày 1, sau đó 100 mg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"Béo phì (liều cố định, không theo cân nặng)",route:"IV",dose:"250 mg liều nạp, sau đó 125 mg/ngày",interval:"Mỗi 24 giờ",notes:"Mức bằng chứng II"}
  ],
  generalNotes:"Hiệu quả trên chủng kháng fluconazole; <strong>Không cần điều chỉnh liều theo chức năng gan/thận</strong>; Thấm kém dịch não tủy — không dùng cho viêm màng não",
  maxDose:"250 mg liều nạp / 125 mg/ngày duy trì (béo phì)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Candida xâm lấn và candidemia; Nhiễm Candida ổ bụng/thực quản; Thay thế khi không dung nạp thuốc kháng nấm khác"
},
{
  id:"caspofungin_ch18",
  name:"Caspofungin",
  nameNorm:"caspofungin cancidas echinocandin",
  tradeName:"Cancidas",
  class:"Antifungal – Echinocandin",
  classNorm:"antifungal echinocandin",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em (theo BSA)",route:"IV",dose:"70 mg/m² liều nạp ngày 1, sau đó 50 mg/m²/ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa 70 mg/ngày"},
    {ageGroup:"child",label:"Béo phì",route:"IV",dose:"Theo phác đồ chuẩn (70 mg/m² → 50 mg/m²)",interval:"Mỗi 24 giờ",notes:"Liều tối đa 150 mg/ngày — Mức II"}
  ],
  generalNotes:"<strong>Liều tính theo diện tích da (BSA)</strong>, khác biệt so với echinocandin khác tính theo cân nặng; Kiểm tra tương tác khi phối hợp rifampin; Tương đối an toàn về gan/thận",
  maxDose:"70 mg/ngày (thông thường); 150 mg/ngày (béo phì)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Candida xâm lấn và candidemia; Nhiễm Aspergillus xâm lấn khi kháng/không dung nạp thuốc khác; Sốt giảm bạch cầu kinh nghiệm"
},
{
  id:"cefprozil_ch18",
  name:"Cefprozil",
  nameNorm:"cefprozil cefzil",
  tradeName:"Cefzil",
  class:"Beta-lactam – Cephalosporin thế hệ 2",
  classNorm:"beta lactam cephalosporin the he 2",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Trẻ em",route:"PO",dose:"15–30 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 1 g/ngày"}
  ],
  generalNotes:"Phổ tương tự cefaclor nhưng dược động học thuận lợi hơn; <strong>Liều mỗi 12 giờ</strong> thay vì mỗi 8 giờ; Hoạt tính tốt với phế cầu, H. influenzae, M. catarrhalis",
  maxDose:"1 g/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Viêm tai giữa cấp; Viêm họng-amidan; Viêm xoang; Nhiễm khuẩn da mô mềm nhẹ; Viêm phổi cộng đồng nhẹ"
},
{
  id:"ceftobiprole_ch18",
  name:"Ceftobiprole",
  nameNorm:"ceftobiprole zevtera medocaril",
  tradeName:"Zevtera",
  class:"Beta-lactam – Cephalosporin thế hệ 5 (anti-MRSA, anti-Pseudomonas)",
  classNorm:"beta lactam cephalosporin the he 5 mrsa pseudomonas",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"3 tháng – <12 tuổi",route:"IV",dose:"45 mg base/kg/liều",interval:"Mỗi 8 giờ, truyền trong 2 giờ",notes:""},
    {ageGroup:"child",label:"≥12 tuổi",route:"IV",dose:"30 mg base/kg/ngày",interval:"Mỗi 8 giờ, truyền trong 2 giờ",notes:"Liều tối đa 500 mg base/liều"}
  ],
  generalNotes:"<strong>Hiếm có hoạt tính kép vừa kháng MRSA vừa kháng Pseudomonas</strong>, lấp khoảng trống ceftaroline chưa đáp ứng; Bắt buộc truyền kéo dài 2 giờ mỗi liều; Liều tính theo thành phần base, không theo dạng muối medocaril",
  maxDose:"500 mg base/liều",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn da mô mềm phức tạp; Viêm phổi cộng đồng/bệnh viện; Nhiễm khuẩn huyết do S. aureus bao gồm MRSA"
},
{
  id:"levofloxacin_ch18",
  name:"Levofloxacin",
  nameNorm:"levofloxacin levaquin fluoroquinolone",
  tradeName:"Levaquin",
  class:"Fluoroquinolone",
  classNorm:"fluoroquinolone",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"Dự phòng sau phơi nhiễm than (Anthrax), <50 kg",route:"PO, IV",dose:"16 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 500 mg/ngày"},
    {ageGroup:"child",label:"Dự phòng sau phơi nhiễm than (Anthrax), ≥50 kg",route:"PO, IV",dose:"500 mg/ngày",interval:"Mỗi 24 giờ",notes:""},
    {ageGroup:"child",label:"Nhiễm khuẩn hô hấp, <5 tuổi",route:"PO, IV",dose:"20 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Mức bằng chứng II"},
    {ageGroup:"child",label:"Nhiễm khuẩn hô hấp, ≥5 tuổi",route:"PO, IV",dose:"10 mg/kg/ngày",interval:"Mỗi 24 giờ",notes:"Liều tối đa 500 mg/ngày; lên đến 1.000 mg/liều nếu béo phì — Mức III"}
  ],
  generalNotes:"Sinh khả dụng PO cao, tương đương IV; <strong>Cân nhắc nguy cơ tổn thương sụn khớp</strong> tương tự fluoroquinolone khác; Theo dõi QTc",
  maxDose:"500 mg/ngày (thông thường); 1.000 mg/liều (béo phì)",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Dự phòng sau phơi nhiễm bệnh than; Nhiễm khuẩn hô hấp khi không có thay thế phù hợp; Nhiễm khuẩn tiết niệu phức tạp"
},
{
  id:"moxifloxacin_ch18",
  name:"Moxifloxacin",
  nameNorm:"moxifloxacin avelox fluoroquinolone",
  tradeName:"Avelox",
  class:"Fluoroquinolone",
  classNorm:"fluoroquinolone",
  source:"ch18",
  dosingRows:[
    {ageGroup:"child",label:"3 tháng – <2 tuổi",route:"PO, IV",dose:"12 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Chưa được FDA phê duyệt cho trẻ em — Mức II"},
    {ageGroup:"child",label:"2 – <6 tuổi",route:"PO, IV",dose:"10 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Chưa được FDA phê duyệt cho trẻ em — Mức II"},
    {ageGroup:"child",label:"6 – <12 tuổi",route:"PO, IV",dose:"8 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Liều tối đa 400 mg/ngày — Mức II"},
    {ageGroup:"child",label:"12 – <18 tuổi (CN <45 kg)",route:"PO, IV",dose:"8 mg/kg/ngày",interval:"Mỗi 12 giờ",notes:"Mức bằng chứng II"},
    {ageGroup:"child",label:"Người lớn / ≥18 tuổi",route:"PO, IV",dose:"400 mg/ngày",interval:"Mỗi 24 giờ",notes:"Mức bằng chứng I"}
  ],
  generalNotes:"⚠️ <strong>Chưa được FDA phê duyệt cho trẻ em</strong> — chỉ dùng khi lợi ích vượt trội nguy cơ; Nguy cơ tổn thương sụn khớp và kéo dài QTc; Không cần điều chỉnh liều theo chức năng thận đáng kể",
  maxDose:"400 mg/ngày",
  citation:"[4] Nelson's 2026 Ch.18",
  indications:"Nhiễm khuẩn hô hấp khi không có kháng sinh thay thế phù hợp; Chỉ định ngoài nhãn (off-label) ở trẻ em; Cân nhắc khi các fluoroquinolone khác không phù hợp"
}

]; // end NLS_DRUGS

/* ════════════════════════════════════════════════════════
   DRUG GROUPS – merge same active ingredient across sources
   ════════════════════════════════════════════════════════ */
const NLS_DRUG_GROUPS = [
  {base:"Acyclovir",               nameNorm:"acyclovir zovirax",                    ids:["acyclovir_neo","acyclovir_ch18"]},
  {base:"Amikacin",                nameNorm:"amikacin amikin",                      ids:["amikacin_neo","amikacin_ch18"]},
  {base:"Amoxicillin",             nameNorm:"amoxicillin amoxil",                   ids:["amoxicillin_neo","amoxicillin_ch18"]},
  {base:"Amoxicillin/Clavulanate", nameNorm:"amoxicillin clavulanate augmentin amoxclav", ids:["amoxclav_neo","amoxclav_ch18"]},
  {base:"Ampicillin",              nameNorm:"ampicillin",                           ids:["ampicillin_neo","ampicillin_iv_ch18","ampicillin_po_ch18"]},
  {base:"Amphotericin B",          nameNorm:"amphotericin b deoxycholate lipid liposomal ambisome abelcet", ids:["amphotericin_b_neo","amphotericin_b_ch18"]},
  {base:"Anidulafungin",            nameNorm:"anidulafungin eraxis echinocandin",    ids:["anidulafungin_ch18"]},
  {base:"Azithromycin",            nameNorm:"azithromycin zithromax",               ids:["azithromycin_neo","azithromycin_ch18"]},
  {base:"Aztreonam",               nameNorm:"aztreonam azactam",                    ids:["aztreonam_neo","aztreonam_ch18"]},
  {base:"Caspofungin",              nameNorm:"caspofungin cancidas echinocandin",    ids:["caspofungin_ch18"]},
  {base:"Cefazolin",               nameNorm:"cefazolin ancef mssa enterobacterales",ids:["cefazolin_mssa_neo","cefazolin_ent_neo","cefazolin_ch18"]},
  {base:"Cefaclor",                nameNorm:"cefaclor ceclor",                      ids:["cefaclor_ch18"]},
  {base:"Cefadroxil",              nameNorm:"cefadroxil duricef",                   ids:["cefadroxil_ch18"]},
  {base:"Cefdinir",                nameNorm:"cefdinir omnicef",                     ids:["cefdinir_ch18"]},
  {base:"Cefepime",                nameNorm:"cefepime maxipime",                    ids:["cefepime_neo","cefepime_ch18"]},
  {base:"Cefiderocol",             nameNorm:"cefiderocol fetroja",                  ids:["cefiderocol_ch18"]},
  {base:"Cefixime",                nameNorm:"cefixime suprax",                      ids:["cefixime_ch18"]},
  {base:"Cefotaxime",              nameNorm:"cefotaxime claforan",                  ids:["cefotaxime_neo","cefotaxime_ch18"]},
  {base:"Cefpodoxime",             nameNorm:"cefpodoxime vantin",                   ids:["cefpodoxime_ch18"]},
  {base:"Cefprozil",                nameNorm:"cefprozil cefzil",                     ids:["cefprozil_ch18"]},
  {base:"Ceftaroline",             nameNorm:"ceftaroline teflaro",                  ids:["ceftaroline_neo","ceftaroline_ch18"]},
  {base:"Ceftazidime",             nameNorm:"ceftazidime tazicef fortaz",            ids:["ceftazidime_neo","ceftazidime_ch18"]},
  {base:"Ceftazidime/Avibactam",   nameNorm:"ceftazidime avibactam caz avi avycaz", ids:["ceftazavibactam_neo","ceftazavibactam_ch18"]},
  {base:"Ceftobiprole",             nameNorm:"ceftobiprole zevtera medocaril",       ids:["ceftobiprole_ch18"]},
  {base:"Ceftolozane/Tazobactam",  nameNorm:"ceftolozane tazobactam zerbaxa",       ids:["ceftolozane_tazo_neo","ceftolozane_tazo_ch18"]},
  {base:"Ceftriaxone",             nameNorm:"ceftriaxone rocephin",                 ids:["ceftriaxone_neo","ceftriaxone_ch18"]},
  {base:"Cefuroxime",              nameNorm:"cefuroxime ceftin zinacef",            ids:["cefuroxime_po_ch18","cefuroxime_iv_ch18"]},
  {base:"Cephalexin",              nameNorm:"cephalexin keflex",                    ids:["cephalexin_ch18"]},
  {base:"Ciprofloxacin",           nameNorm:"ciprofloxacin cipro",                  ids:["ciprofloxacin_neo","ciprofloxacin_ch18"]},
  {base:"Clarithromycin",          nameNorm:"clarithromycin biaxin",                ids:["clarithromycin_ch18"]},
  {base:"Clindamycin",             nameNorm:"clindamycin cleocin",                  ids:["clindamycin_neo","clindamycin_ch18"]},
  {base:"Colistimethate",          nameNorm:"colistimethate colistin polymyxin",    ids:["colistimethate_ch18"]},
  {base:"Dalbavancin",             nameNorm:"dalbavancin dalvance",                 ids:["dalbavancin_neo","dalbavancin_ch18"]},
  {base:"Daptomycin",              nameNorm:"daptomycin cubicin",                   ids:["daptomycin_neo","daptomycin_ch18"]},
  {base:"Erythromycin",            nameNorm:"erythromycin erythrocin",              ids:["erythromycin_neo","erythromycin_ch18"]},
  {base:"Ertapenem",               nameNorm:"ertapenem invanz carbapenem",          ids:["ertapenem_ch18"]},
  {base:"Fluconazole",             nameNorm:"fluconazole diflucan",                 ids:["fluconazole_neo","fluconazole_ch18"]},
  {base:"Ganciclovir",             nameNorm:"ganciclovir cytovene cmv",             ids:["ganciclovir_neo","ganciclovir_ch18"]},
  {base:"Gentamicin",              nameNorm:"gentamicin garamycin aminoglycoside",  ids:["gentamicin_neo","gentamicin_ch18"]},
  {base:"Imipenem/Cilastatin",     nameNorm:"imipenem cilastatin primaxin carbapenem", ids:["imipenem_cilastatin_neo","imipenem_cilastatin_ch18"]},
  {base:"Isoniazid",               nameNorm:"isoniazid inh lao",                    ids:["isoniazid_ch18"]},
  {base:"Levofloxacin",             nameNorm:"levofloxacin levaquin fluoroquinolone",ids:["levofloxacin_ch18"]},
  {base:"Linezolid",               nameNorm:"linezolid zyvox",                      ids:["linezolid_neo","linezolid_ch18"]},
  {base:"Meropenem",               nameNorm:"meropenem merrem carbapenem",          ids:["meropenem_neo","meropenem_ch18"]},
  {base:"Metronidazole",           nameNorm:"metronidazole flagyl",                 ids:["metronidazole_neo","metronidazole_ch18"]},
  {base:"Micafungin",              nameNorm:"micafungin mycamine echinocandin",     ids:["micafungin_neo","micafungin_ch18"]},
  {base:"Moxifloxacin",             nameNorm:"moxifloxacin avelox fluoroquinolone",  ids:["moxifloxacin_ch18"]},
  {base:"Nafcillin/Oxacillin",     nameNorm:"nafcillin oxacillin",                  ids:["nafcillin_neo","nafcillin_ch18"]},
  {base:"Nitrofurantoin",          nameNorm:"nitrofurantoin furadantin macrodantin",ids:["nitrofurantoin_ch18"]},
  {base:"Oseltamivir",             nameNorm:"oseltamivir tamiflu",                  ids:["oseltamivir_ch18"]},
  {base:"Penicillin G",            nameNorm:"penicillin g crystalline bicillin gbs",ids:["penicillin_g_neo","penicillin_g_benz_ch18"]},
  {base:"Penicillin V",            nameNorm:"penicillin v pen vee",                 ids:["penicillin_v_ch18"]},
  {base:"Piperacillin/Tazobactam", nameNorm:"piperacillin tazobactam zosyn pip tazo",ids:["pip_tazo_neo","pip_tazo_ch18"]},
  {base:"Rifampin",                nameNorm:"rifampin rifadin rifampicin",           ids:["rifampin_neo","rifampin_ch18"]},
  {base:"TMP/SMX",                 nameNorm:"trimethoprim sulfamethoxazole tmp smx cotrimoxazole bactrim septra", ids:["tmp_smx_ch18"]},
  {base:"Tobramycin",              nameNorm:"tobramycin nebcin",                    ids:["tobramycin_neo","tobramycin_ch18"]},
  {base:"Valacyclovir",            nameNorm:"valacyclovir valtrex",                 ids:["valacyclovir_ch18"]},
  {base:"Valganciclovir",          nameNorm:"valganciclovir valcyte cmv",           ids:["valganciclovir_neo","valganciclovir_ch18"]},
  {base:"Vancomycin",              nameNorm:"vancomycin vancocin glycopeptide",     ids:["vancomycin_neo","vancomycin_ch18"]},
  {base:"Voriconazole",            nameNorm:"voriconazole vfend azole",             ids:["voriconazole_neo","voriconazole_ch18"]}
];

/* Build reverse lookup: drug_id → group */
const NLS_ID_TO_GROUP = {};
NLS_DRUG_GROUPS.forEach(g => g.ids.forEach(id => { NLS_ID_TO_GROUP[id] = g; }));


/* ════════════════════════════════════════════════════════
   PATIENT CLASSIFICATION LOGIC
   ════════════════════════════════════════════════════════ */
let nlsPatientData = null;

function nlsCalcPatient(){
  const ageRaw = parseFloat(document.getElementById("nlsAgeVal").value);
  const ageUnit = document.getElementById("nlsAgeUnit").value;
  const weight = parseFloat(document.getElementById("nlsWeightVal").value);
  const gender = document.getElementById("nlsGender").value;

  if(isNaN(ageRaw)||ageRaw<0){ alert("Vui lòng nhập tuổi hợp lệ."); return; }
  if(isNaN(weight)||weight<=0){ alert("Vui lòng nhập cân nặng hợp lệ."); return; }

  // Convert to days
  let ageDays = 0;
  if(ageUnit==="days") ageDays = ageRaw;
  else if(ageUnit==="weeks") ageDays = ageRaw * 7;
  else if(ageUnit==="months") ageDays = ageRaw * 30.4375;
  else if(ageUnit==="years") ageDays = ageRaw * 365.25;

  const ageWeeks = ageDays / 7;
  const ageMonths = ageDays / 30.4375;
  const ageYears = ageDays / 365.25;

  // Classification
  let ageGroup, ageLabel, bandClass;
  if(ageDays <= 28){
    ageGroup = "neonate"; ageLabel = "Sơ sinh (Neonate) ≤28 ngày"; bandClass = "neonate";
  } else if(ageDays <= 60){
    ageGroup = "neonate_late"; ageLabel = "Sơ sinh muộn (29–60 ngày)"; bandClass = "neonate";
  } else if(ageMonths < 12){
    ageGroup = "infant"; ageLabel = "Nhũ nhi (Infant) " + ageMonths.toFixed(1) + " tháng"; bandClass = "infant";
  } else if(ageYears < 18){
    ageGroup = "child"; ageLabel = "Trẻ em (Child) " + ageYears.toFixed(1) + " tuổi"; bandClass = "child";
  } else {
    ageGroup = "adult"; ageLabel = "Người lớn (Adult)"; bandClass = "child";
  }

  nlsPatientData = { ageDays, ageWeeks, ageMonths, ageYears, weight, gender, ageGroup, ageLabel, bandClass };

  // Display
  const headerEl = document.getElementById("nlsResultHeader");
  const gridEl = document.getElementById("nlsResultGrid");
  const infoEl = document.getElementById("nlsAgeBandInfo");
  headerEl.className = "result-header " + bandClass;

  const icons = {neonate:"🍼",infant:"👶",child:"🧒",adult:"🧑"};
  headerEl.innerHTML = `<span>${icons[ageGroup]||"👤"}</span> Kết Quả Phân Loại Bệnh Nhân`;

  const ageDisplay = ageUnit==="days" ? ageRaw+" ngày"
    : ageUnit==="weeks" ? ageRaw+" tuần ("+Math.round(ageDays)+" ngày)"
    : ageUnit==="months" ? ageRaw+" tháng"
    : ageRaw+" năm";

  gridEl.innerHTML = `
    <div class="result-item"><div class="label">Tuổi nhập</div><div class="value">${ageDisplay}</div></div>
    <div class="result-item"><div class="label">Tuổi (ngày)</div><div class="value">${ageDays.toFixed(0)} ngày</div></div>
    <div class="result-item"><div class="label">Cân nặng</div><div class="value">${weight} kg</div></div>
    <div class="result-item"><div class="label">Giới tính</div><div class="value">${gender==="male"?"Nam ♂":"Nữ ♀"}</div></div>
  `;

  const chNeo  = '<strong style="color:#9b59b6">SƠ SINH</strong>';
  const chPed  = '<strong style="color:#27ae60">NHI KHOA</strong>';
  const bandDescriptions = {
    preterm:      `Nhóm SƠ SINH NON THÁNG (&lt;37 tuần GA) – Dùng phác đồ ${chNeo}, phân liều theo tuổi thai (GA) + tuổi sau sinh (PNA).`,
    neonate:      `Nhóm SƠ SINH ≤28 ngày – Dùng phác đồ ${chNeo}, phân nhóm theo cân nặng (&lt;2000g / &gt;2000g) và ngày tuổi.`,
    neonate_late: `Nhóm SƠ SINH MUỘN 29–60 ngày – Dùng phác đồ ${chNeo}, cột '29–60 ngày'.`,
    infant:       `Nhóm NHŨ NHI (2–12 tháng) – Dùng phác đồ ${chPed}; một số thuốc phân liều theo tháng tuổi.`,
    child:        `Nhóm TRẺ EM (≥1 tuổi đến &lt;18 tuổi) – Dùng phác đồ ${chPed}, phân liều theo cân nặng và tuổi.`,
    adult:        `Nhóm NGƯỜI LỚN (≥18 tuổi) – Sử dụng liều người lớn từ phác đồ ${chPed}.`
  };

  infoEl.innerHTML = `<span class="age-band-tag ${bandClass}">${ageLabel}</span>
    <div class="notes-box" style="margin-top:8px">⚡ ${bandDescriptions[ageGroup]||""}</div>`;


  document.getElementById("nlsPatientResult").classList.add("show");

  // Auto-search if a drug is already shown
  const currentDrug = document.getElementById("nlsDrugSearch").value;
  if(currentDrug.trim() && nlsPatientData){
    const drug = NLS_DRUGS.find(d=>d.name===currentDrug || d.id===currentDrug);
    if(drug) nlsShowDrugResult(drug);
  }
}

/* ════════════════════════════════════════════════════════
   SEARCH + AUTOCOMPLETE
   ════════════════════════════════════════════════════════ */
let dropdownIdx = -1;

function nlsNormalize(str){
  return str.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g,"");
}

function nlsOnSearchInput(val){
  const q = nlsNormalize(val);
  const list = document.getElementById("nlsDropdownList");
  if(!q){ list.innerHTML=""; list.classList.remove("show"); return; }

  // Search NLS_DRUG_GROUPS first (merged view)
  const matchedGroups = NLS_DRUG_GROUPS.filter(g =>
    nlsNormalize(g.base).includes(q) || nlsNormalize(g.nameNorm).includes(q) ||
    g.ids.some(id => {
      const d = NLS_DRUGS.find(d=>d.id===id);
      return d && (nlsNormalize(d.tradeName||"").includes(q) || nlsNormalize(d.classNorm||"").includes(q));
    })
  ).slice(0, 12);

  if(!matchedGroups.length){
    list.innerHTML="<div style='padding:10px 14px;color:#999;font-size:14px'>Không tìm thấy kết quả</div>";
    list.classList.add("show"); return;
  }

  list.innerHTML = matchedGroups.map((g,i) => {
    const drugs = g.ids.map(id=>NLS_DRUGS.find(d=>d.id===id)).filter(Boolean);
    const cls = drugs[0] ? drugs[0].class.split(" – ")[0] : "";
    return `<div class="dropdown-item" data-idx="${i}" onclick="nlsSelectGroup('${g.base}')">
      <div class="drug-name">${g.base}</div>
      <div class="drug-class">${cls}</div>
    </div>`;
  }).join("");
  list.classList.add("show");
  dropdownIdx = -1;
}

function nlsOnSearchKeydown(e){
  const list = document.getElementById("nlsDropdownList");
  const items = list.querySelectorAll(".dropdown-item");
  if(!list.classList.contains("show")||!items.length) return;
  if(e.key==="ArrowDown"){ e.preventDefault(); dropdownIdx=Math.min(dropdownIdx+1,items.length-1); nlsHighlightItem(items); }
  else if(e.key==="ArrowUp"){ e.preventDefault(); dropdownIdx=Math.max(dropdownIdx-1,0); nlsHighlightItem(items); }
  else if(e.key==="Enter"&&dropdownIdx>=0){ e.preventDefault(); items[dropdownIdx].click(); }
  else if(e.key==="Escape"){ list.classList.remove("show"); }
}

function nlsHighlightItem(items){
  items.forEach((el,i)=>{ el.classList.toggle("active",i===dropdownIdx); });
  if(dropdownIdx>=0) items[dropdownIdx].scrollIntoView({block:"nearest"});
}

function nlsSelectDrug(id){
  const drug = NLS_DRUGS.find(d=>d.id===id);
  if(!drug) return;
  const grp = NLS_ID_TO_GROUP[id];
  if(grp){ nlsSelectGroup(grp.base); return; }
  document.getElementById("nlsDrugSearch").value = drug.name;
  document.getElementById("nlsDropdownList").classList.remove("show");
  nlsShowDrugResult(drug);
}

function nlsSelectGroup(base){
  const grp = NLS_DRUG_GROUPS.find(g=>g.base===base);
  if(!grp) return;
  document.getElementById("nlsDrugSearch").value = base;
  document.getElementById("nlsDropdownList").classList.remove("show");
  nlsShowGroupResult(grp);
}

document.addEventListener("click", e=>{
  if(!e.target.closest(".search-wrap")) document.getElementById("nlsDropdownList").classList.remove("show");
});

/* ════════════════════════════════════════════════════════
   DRUG RESULT + DOSE MATCHING
   ════════════════════════════════════════════════════════ */
function nlsRenderScrSelector(drug){
  if(!nlsPatientData) return '';
  const hasGa = drug.dosingRows.some(r=>r.gaRequired);
  const hasScr = drug.dosingRows.some(r=>r.scrRequired);

  if(hasGa){
    // Aminoglycoside GA+PNA selector
    const pnaDays = Math.round(nlsPatientData.ageDays);
    return `<div class="notes-box" style="background:#e8f4f0;border-color:#27ae60;margin-bottom:10px">
      <strong>🧪 Aminoglycoside – Chọn Tuổi Thai (GA) để highlight liều phù hợp:</strong>
      <div style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div>
          <label style="font-size:12px;font-weight:700">Tuổi thai (GA):</label><br>
          <select id="nls_amino_ga" onchange="nlsUpdateAminoHighlight('${drug.id}')" style="padding:4px 8px;border:1px solid #27ae60;border-radius:4px;margin-top:2px">
            <option value="">-- Chọn GA --</option>
            <option value="lt30">&lt;30 tuần</option>
            <option value="30-34">30–34 tuần</option>
            <option value="ge35">≥35 tuần</option>
          </select>
        </div>
        <div style="font-size:13px;color:#555;padding-top:14px">
          PNA bệnh nhân: <strong>${pnaDays} ngày</strong>
        </div>
        <button onclick="nlsUpdateAminoHighlight('${drug.id}')" style="margin-top:14px;padding:5px 14px;background:#27ae60;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px">
          ✔ Áp dụng
        </button>
      </div>
    </div>`;
  }

  // Vancomycin SCr selector
  return `<div class="notes-box" style="background:#f0e8ff;border-color:#9b59b6;margin-bottom:10px">
    <strong>🧪 Vancomycin – Chọn GA và SCr để highlight liều phù hợp:</strong>
    <div style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <div>
        <label style="font-size:12px;font-weight:700">Tuổi thai (GA):</label><br>
        <select id="nls_vanco_ga" onchange="nlsUpdateVancoHighlight('${drug.id}')" style="padding:4px 8px;border:1px solid #9b59b6;border-radius:4px;margin-top:2px">
          <option value="">-- Chọn GA --</option>
          <option value="le28">≤28 tuần</option>
          <option value="gt28">&gt;28 tuần</option>
        </select>
      </div>
      <div>
        <label style="font-size:12px;font-weight:700">SCr (mg/dL):</label><br>
        <input type="number" id="nls_vanco_scr" step="0.1" min="0" max="5" placeholder="VD: 0.6"
          onchange="nlsUpdateVancoHighlight('${drug.id}')"
          style="padding:4px 8px;border:1px solid #9b59b6;border-radius:4px;width:90px;margin-top:2px"/>
      </div>
      <button onclick="nlsUpdateVancoHighlight('${drug.id}')" style="margin-top:14px;padding:5px 14px;background:#9b59b6;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px">
        ✔ Áp dụng
      </button>
    </div>
  </div>`;
}

function nlsUpdateAminoHighlight(drugId){
  const drug = NLS_DRUGS.find(d=>d.id===drugId);
  if(!drug||!nlsPatientData) return;
  const ga = document.getElementById('nls_amino_ga') ? document.getElementById('nls_amino_ga').value : '';
  const pnaDays = nlsPatientData.ageDays;

  const tbody = document.querySelector('#nlsDrugResult .dose-table tbody');
  if(!tbody) return;
  // Scope to rows tagged for THIS drug only — a plain sequential tr index breaks
  // in the grouped (Sơ sinh + Nhi khoa) table because subheader rows shift the offset.
  const taggedRows = tbody.querySelectorAll(`tr[data-drug-id="${drugId}"]`);
  const rows = taggedRows.length ? taggedRows : tbody.querySelectorAll('tr');
  rows.forEach((tr)=>{
    const idx = tr.hasAttribute('data-row-index') ? parseInt(tr.dataset.rowIndex,10) : Array.prototype.indexOf.call(rows,tr);
    const row = drug.dosingRows[idx];
    if(!row||!row.gaRequired){ tr.className=''; return; }
    if(!ga){ tr.className=''; return; }
    // Check GA group
    if(row.gaGroup !== ga){ tr.className=''; return; }
    // Check PNA range from ageDays
    const [lo,hi] = row.ageDays;
    const isMatch = pnaDays >= lo && pnaDays <= hi;
    tr.className = isMatch ? 'dose-row-match' : '';
    const firstTd = tr.querySelector('td');
    if(firstTd){
      firstTd.innerHTML = firstTd.innerHTML.replace(/<span class="match-badge">[^<]*<\/span>/g,'');
      if(isMatch) firstTd.innerHTML += '<span class="match-badge">\u2714 Ph\u00f9 h\u1ee3p</span>';
    }
    // Liều tương đương (≈ mg) theo cân nặng bệnh nhân — cột "Liều dùng" là ô thứ 3
    const doseTd = tr.children[2];
    if(doseTd){
      doseTd.innerHTML = doseTd.innerHTML.replace(/<br><span class="calc-dose-result">[^<]*<\/span>/g,'');
      if(isMatch){
        const calcedDose = nlsCalcDoseForRow(row);
        if(calcedDose) doseTd.innerHTML += `<br><span class="calc-dose-result">\u2248 ${calcedDose}</span>`;
      }
    }
  });
}

function nlsUpdateVancoHighlight(drugId){
  const drug = NLS_DRUGS.find(d=>d.id===drugId);
  if(!drug||!nlsPatientData) return;
  const ga = document.getElementById('nls_vanco_ga') ? document.getElementById('nls_vanco_ga').value : '';
  const scrEl = document.getElementById('nls_vanco_scr');
  const scr = scrEl ? parseFloat(scrEl.value) : NaN;

  // Re-render table rows with SCr-based highlighting
  const tbody = document.querySelector('#nlsDrugResult .dose-table tbody');
  if(!tbody) return;
  // Scope to rows tagged for THIS drug only — a plain sequential tr index breaks
  // in the grouped (Sơ sinh + Nhi khoa) table because subheader rows shift the offset.
  const taggedRows = tbody.querySelectorAll(`tr[data-drug-id="${drugId}"]`);
  const rows = taggedRows.length ? taggedRows : tbody.querySelectorAll('tr');
  rows.forEach((tr)=>{
    const idx = tr.hasAttribute('data-row-index') ? parseInt(tr.dataset.rowIndex,10) : Array.prototype.indexOf.call(rows,tr);
    const row = drug.dosingRows[idx];
    if(!row) return;
    let isMatch = false;
    if(row.scrRequired && ga && !isNaN(scr)){
      // Check GA group
      if(row.gaGroup !== ga) { tr.className=''; return; }
      // Check SCr range from label
      const label = row.label;
      if(label.includes('<0.5') && scr<0.5) isMatch=true;
      else if(label.includes('0.5–0.7') && scr>=0.5 && scr<=0.7) isMatch=true;
      else if(label.includes('0.8–1.0') && scr>=0.8 && scr<=1.0) isMatch=true;
      else if(label.includes('1.1–1.4') && scr>=1.1 && scr<=1.4) isMatch=true;
      else if(label.includes('>1.4') && scr>1.4) isMatch=true;
      else if(label.includes('<0.7') && scr<0.7) isMatch=true;
      else if(label.includes('0.7–0.9') && scr>=0.7 && scr<=0.9) isMatch=true;
      else if(label.includes('1.0–1.2') && scr>=1.0 && scr<=1.2) isMatch=true;
      else if(label.includes('1.3–1.6') && scr>=1.3 && scr<=1.6) isMatch=true;
      else if(label.includes('>1.6') && scr>1.6) isMatch=true;
    }
    tr.className = isMatch ? 'dose-row-match' : '';
    // Add/remove match badge
    const firstTd = tr.querySelector('td');
    if(firstTd){
      firstTd.innerHTML = firstTd.innerHTML.replace(/<span class="match-badge">.*?<\/span>/g,'');
      if(isMatch) firstTd.innerHTML += '<span class="match-badge">✔ Phù hợp</span>';
    }
    // Liều tương đương (≈ mg) theo cân nặng bệnh nhân — cột "Liều dùng" là ô thứ 3
    const doseTd = tr.children[2];
    if(doseTd){
      doseTd.innerHTML = doseTd.innerHTML.replace(/<br><span class="calc-dose-result">[^<]*<\/span>/g,'');
      if(isMatch){
        const calcedDose = nlsCalcDoseForRow(row);
        if(calcedDose) doseTd.innerHTML += `<br><span class="calc-dose-result">≈ ${calcedDose}</span>`;
      }
    }
  });
}

function nlsShowDrugResult(drug){
  const el = document.getElementById("nlsDrugResult");
  el.innerHTML = nlsRenderDrugResult(drug);
  el.classList.add("show");
}

function nlsShowGroupResult(grp){
  const el = document.getElementById("nlsDrugResult");
  el.innerHTML = nlsRenderGroupResult(grp);
  el.classList.add("show");
}

/* Chuyển chuỗi "ý 1; ý 2; ý 3" thành danh sách gạch đầu dòng <ul><li> */
function nlsToBulletList(str){
  if(!str) return "";
  const items = str.split(/;\s*/).map(s=>s.trim()).filter(Boolean);
  if(items.length <= 1) return str;
  return `<ul class="bullet-list">${items.map(it=>`<li>${it}</li>`).join("")}</ul>`;
}

/* Bộ từ dừng (stopword) tiếng Việt y khoa — loại khỏi so sánh vì quá phổ biến, không có giá trị phân biệt */
const DEDUP_STOPWORDS = new Set([
  "nhiễm","khuẩn","do","ở","và","hoặc","khi","cho","với","nhạy","cảm",
  "sơ","sinh","nặng","nhẹ","các","của","là",
  "có","không","này","đó","theo","như","để","còn","đã","sẽ","được",
  "trẻ","em","người","lớn","một","hai","ba","nên","cần","tác","dụng"
]);

/* Tách chuỗi thành tập từ khóa có ý nghĩa (loại bỏ HTML, dấu câu, stopword) */
function nlsExtractKeywords(str){
  return str.toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[.,;:()⚠️⛔\-–—\/%>]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && !DEDUP_STOPWORDS.has(w));
}

/* Độ tương đồng (overlap coefficient) giữa 2 câu — nhạy với trường hợp 1 câu là bản diễn giải dài hơn của câu kia.
   Dùng intersection/min(|A|,|B|) thay vì Jaccard (intersection/union) để không bị pha loãng khi 2 câu lệch độ dài. */
function nlsSimilarityScore(a, b){
  const wa = new Set(nlsExtractKeywords(a));
  const wb = new Set(nlsExtractKeywords(b));
  if(wa.size===0 || wb.size===0) return 0;
  let inter = 0;
  wa.forEach(w => { if(wb.has(w)) inter++; });
  return inter / Math.min(wa.size, wb.size);
}

/* Lọc danh sách câu, loại bỏ câu trùng Ý (similarity ≥ ngưỡng) với câu đã giữ trước đó — ưu tiên giữ câu xuất hiện trước */
const SIMILARITY_THRESHOLD = 0.45;
function nlsDedupBySimilarity(items){
  const kept = [];
  items.forEach(item => {
    const isDup = kept.some(k => nlsSimilarityScore(item, k) >= SIMILARITY_THRESHOLD);
    if(!isDup) kept.push(item);
  });
  return kept;
}

function nlsCleanNote(note){
  if(!note) return "";
  // Remove "Nguồn: ..." from anywhere – greedy to end of string or newline
  // Also handles "Nguồn:" at sentence end or mid-note
  return note
    .replace(/\s*\.?\s*Nguồn\s*:[^\n]*/gi, "")
    .replace(/\s*\.?\s*Ngu\u1ed3n\s*:[^\n]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*\|\s*$/, "")
    .replace(/^\s*\|\s*/, "")
    .trim();
}

function nlsRenderGroupResult(grp){
  const drugs   = grp.ids.map(id=>NLS_DRUGS.find(d=>d.id===id)).filter(Boolean);
  const sources = [...new Set(drugs.map(d=>d.source))];
  const hasBoth = sources.includes("ch2") && sources.includes("ch18");
  const neoDrugs = drugs.filter(d=>d.source==="ch2");
  const pedDrugs = drugs.filter(d=>d.source==="ch18");

  /* ── Chỉ định GỘP (khử trùng + GIỚI HẠN TỐI ĐA 5 Ý, ưu tiên cân bằng các nguồn) ── */
  const indPerDrug = drugs.map(d=>(d.indications||"").split(/;\s*/).map(s=>s.trim()).filter(Boolean));
  // Xen kẽ (interleave) các ý từ mỗi thuốc để đảm bảo công bằng giữa sơ sinh/nhi khoa
  const rawIndInterleaved = [];
  const maxLen = Math.max(0, ...indPerDrug.map(arr=>arr.length));
  for(let i=0;i<maxLen;i++){
    indPerDrug.forEach(arr => { if(arr[i]) rawIndInterleaved.push(arr[i]); });
  }
  // Bước 1: loại exact duplicate (không phân biệt hoa/thường)
  const exactDedup = [...new Map(rawIndInterleaved.map(s=>[s.toLowerCase(), s])).values()];
  // Bước 2: loại ý TRÙNG Ý dù khác câu chữ (vd "Nhiễm Pseudomonas" vs "Nhiễm khuẩn nặng do Pseudomonas... ở sơ sinh")
  const smartDedup = nlsDedupBySimilarity(exactDedup);
  const combinedInd = smartDedup.slice(0, 5).join("; ");

  /* ── Ghi chú lâm sàng GỘP (1 đoạn, GIỚI HẠN TỐI ĐA 5 Ý, ưu tiên ý có nhấn mạnh ⚠️/⛔/<strong>) ── */
  const notesPerDrug = drugs.map(d=>nlsCleanNote(d.generalNotes||"").split(/;\s*/).map(s=>s.trim()).filter(Boolean));
  const rawNotesInterleaved = [];
  const maxLenN = Math.max(0, ...notesPerDrug.map(arr=>arr.length));
  for(let i=0;i<maxLenN;i++){
    notesPerDrug.forEach(arr => { if(arr[i]) rawNotesInterleaved.push(arr[i]); });
  }
  const seenNotes = new Set();
  const exactDedupNotes = rawNotesInterleaved.filter(n=>{
    const key = n.trim().slice(0,60).toLowerCase();
    if(seenNotes.has(key)) return false;
    seenNotes.add(key); return true;
  });
  // Loại ý TRÙNG Ý dù khác câu chữ (vd 2 câu khác nhau nhưng cùng nói về "truyền kéo dài khi MIC cao")
  const dedupedNotes = nlsDedupBySimilarity(exactDedupNotes);
  // Ưu tiên các ý có cảnh báo (⚠️/⛔/<strong>) lên đầu, giữ thứ tự tương đối trong từng nhóm
  const priorityNotes  = dedupedNotes.filter(n => n.includes("⚠️") || n.includes("⛔") || n.includes("<strong>"));
  const otherNotes     = dedupedNotes.filter(n => !(n.includes("⚠️") || n.includes("⛔") || n.includes("<strong>")));
  const mergedNotes = [...priorityNotes, ...otherNotes].slice(0, 5).join("; ").trim();

  /* ── Liều tối đa gộp ── */
  const allMaxDose = [...new Set(drugs.map(d=>d.maxDose).filter(Boolean))];

  /* ── Header meta ── */
  const mainClass = drugs[0]?.class || "";
  const tradeName = [...new Set(drugs.map(d=>d.tradeName).filter(Boolean))].join(" / ");

  /* ── Màu theo nhóm bệnh nhân ── */
  const pedThemeColor = nlsPatientData
    ? (nlsPatientData.bandClass==="child"  ? "var(--child-color)"
     : nlsPatientData.bandClass==="infant" ? "var(--infant-color)"
     : "var(--primary)")
    : "var(--primary)";

  /* ── Badge nguồn ── */
  const srcBadge = hasBoth
    ? `<span style="background:#9b59b6;color:#fff;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;margin-left:6px;vertical-align:middle">Sơ sinh + Nhi khoa</span>`
    : sources[0]==="ch2"
      ? `<span style="background:var(--neonate-color);color:#fff;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;margin-left:6px;vertical-align:middle">Sơ sinh</span>`
      : `<span style="background:${pedThemeColor};color:#fff;border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700;margin-left:6px;vertical-align:middle">Nhi khoa</span>`;

  /* ── Thông tin bệnh nhân ── */
  const patNote = nlsPatientData
    ? `<div class="notes-box" style="margin-bottom:10px">
        <strong>🔍 Bệnh nhân:</strong> ${nlsPatientData.ageLabel} · <strong>${nlsPatientData.weight} kg</strong> · ${nlsPatientData.ageDays.toFixed(0)} ngày tuổi —
        Hàng <span style="background:#fff8e6;border-left:3px solid var(--match-color);padding:1px 6px;border-radius:3px">nền vàng <strong>✔ Phù hợp</strong></span> là liều áp dụng.
      </div>`
    : `<div class="notes-box" style="margin-bottom:10px;background:#fff8e1;border-color:#f39c12">
        ⚠️ Nhập thông tin bệnh nhân ở <strong>Phần A</strong> để highlight liều phù hợp.
      </div>`;

  /* ── Build rows for one drug entry ── */
  function buildRows(drug){
    let html = "";
    drug.dosingRows.forEach((row, rowIdx)=>{
      const isMatch    = nlsRowMatchesPatient(row);
      const calcedDose = isMatch ? nlsCalcDoseForRow(row) : null;
      const matchBadge = isMatch ? `<span class="match-badge">✔ Phù hợp</span>` : "";
      const isM2Dose   = isMatch && !calcedDose && row.dose && row.dose.includes("/m");
      const calcCell   = isMatch && calcedDose
        ? `<br><span class="calc-dose-result">≈ ${calcedDose}</span>`
        : isM2Dose
        ? `<br><span style="font-size:11px;color:#b7770d;background:#fff8e1;border:1px solid #f39c12;border-radius:4px;padding:1px 6px">Tính theo diện tích bề mặt cơ thể (BSA, mg/m²)</span>`
        : "";
      // Sub-tag cho MSSA / Enterobacterales / IV / PO…
      const subTag = drug.name
        .replace(grp.base,"")
        .replace(/\(S[ơo]\s*sinh\)/i,"").replace(/\(Nhi[^)]*\)/i,"")
        .replace(/^[\s–\-]+/,"").trim();
      const subBadge = subTag
        ? `<span style="font-size:11px;background:#e8f4f8;color:#124f68;border-radius:3px;padding:1px 5px;margin-left:4px;white-space:nowrap">${subTag}</span>`
        : "";
      const dotCls = row.ageGroup==="neonate" ? "neonate" : row.ageGroup==="infant" ? "infant" : "child";
      html += `<tr class="${isMatch?"dose-row-match":""}" data-drug-id="${drug.id}" data-row-index="${rowIdx}">
        <td><div class="age-cell"><div class="age-dot ${dotCls}"></div><span>${row.label||""}</span>${subBadge}${matchBadge}</div></td>
        <td>${row.route||""}</td>
        <td><strong>${row.dose||""}</strong>${calcCell}</td>
        <td>${row.interval||""}</td>
        <td style="font-size:13px;color:#555">${row.notes||"—"}</td>
      </tr>`;
    });
    return html;
  }

  /* ── Subheader separator row ── */
  function subheaderRow(label, color, icon){
    return `<tr>
      <td colspan="5" style="background:${color};color:#fff;font-weight:700;font-size:13px;padding:7px 12px;letter-spacing:.3px">
        ${icon} ${label}
      </td>
    </tr>`;
  }

  /* ── Assemble all rows into ONE table ── */
  let tableBody = "";
  let selectorWidgets = "";

  if(neoDrugs.length){
    tableBody += subheaderRow("🍼 Sơ sinh","var(--neonate-color)","");
    neoDrugs.forEach(d=>{
      if(d.dosingRows.some(r=>r.scrRequired||r.gaRequired))
        selectorWidgets += nlsRenderScrSelector(d);
      tableBody += buildRows(d);
    });
  }
  if(pedDrugs.length){
    // Màu Nhi khoa = màu băng bệnh nhân khi có; fallback --primary
    const pedColor = nlsPatientData
      ? (nlsPatientData.bandClass==="child"  ? "var(--child-color)"
       : nlsPatientData.bandClass==="infant" ? "var(--infant-color)"
       : "var(--primary)")
      : "var(--primary)";
    tableBody += subheaderRow("🧒 Nhi khoa", pedColor, "");
    pedDrugs.forEach(d=>{ tableBody += buildRows(d); });
  }

  return `
    <div class="drug-result-header">
      <h3 style="font-size:18px;font-weight:800;color:var(--primary-dark);margin-bottom:4px">
        ${grp.base}${srcBadge}
      </h3>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;align-items:center">
        <span class="drug-class-badge">💊 ${mainClass}</span>

      </div>
      ${combinedInd ? `
        <div style="margin-top:8px;background:#f0f8ff;border-left:3px solid ${pedThemeColor};border-radius:0 6px 6px 0;padding:9px 12px;font-size:14px;color:#1a4a6b">
          <strong>📋 Chỉ định:</strong> ${nlsToBulletList(combinedInd)}
        </div>` : ""}
    </div>

    ${patNote}
    ${selectorWidgets}

    <div class="dose-table-wrap">
      <table class="dose-table">
        <thead>
          <tr>
            <th style="min-width:170px">Nhóm tuổi / Phân loại</th>
            <th>Đường dùng</th>
            <th>Liều dùng</th>
            <th>Khoảng cách</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>

    ${allMaxDose.length ? `
      <div style="font-size:14px;margin-top:6px;color:#1a4a6b;padding:6px 10px;background:#f0f8ff;border-radius:6px">
        <strong style="color:var(--danger)">⚠️ Liều tối đa:</strong> <strong>${allMaxDose.join(" | ")}</strong>
      </div>` : ""}

    ${mergedNotes ? `
      <div class="notes-box" style="margin-top:8px">
        <strong>📌 Ghi chú lâm sàng:</strong>
        <div style="margin-top:4px;line-height:1.8;font-size:14px">${nlsToBulletList(mergedNotes)}</div>
      </div>` : ""}

    
  `;
}

function nlsGetAgeGroupForPatient(){
  if(!nlsPatientData) return null;
  const {ageDays, ageGroup} = nlsPatientData;
  if(ageGroup==="neonate"||ageGroup==="neonate_late") return "neonate";
  if(ageGroup==="infant") return "infant";
  return "child";
}

function nlsRowMatchesPatient(row){
  if(!nlsPatientData) return false;
  const {ageDays, weight} = nlsPatientData;
  const pAgeGroup = nlsGetAgeGroupForPatient();
  if(!pAgeGroup) return false;

  // SCr/GA-stratified rows: never auto-highlight (user must select based on labs)
  if(row.scrRequired) return false;
  if(row.gaRequired) return false;

  // Match age group
  const rowGroup = row.ageGroup || "child";
  if(rowGroup==="neonate" && pAgeGroup!=="neonate") return false;
  if(rowGroup==="infant" && pAgeGroup!=="infant") return false;
  if(rowGroup==="child" && pAgeGroup==="neonate") return false;

  // Match ageDays range [lo, hi]
  if(row.ageDays){
    if(ageDays < row.ageDays[0] || ageDays > row.ageDays[1]) return false;
  }

  // Weight range
  if(row.weightMax !== undefined && weight > row.weightMax) return false;
  if(row.weightMin !== undefined && weight < row.weightMin) return false;

  return true;
}

function nlsCalcDoseForRow(row){
  if(!nlsPatientData) return null;
  const w = nlsPatientData.weight;
  const doseStr = row.dose;

  // Skip placeholder doses
  if(!doseStr || doseStr==="\u2014" || doseStr.startsWith("\u2014") || doseStr.startsWith("-")) return null;

  // Match patterns:
  //   '60 mg/kg/ngày'  ->  plain
  //   '60 mg ceftazidime/kg/ngày'  ->  with component name
  //   '40-45 mg/kg/ngày'  ->  range
  const m = doseStr.match(/([\d.]+)\s*(?:\u2013\s*([\d.]+))?\s*mg(?:\s+([^\/]+))?\/kg/i);
  if(!m) return null;

  const lo = parseFloat(m[1]);
  const hi = m[2] ? parseFloat(m[2]) : lo;
  const comp = m[3] ? m[3].trim() : null;

  const dLo = (lo*w).toFixed(1);
  const dHi = hi!==lo ? (hi*w).toFixed(1) : null;
  const suffix = comp ? ' mg ' + comp : ' mg';

  return dHi ? dLo + '\u2013' + dHi + suffix : dLo + suffix;
}

function nlsRenderDrugResult(drug){
  const sourceLabel = drug.source==="ch2"
    ? '<span style="background:#e8f0ff;color:#2040a0;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:700">📘 Ch.2 – Neonatal</span>'
    : '<span style="background:#e8fff0;color:#1a6b3a;border-radius:4px;padding:1px 7px;font-size:10px;font-weight:700">📗 Ch.18 – Pediatric</span>';

  let tableRows = "";
  drug.dosingRows.forEach((row, rowIdx)=>{
    const isMatch = nlsRowMatchesPatient(row);
    const calcedDose = isMatch ? nlsCalcDoseForRow(row) : null;
    const matchBadge = isMatch ? `<span class="match-badge">✔ Phù hợp</span>` : "";
    const isM2Dose = isMatch && !calcedDose && row.dose && row.dose.includes("/m");
    const calcCell = isMatch && calcedDose
      ? `<br><span class="calc-dose-result">≈ ${calcedDose}</span>`
      : isM2Dose
      ? `<br><span style="font-size:11px;color:#b7770d;background:#fff8e1;border:1px solid #f39c12;border-radius:4px;padding:1px 6px">Tính theo diện tích bề mặt cơ thể (BSA, mg/m²)</span>`
      : "";

    const dotClass = row.ageGroup==="neonate" ? "neonate" : row.ageGroup==="infant" ? "infant" : "child";
    tableRows += `
      <tr class="${isMatch?"dose-row-match":""}" data-drug-id="${drug.id}" data-row-index="${rowIdx}">
        <td><div class="age-cell"><div class="age-dot ${dotClass}"></div>${row.label||""}${matchBadge}</div></td>
        <td>${row.route||""}</td>
        <td><strong>${row.dose||""}</strong>${calcCell}</td>
        <td>${row.interval||""}</td>
        <td>${row.notes||"—"}</td>
      </tr>`;
  });

  const patNote = nlsPatientData
    ? `<div class="notes-box" style="margin-bottom:10px">
        <strong>🔍 Bệnh nhân hiện tại:</strong> ${nlsPatientData.ageLabel} · ${nlsPatientData.weight} kg · ${nlsPatientData.ageDays.toFixed(0)} ngày tuổi.
        Các hàng <span style="background:#fff8e6;border-left:3px solid var(--match-color);padding:1px 5px">nền vàng</span> 
        + nhãn <strong>"✔ Phù hợp"</strong> là liều áp dụng cho bệnh nhân này.
        Liều ước tính (≈) tính theo cân nặng từ công thức mg/kg.
      </div>`
    : `<div class="notes-box" style="margin-bottom:10px;background:#fff8e1;border-color:#f39c12">⚠️ Chưa nhập thông tin bệnh nhân ở Phần A. Nhập để highlight hàng liều phù hợp.</div>`;

  return `
    <div class="drug-result-header">
      <h3>${drug.name} ${sourceLabel}</h3>
      <div>
        <span class="drug-class-badge">💊 ${drug.class}</span>
        <span class="citation-badge">${drug.citation}</span>
      </div>
      ${drug.tradeName ? `<div style="margin-top:4px;font-size:13px;color:var(--text-light)">Tên thương mại: <em>${drug.tradeName}</em></div>` : ""}
      ${drug.indications ? `<div class="indications-box">📋 <strong>Chỉ định:</strong> ${nlsToBulletList(drug.indications)}</div>` : ""}
    </div>
    ${patNote}
    <div class="dose-table-wrap">
      <table class="dose-table">
        <thead>
          <tr>
            <th>Nhóm tuổi / Phân loại</th>
            <th>Đường dùng</th>
            <th>Liều (mg/kg/ngày hoặc mg/kg/liều)</th>
            <th>Khoảng cách</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    ${drug.maxDose ? `<div style="font-size:14px;margin-bottom:6px;padding:6px 10px;background:#f0f8ff;border-radius:6px"><strong style="color:var(--danger)">⚠️ Liều tối đa:</strong> <strong>${drug.maxDose}</strong></div>` : ""}
    ${(drug.dosingRows.some(r=>r.scrRequired)||drug.dosingRows.some(r=>r.gaRequired)) ? nlsRenderScrSelector(drug) : ''}
    ${drug.generalNotes ? `<div class="notes-box"><strong>📌 Ghi chú lâm sàng:</strong> ${nlsToBulletList(drug.generalNotes)}</div>` : ""}

  `;
}

