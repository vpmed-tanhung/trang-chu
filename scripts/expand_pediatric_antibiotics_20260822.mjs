#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const jsonPath=path.join(root,'data','stock_clinical_filter_20260814.json');
const jsPath=path.join(root,'assets','stock_clinical_data_20260814.js');
const data=JSON.parse(fs.readFileSync(jsonPath,'utf8'));

const sources={
  rchAntimicrobial:{
    title:'Royal Children’s Hospital Melbourne — Antimicrobial guidelines',
    organization:'The Royal Children’s Hospital Melbourne',
    url:'https://www.rch.org.au/clinicalguide/guideline_index/Antibiotics/',
    type:'Hướng dẫn bệnh viện',
    updated:'02/2025'
  },
  anmfAmikacin:{
    title:'ANMF Consensus Group — Amikacin: Newborn use only',
    organization:'Australasian Neonatal Medicines Formulary',
    url:'https://www.anmfonline.org/wp-content/uploads/2021/06/amikacin-18022021-2.0.pdf',
    type:'Chuyên luận thuốc Sơ sinh',
    updated:'2021'
  },
  ucsfAminoglycoside:{
    title:'UCSF — Pediatric Aminoglycoside Guideline',
    organization:'UCSF Benioff Children’s Hospitals',
    url:'https://idmp.ucsf.edu/document/aminoglycoside-guidelines-peds-ucsf-12-2025-2-pdf-pdf',
    type:'Hướng dẫn aminoglycoside Nhi khoa',
    updated:'09/2025'
  },
  fdaSuprax:{
    title:'FDA — SUPRAX (cefixime) Prescribing Information',
    organization:'U.S. Food and Drug Administration',
    url:'https://www.accessdata.fda.gov/drugsatfda_docs/nda/2013/202091Orig1s000LBL.pdf',
    type:'Nhãn thuốc chính thức',
    updated:'2013'
  },
  dailyMedCefotaxime:{
    title:'DailyMed — Cefotaxime for Injection, USP',
    organization:'U.S. National Library of Medicine / FDA',
    url:'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ed23b6bc-32c7-4c50-a53d-313ae78e5623',
    type:'Nhãn thuốc chính thức',
    updated:'Truy cập 22/08/2026'
  },
  fdaVantin:{
    title:'FDA — VANTIN (cefpodoxime proxetil) Prescribing Information',
    organization:'U.S. Food and Drug Administration',
    url:'https://www.accessdata.fda.gov/drugsatfda_docs/label/2004/50675slr013%2C016_vantin_lbl.pdf',
    type:'Nhãn thuốc chính thức',
    updated:'2004'
  },
  fdaPrimaxin:{
    title:'FDA — PRIMAXIN IV (imipenem/cilastatin) Prescribing Information',
    organization:'U.S. Food and Drug Administration',
    url:'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/050587Orig1s083lbl.pdf',
    type:'Nhãn thuốc chính thức',
    updated:'2022'
  }
};

Object.assign(data.sources,sources);

const newDrugs=[
  {
    id:'amikacin',
    name:'Amikacin',
    basis:'Tính theo amikacin',
    stockCodes:['TD30-003208'],
    childRules:[
      {id:'febrile-neutropenia-young',label:'Sốt giảm bạch cầu trung tính — <10 tuổi',doseMgKg:22.5,intervalHours:24,maxMg:1500,minAgeMonths:1,maxAgeMonths:119.999,route:'Truyền tĩnh mạch',note:'Thuốc hạn chế; dùng theo phác đồ sốt giảm bạch cầu trung tính của đơn vị. Mục tiêu nồng độ đáy <2 mg/L trước liều thứ 3 theo RCH.'},
      {id:'febrile-neutropenia-older',label:'Sốt giảm bạch cầu trung tính — ≥10 tuổi',doseMgKg:18,intervalHours:24,maxMg:1500,minAgeMonths:120,route:'Truyền tĩnh mạch',note:'Thuốc hạn chế; dùng theo phác đồ sốt giảm bạch cầu trung tính của đơn vị. Mục tiêu nồng độ đáy <2 mg/L trước liều thứ 3 theo RCH.'},
      {id:'cystic-fibrosis',label:'Xơ nang',doseMgKg:30,intervalHours:24,minAgeMonths:1,route:'Truyền tĩnh mạch',note:'Bệnh cảnh chuyên biệt; xem lại các đợt aminoglycoside trước và dùng TDM/Bayesian theo quy trình.'},
      {id:'ntm',label:'Nhiễm Mycobacteria không lao (NTM)',doseMgKg:20,intervalHours:24,minAgeMonths:1,route:'Truyền tĩnh mạch',note:'Bệnh cảnh chuyên biệt; hội chẩn chuyên khoa và dùng TDM/Bayesian theo quy trình.'}
    ],
    neonatalRules:[
      {maxPmaWeeks:29,maxPnaDays:7,doseMgKg:14,intervalHours:48,route:'Truyền tĩnh mạch'},
      {maxPmaWeeks:29,minPnaDays:8,maxPnaDays:28,doseMgKg:12,intervalHours:36,route:'Truyền tĩnh mạch'},
      {maxPmaWeeks:29,minPnaDays:29,doseMgKg:12,intervalHours:24,route:'Truyền tĩnh mạch'},
      {minPmaWeeks:30,maxPmaWeeks:34,maxPnaDays:7,doseMgKg:12,intervalHours:36,route:'Truyền tĩnh mạch'},
      {minPmaWeeks:30,maxPmaWeeks:34,minPnaDays:8,doseMgKg:12,intervalHours:24,route:'Truyền tĩnh mạch'},
      {minPmaWeeks:35,maxPmaWeeks:44,doseMgKg:12,intervalHours:24,route:'Truyền tĩnh mạch'}
    ],
    neonatalNote:'Không kê đồng thời amikacin với gentamicin. Nếu hạ thân nhiệt điều trị hoặc dùng indomethacin/ibuprofen, nguồn ANMF yêu cầu kéo dài khoảng cách thêm 12 giờ. TDM sớm nếu tiếp tục điều trị và đánh giá chức năng thận.',
    contraindicationNote:'Amikacin là thuốc hạn chế; bắt buộc đánh giá chức năng thận, nguy cơ độc tai/độc thận và kế hoạch TDM. Không dùng đồng thời với gentamicin.',
    stock:[{code:'TD30-003208',name:'JW Amikacin',active:'Amikacin',route:'Tiêm truyền tĩnh mạch',strength:'500mg/100ml',packs:[],expiries:['04/11/2027','20/01/2028']}],
    sources:[sources.rchAntimicrobial,sources.ucsfAminoglycoside,sources.anmfAmikacin]
  },
  {
    id:'cefixime',
    name:'Cefixime',
    basis:'Tính theo cefixime',
    stockCodes:['TD29-000023'],
    childRules:[
      {id:'once-daily',label:'≥6 tháng — một lần/ngày',doseMgKg:8,intervalHours:24,maxMg:400,minAgeMonths:6,route:'Uống',note:'Kho hiện có viên 200 mg, không có hỗn dịch/viên nhai. Với viêm tai giữa, nhãn SUPRAX yêu cầu dùng hỗn dịch hoặc viên nhai; không tự thay bằng viên nén cùng liều.'},
      {id:'twice-daily',label:'≥6 tháng — chia 2 lần/ngày',doseMgKg:4,intervalHours:12,maxMg:200,minAgeMonths:6,route:'Uống',note:'Kho hiện có viên 200 mg, không có hỗn dịch/viên nhai. Kiểm tra khả năng dùng đúng dạng bào chế trước khi kê.'}
    ],
    neonatalRules:[],
    contraindicationNote:'Chưa thiết lập liều cho trẻ dưới 6 tháng. Kho chỉ có viên 200 mg; cần kiểm tra dạng bào chế phù hợp với tuổi và khả năng dùng thuốc.',
    stock:[{code:'TD29-000023',name:'Cefixime STADA 200mg',active:'Cefixim',route:'Uống',strength:'200mg',packs:['Hộp 01 vỉ x 10 viên'],expiries:['07/05/2028']}],
    sources:[sources.fdaSuprax]
  },
  {
    id:'cefotaxime',
    name:'Cefotaxime',
    basis:'Tính theo cefotaxime',
    stockCodes:['TD29-000014'],
    childRules:[
      {id:'standard',label:'Nhi khoa — nhiễm khuẩn vừa đến nặng',doseMgKg:50,intervalHours:8,maxMg:2000,minAgeMonths:1,route:'Tiêm tĩnh mạch',note:'Tương đương 150 mg/kg/ngày; thuộc khoảng 50–180 mg/kg/ngày của nhãn cefotaxime.'},
      {id:'meningitis',label:'Nhiễm khuẩn nặng/viêm màng não',doseMgKg:50,intervalHours:6,maxMg:2000,minAgeMonths:1,route:'Tiêm tĩnh mạch',note:'Chỉ dùng mức q6h khi bệnh cảnh nặng/hệ thần kinh trung ương phù hợp; hội chẩn chuyên khoa.'}
    ],
    neonatalRules:[
      {maxPmaWeeks:44,maxPnaDays:7,doseMgKg:50,intervalHours:12,route:'Tiêm tĩnh mạch'},
      {maxPmaWeeks:44,minPnaDays:8,maxPnaDays:28,doseMgKg:50,intervalHours:8,route:'Tiêm tĩnh mạch'}
    ],
    neonatalNote:'Nhãn cefotaxime: 0–1 tuần q12h; 1–4 tuần q8h. RCH cho phép q6–8h ở tuần 2–4 tùy bệnh cảnh; mô-đun mặc định q8h và không tự suy ra viêm màng não.',
    stock:[{code:'TD29-000014',name:'Tenamyd-Cefotaxime 1000',active:'Cefotaxim',route:'Tiêm',strength:'1000mg',packs:['Hộp 10 lọ'],expiries:['26/05/2028']}],
    sources:[sources.dailyMedCefotaxime,sources.rchAntimicrobial]
  },
  {
    id:'cefpodoxime',
    name:'Cefpodoxime',
    basis:'Tính theo cefpodoxime',
    stockCodes:['TD30-003873'],
    childRules:[
      {id:'aom-sinusitis',label:'Viêm tai giữa cấp/viêm xoang cấp',doseMgKg:5,intervalHours:12,maxMg:200,minAgeMonths:2,maxAgeMonths:143.999,route:'Uống',note:'Liều theo nhãn cho trẻ 2 tháng đến 12 tuổi; tối đa 400 mg/ngày.'},
      {id:'pharyngitis-tonsillitis',label:'Viêm họng/viêm amidan',doseMgKg:5,intervalHours:12,maxMg:100,minAgeMonths:2,maxAgeMonths:143.999,route:'Uống',note:'Liều theo nhãn cho trẻ 2 tháng đến 12 tuổi; tối đa 200 mg/ngày.'}
    ],
    neonatalRules:[],
    contraindicationNote:'Chưa thiết lập liều cho trẻ dưới 2 tháng. Từ 12 tuổi dùng chế độ liều người lớn theo bệnh cảnh; mô-đun Nhi không tự quy đổi theo cân nặng.',
    stock:[{code:'TD30-003873',name:'Cebest',active:'Cefpodoxim',route:'Uống',strength:'100mg',packs:['Hộp 20 gói x 3g'],expiries:['26/08/2027','15/06/2028']}],
    sources:[sources.fdaVantin]
  },
  {
    id:'imipenem-cilastatin',
    name:'Imipenem/cilastatin',
    basis:'Tính theo thành phần imipenem',
    stockCodes:['CEPE001'],
    childRules:[
      {id:'standard',label:'≥3 tháng — nhiễm khuẩn ngoài CNS, mức 15 mg/kg',doseMgKg:15,intervalHours:6,maxMg:1000,minAgeMonths:3,route:'Truyền tĩnh mạch',note:'Mức dưới của khoảng 15–25 mg/kg/lần theo nhãn; tổng liều không vượt 4 g/ngày.'},
      {id:'severe',label:'≥3 tháng — nhiễm khuẩn ngoài CNS, mức 25 mg/kg',doseMgKg:25,intervalHours:6,maxMg:1000,minAgeMonths:3,route:'Truyền tĩnh mạch',note:'Chỉ dùng mức trên khi bệnh cảnh/độ nhạy phù hợp; tổng liều không vượt 4 g/ngày.'}
    ],
    neonatalRules:[],
    contraindicationNote:'Không dùng cho viêm màng não và không khuyến cáo ở bệnh nhi nhiễm khuẩn CNS do nguy cơ co giật. Không khuyến cáo ở trẻ <30 kg có suy thận vì thiếu dữ liệu hiệu chỉnh liều. Mô-đun chỉ hiển thị từ 3 tháng tuổi.',
    stock:[{code:'CEPE001',name:'Cepemid 1,5g',active:'Imipenem + cilastatin',route:'Tiêm',strength:'1,5g',packs:['Hộp 1 lọ'],expiries:['11/01/2029']}],
    sources:[sources.fdaPrimaxin]
  }
];

const incoming=new Set(newDrugs.map((drug)=>drug.id));
data.pediatric=data.pediatric.filter((drug)=>!incoming.has(drug.id)).concat(newDrugs);
data.meta.generatedAt='2026-08-22';
data.meta.counts.pediatricActives=data.pediatric.length;
data.meta.counts.pediatricStockProducts=data.pediatric.reduce((sum,drug)=>sum+drug.stock.length,0);
data.meta.sourcePolicy='Chỉ hiển thị liều Nhi có nguồn tính liều trực tiếp và đối chiếu đúng thuốc trong danh mục kho. Chi tiết pha/bảo quản chỉ hiển thị khi có nguồn đúng chế phẩm đã kiểm chứng.';

if(data.meta.counts.pediatricActives!==16||data.meta.counts.pediatricStockProducts!==26){
  throw new Error(`Sai số lượng sau mở rộng: ${data.meta.counts.pediatricActives} hoạt chất/${data.meta.counts.pediatricStockProducts} thuốc kho`);
}

fs.writeFileSync(jsonPath,JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(jsPath,`window.VPMED_STOCK_CLINICAL = ${JSON.stringify(data)};\n`);
console.log('Đã mở rộng dữ liệu Nhi: 16 hoạt chất / 26 thuốc kho.');
