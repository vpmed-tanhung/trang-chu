(function(){
  'use strict';

  const drugs=window.VPMED_DRUGS=window.VPMED_DRUGS||[];
  const renalRules=window.VPMED_RENAL_RULES||{};
  const source=(title,url)=>({title,url,note:'Nguồn trực tiếp dùng để đối chiếu liều, hiệu chỉnh chức năng thận và giới hạn liều.'});
  const rule=(label,min,max,text,sourceText)=>({label,min,max,text,source:sourceText});

  const newDrugs=[
    {
      id:35,brand:'Daphazyl',active:'Spiramycin + metronidazol',strength:'0,75 MIU + 125 mg',route:'Uống',group:'Macrolid + nitroimidazol',
      mechanism:'Spiramycin ức chế tổng hợp protein tại tiểu đơn vị 50S; metronidazol tạo các chất chuyển hóa gây tổn thương DNA của vi khuẩn kỵ khí.',
      indications:['Nhiễm khuẩn răng miệng do vi khuẩn nhạy cảm khi phối hợp spiramycin–metronidazol là lựa chọn phù hợp.'],
      pkpd:'Hiệu quả phụ thuộc mức phơi nhiễm của từng thành phần; không quy đổi MIU spiramycin sang mg metronidazol.',
      standard:'Người lớn: 4–6 viên/ngày, chia 2–3 lần, dùng trong bữa ăn.',
      renal:['Mọi mức CrCl: thường không cần hiệu chỉnh liều chỉ theo chức năng thận; theo dõi ADR khi suy thận nặng hoặc điều trị kéo dài.'],
      hd:'Thường không cần liều bổ sung sau HD; đánh giá từng thành phần và tình trạng lâm sàng.',
      crrt:'Dữ liệu hạn chế; không tự động tăng liều, theo dõi đáp ứng và độc tính.',
      infusion:'Đường uống; dùng trong bữa ăn.',
      contra:'Quá mẫn với spiramycin, macrolid, metronidazol hoặc dẫn chất imidazol; đối chiếu chống chỉ định đầy đủ trên tờ HDSD của chế phẩm.',
      adr:'Rối loạn tiêu hóa, vị kim loại, phát ban; hiếm gặp bệnh lý thần kinh ngoại biên, giảm bạch cầu hoặc phản ứng da nặng.',
      tdm:'Không thường quy; theo dõi thần kinh và huyết học nếu điều trị kéo dài.',
      notes:'Không uống rượu trong khi dùng metronidazol và ít nhất 48 giờ sau liều cuối.'
    },
    {
      id:36,brand:'Oflovid mỡ 3,5 g',active:'Ofloxacin',strength:'Theo quy cách/nhãn sản phẩm',route:'Tra mắt',group:'Fluoroquinolon dùng tại mắt',
      mechanism:'Ức chế DNA gyrase và topoisomerase IV của vi khuẩn.',
      indications:['Nhiễm khuẩn bề mặt mắt do vi khuẩn nhạy cảm theo chẩn đoán chuyên khoa mắt.'],
      pkpd:'Dùng tại chỗ tạo nồng độ cao ở bề mặt mắt; hấp thu toàn thân thấp hơn đường uống hoặc tiêm.',
      standard:'Tra một dải thuốc mỡ khoảng 1 cm vào túi kết mạc mắt bệnh, 3 lần/ngày; thời gian thường không quá 14 ngày, theo nhãn đúng chế phẩm.',
      renal:['Mọi mức CrCl: không cần hiệu chỉnh liều thường quy đối với dạng thuốc mỡ tra mắt.'],
      hd:'Không cần liều bổ sung sau HD đối với dạng tra mắt.',
      crrt:'Không cần hiệu chỉnh chỉ do CRRT đối với dạng tra mắt.',
      infusion:'Thuốc mỡ tra mắt; không tiêm, không uống.',
      contra:'Quá mẫn với ofloxacin, quinolon hoặc tá dược của chế phẩm.',
      adr:'Kích ứng, nóng rát, ngứa, đỏ mắt, nhìn mờ thoáng qua; ngừng thuốc và đánh giá ngay nếu có phản ứng quá mẫn.',
      tdm:'Không thường quy; đánh giá đáp ứng tại mắt và dấu hiệu bội nhiễm.',
      notes:'Không để đầu tuýp chạm mắt hoặc bề mặt khác; không dùng kéo dài hơn chỉ định.'
    },
    {
      id:37,brand:'Spulit',active:'Itraconazol',strength:'100 mg',route:'Uống',group:'Kháng nấm triazol',
      mechanism:'Ức chế 14-alpha-demethylase phụ thuộc CYP450 của nấm, làm giảm tổng hợp ergosterol màng tế bào.',
      indications:['Điều trị nhiễm nấm nhạy cảm theo vị trí nhiễm, mức độ nặng và chẩn đoán vi sinh.'],
      pkpd:'Hấp thu nang phụ thuộc thức ăn và acid dạ dày; là chất ức chế CYP3A4 mạnh, có nhiều tương tác lâm sàng quan trọng.',
      standard:'Nang uống: 100–200 mg/lần, ngày 1–2 lần tùy chỉ định; uống ngay sau bữa ăn.',
      renal:['Mọi mức CrCl: thường không có bảng giảm liều cố định; sinh khả dụng có thể thay đổi, dùng thận trọng và đánh giá đáp ứng.'],
      hd:'Itraconazol không được loại đáng kể bằng HD; không cần liều bổ sung thường quy.',
      crrt:'Dữ liệu hạn chế; không tự động hiệu chỉnh chỉ theo CRRT.',
      infusion:'Đường uống; nuốt nguyên nang ngay sau bữa ăn.',
      contra:'Quá mẫn; suy tim sung huyết hoặc tiền sử suy tim khi dùng cho chỉ định không đe dọa tính mạng; chống chỉ định với nhiều cơ chất CYP3A4 theo nhãn.',
      adr:'Độc gan, phù/suy tim, hạ kali, tăng huyết áp, rối loạn tiêu hóa và tương tác thuốc nghiêm trọng.',
      tdm:'Cân nhắc nồng độ đáy trong nhiễm nấm xâm lấn, hấp thu không chắc chắn hoặc có tương tác; theo dõi chức năng gan.',
      notes:'Rà soát toàn bộ thuốc dùng kèm vì itraconazol ức chế CYP3A4 và có chống chỉ định phối hợp quan trọng.'
    },
    {
      id:38,brand:'Zolifast 1000',active:'Cefazolin',strength:'1000 mg',route:'Tiêm',group:'Cephalosporin thế hệ 1',
      mechanism:'Ức chế tổng hợp vách tế bào vi khuẩn bằng gắn protein liên kết penicillin.',
      indications:['Điều trị nhiễm khuẩn do vi khuẩn nhạy cảm và dự phòng phẫu thuật theo phác đồ được phê duyệt.'],
      pkpd:'Beta-lactam phụ thuộc thời gian; tối ưu tỷ lệ thời gian nồng độ tự do trên MIC.',
      standard:'Điều trị người lớn thường 1–2 g IV mỗi 8 giờ; nhiễm nặng có thể dùng khoảng cách ngắn hơn theo nhãn/phác đồ. Dự phòng phẫu thuật: 2 g IV trong vòng 60 phút trước rạch da, 3 g nếu cân nặng ≥120 kg.',
      renal:['CrCl >30: 1 g mỗi 8 giờ (nhiễm không biến chứng) hoặc 2 g mỗi 8 giờ (nhiễm nặng/phức tạp).','CrCl 10–29: 1 g mỗi 12 giờ hoặc 2 g mỗi 12 giờ theo mức độ nhiễm.','CrCl <10: 1 g mỗi 24 giờ; liều nạp theo chỉ định thường không giảm.'],
      hd:'IHD: 2 g IV sau mỗi buổi HD; có thể dùng lịch 2 g/2 g/3 g sau HD theo phác đồ bệnh viện.',
      crrt:'CRRT: thường 2 g IV mỗi 12 giờ; cá thể hóa theo mức lọc, MIC và mức độ nhiễm.',
      infusion:'Hoàn nguyên và tiêm/truyền tĩnh mạch theo tờ HDSD đúng chế phẩm; kiểm tra tương hợp trước khi pha chung.',
      contra:'Quá mẫn với cefazolin hoặc cephalosporin; đánh giá tiền sử phản vệ với beta-lactam.',
      adr:'Phản vệ, phát ban, tiêu chảy/C. difficile, giảm bạch cầu, tăng men gan; co giật khi tích lũy ở suy thận.',
      tdm:'Không thường quy; theo dõi chức năng thận, huyết học và đáp ứng lâm sàng.',
      notes:'Liều cuối cùng phụ thuộc vị trí nhiễm, mức độ nặng, vi sinh/MIC và phác đồ bệnh viện.'
    }
  ];
  newDrugs.forEach(d=>{if(!drugs.some(x=>Number(x.id)===d.id))drugs.push(d);});

  renalRules['benzathin benzylpenicilin']={
    standard:'Tiêm bắp sâu; liều phụ thuộc chỉ định. Giang mai sớm thường 2,4 triệu IU IM một liều; giang mai muộn/không rõ thời gian thường 2,4 triệu IU IM mỗi tuần trong 3 tuần.',
    rules:[rule('Mọi mức CrCl',0,Infinity,'Không có khuyến cáo hiệu chỉnh liều định lượng chỉ theo CrCl trên nhãn; thận trọng và theo dõi khi suy thận nặng.','Nhãn Bicillin L-A (FDA).')],
    hd:'Không có khuyến cáo liều bổ sung thường quy sau HD trên nhãn; quyết định theo chỉ định.',crrt:'Không có bảng liều CRRT riêng; không dùng chế phẩm tác dụng kéo dài cho nhiễm khuẩn nặng cần nồng độ nhanh.',verified:'Nhãn FDA trực tiếp; bắt buộc tiêm bắp, không tiêm tĩnh mạch.'
  };
  renalRules['spiramycin metronidazol']={
    standard:'4–6 viên/ngày, chia 2–3 lần trong bữa ăn; tương ứng spiramycin 3–4,5 triệu IU và metronidazol 500–750 mg mỗi 24 giờ.',
    rules:[rule('Mọi mức CrCl',0,Infinity,'Thường không cần hiệu chỉnh liều chỉ theo thận; theo dõi độc tính metronidazol khi suy thận rất nặng hoặc điều trị kéo dài.','Thông tin sản phẩm spiramycin và nhãn metronidazol.')],
    hd:'Thường không cần liều bổ sung cố định; cân nhắc thời điểm dùng metronidazol so với HD.',crrt:'Dữ liệu phối hợp hạn chế; theo dõi đáp ứng và độc tính.',verified:'Nguồn trực tiếp của từng hoạt chất; đối chiếu HDSD Daphazyl.'
  };
  renalRules['ofloxacin']={
    standard:'Thuốc mỡ tra mắt: tra dải khoảng 1 cm vào túi kết mạc mắt bệnh 3 lần/ngày; liệu trình thường không quá 14 ngày theo nhãn chế phẩm.',
    rules:[rule('Mọi mức CrCl',0,Infinity,'Không cần hiệu chỉnh liều thường quy đối với dạng thuốc mỡ tra mắt.','Nhãn ofloxacin dùng tại mắt (DailyMed).')],
    hd:'Không cần liều bổ sung sau HD đối với dạng tra mắt.',crrt:'Không cần hiệu chỉnh chỉ do CRRT đối với dạng tra mắt.',verified:'Nhãn dùng tại mắt trực tiếp; xác nhận nồng độ trên bao bì/HDSD Oflovid.'
  };
  renalRules['itraconazol']={
    standard:'Nang uống: 100–200 mg/lần, ngày 1–2 lần tùy chỉ định; uống ngay sau bữa ăn. Tải 200 mg mỗi 8 giờ trong 3 ngày chỉ áp dụng cho một số chỉ định theo nhãn/chuyên khoa.',
    rules:[rule('Mọi mức CrCl',0,Infinity,'Không có bảng giảm liều cố định theo CrCl cho nang uống; dùng thận trọng vì dữ liệu suy thận hạn chế và đánh giá đáp ứng/nồng độ khi cần.','Nhãn itraconazole capsules (DailyMed).')],
    hd:'Không bị loại đáng kể bằng HD; không cần liều bổ sung thường quy.',crrt:'Dữ liệu hạn chế; không tự động hiệu chỉnh chỉ theo CRRT.',verified:'Nhãn DailyMed trực tiếp; kiểm tra tương tác CYP3A4 trước dùng.'
  };
  renalRules['cefazolin']={
    standard:'Điều trị thường 1–2 g IV mỗi 8 giờ; dự phòng phẫu thuật 2 g IV trong 60 phút trước rạch da, 3 g nếu cân nặng ≥120 kg.',
    rules:[rule('CrCl >30',30,Infinity,'1 g IV mỗi 8 giờ (nhiễm không biến chứng) hoặc 2 g IV mỗi 8 giờ (nhiễm nặng/phức tạp).','UCSF IDMP – Cefazolin.'),rule('CrCl 10–29',10,30,'1 g IV mỗi 12 giờ hoặc 2 g IV mỗi 12 giờ theo mức độ nhiễm.','UCSF IDMP – Cefazolin.'),rule('CrCl <10',0,10,'1 g IV mỗi 24 giờ; liều nạp theo chỉ định thường không giảm.','UCSF IDMP – Cefazolin.')],
    hd:'2 g IV sau mỗi buổi HD; lựa chọn lịch 2 g/2 g/3 g sau HD theo phác đồ bệnh viện.',crrt:'Thường 2 g IV mỗi 12 giờ; cá thể hóa theo mức lọc và mức độ nhiễm.',verified:'Nhãn cefazolin FDA + hướng dẫn hiệu chỉnh liều UCSF trực tiếp.'
  };

  if(renalRules['imipenem cilastatin']){
    Object.assign(renalRules['imipenem cilastatin'],{
      standard:'Liều tính theo thành phần imipenem. Người lớn CrCl ≥90 mL/phút: 500 mg imipenem mỗi 6 giờ hoặc 1.000 mg mỗi 8 giờ với vi khuẩn nhạy cảm; tối đa 4.000 mg imipenem/ngày. Cepemid 1,5 g chứa imipenem 750 mg + cilastatin 750 mg mỗi lọ.',
      rules:[rule('CrCl ≥90',90,Infinity,'500 mg imipenem mỗi 6 giờ hoặc 1.000 mg mỗi 8 giờ; vi khuẩn nhạy cảm trung gian: 1.000 mg mỗi 6 giờ.','Nhãn imipenem/cilastatin DailyMed.'),rule('CrCl 60–89',60,90,'400–500 mg imipenem mỗi 6 giờ; với vi khuẩn nhạy cảm trung gian: 750 mg mỗi 8 giờ.','Nhãn imipenem/cilastatin DailyMed.'),rule('CrCl 30–59',30,60,'300 mg imipenem mỗi 6 giờ hoặc 500 mg mỗi 8 giờ; với vi khuẩn nhạy cảm trung gian: 500 mg mỗi 6 giờ.','Nhãn imipenem/cilastatin DailyMed.'),rule('CrCl 15–29',15,30,'200 mg imipenem mỗi 6 giờ hoặc 500 mg mỗi 12 giờ; tăng nguy cơ co giật.','Nhãn imipenem/cilastatin DailyMed.'),rule('CrCl <15',0,15,'Không dùng trừ khi HD được thực hiện trong vòng 48 giờ; dùng lịch HD theo nhãn.','Nhãn imipenem/cilastatin DailyMed.')],
      hd:'Dùng sau HD theo bảng liều suy thận của nhãn; HD loại được imipenem và cilastatin.',crrt:'Cá thể hóa theo effluent rate, MIC và nguy cơ co giật.',verified:'Nhãn DailyMed + hồ sơ Cục Quản lý Dược xác nhận Cepemid 1,5 g = 750/750 mg.'
    });
  }
  if(renalRules.fosfomycin){
    renalRules.fosfomycin.standard='Fosfomycin IV thường 12–16 g/ngày chia 2–4 lần; một số nhiễm rất nặng dùng đến 24 g/ngày theo chỉ định và nhãn/phác đồ.';
    renalRules.fosfomycin.verified='Nhãn fosfomycin IV trực tiếp; đối chiếu chỉ định, tải natri và HDSD Fosmicin.';
  }

  const meta={
    'amikacin':{doseDetail:'Liều truyền tĩnh mạch truyền thống 15 mg/kg/ngày, dùng một lần hoặc chia 2–3 lần; phác đồ liều kéo dài trong nhiễm nặng phải tính theo cân nặng phù hợp, chức năng thận và TDM.',maxDose:'Theo nhãn: không quá 15 mg/kg/ngày và thường không quá 1,5 g/ngày; phác đồ khác chỉ dùng theo quy trình TDM đã phê duyệt.',doseSources:[source('Amikacin sulfate injection – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=0b56f6df-a05d-4520-8bf0-d7cefe20f6ad')]},
    'amoxicillin acid clavulanic':{doseDetail:'IV 1.000/200 mg mỗi 8 giờ; có thể mỗi 6 giờ khi nhiễm nặng theo phác đồ. Viên 500/125 mg thường 1 viên mỗi 8–12 giờ tùy chỉ định.',maxDose:'Axuka IV: mức cao nhất đang hiển thị 1.000/200 mg mỗi 6 giờ = 4.000/800 mg/ngày, chỉ khi phác đồ cho phép. Viên 500/125 mg: tối đa trong công cụ 1 viên mỗi 8 giờ = 1.500/375 mg/ngày.',doseSources:[source('Co-amoxiclav 1000/200 mg IV – eMC SmPC','https://www.medicines.org.uk/emc/product/8753/smpc'),source('Co-amoxiclav 500/125 mg tablets – eMC SmPC','https://www.medicines.org.uk/emc/product/4078/smpc')]},
    'benzathin benzylpenicilin':{doseDetail:'Giang mai sớm: 2,4 triệu IU IM một liều. Giang mai muộn/không rõ thời gian: 2,4 triệu IU IM mỗi tuần trong 3 tuần. Các chỉ định khác theo nhãn và hướng dẫn bệnh viện.',maxDose:'Tối đa mỗi lần thường 2,4 triệu IU IM; tổng liệu trình và khoảng cách phụ thuộc chỉ định. Tuyệt đối không tiêm tĩnh mạch.',doseSources:[source('Bicillin L-A (penicillin G benzathine) – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2019/050141s237lbl.pdf')]},
    'sulfamethoxazol trimethoprim':{doseDetail:'Nhiễm khuẩn thông thường thường 800/160 mg mỗi 12 giờ. Viêm phổi Pneumocystis: liều theo trimethoprim 15–20 mg/kg/ngày và sulfamethoxazol 75–100 mg/kg/ngày, chia mỗi 6–8 giờ.',maxDose:'Không có một giới hạn chung cho mọi chỉ định; liều cao nhất theo nhãn ở PCP là TMP 20 mg/kg/ngày + SMX 100 mg/kg/ngày.',doseSources:[source('BACTRIM – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/017377s083lbl.pdf')]},
    'levofloxacin':{doseDetail:'500 mg hoặc 750 mg mỗi 24 giờ tùy chỉ định; liều đầu thường giữ nguyên khi suy thận, sau đó giảm liều hoặc kéo dài khoảng cách theo CrCl.',maxDose:'750 mg/ngày ở người lớn có chức năng thận bình thường.',doseSources:[source('Levofloxacin injection – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ba69722b-d7f2-4519-8a63-9ee91294c499')]},
    'cefpodoxim':{doseDetail:'100–200 mg uống mỗi 12 giờ tùy vị trí nhiễm; khi CrCl <30 mL/phút dùng cùng liều mỗi 24 giờ.',maxDose:'400 mg/ngày.',doseSources:[source('Cefpodoxime proxetil tablets – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c36f2137-98bb-4583-89f7-6bce9582c465')]},
    'cefixim':{doseDetail:'400 mg/ngày, dùng 400 mg mỗi 24 giờ hoặc 200 mg mỗi 12 giờ; giảm mức phơi nhiễm theo bảng chức năng thận của nhãn.',maxDose:'400 mg/ngày.',doseSources:[source('Cefixime – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=b5a3c547-3bc7-4856-af9c-1bead294f5d9')]},
    'cefoperazon':{doseDetail:'1–2 g IV mỗi 12 giờ; nhiễm nặng có thể tăng theo nhãn. Khi tắc mật/suy gan nặng, đặc biệt kèm suy thận, phải giảm tổng liều và theo dõi nồng độ nếu có.',maxDose:'12 g/ngày theo nhãn; khi tắc mật nặng tổng liều không nên vượt 4 g/ngày nếu không theo dõi nồng độ.',doseSources:[source('Cefoperazone sodium – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2015/050551s043lbl.pdf')]},
    'cefoxitin':{doseDetail:'1–2 g IV mỗi 6–8 giờ; nhiễm đe dọa tính mạng có thể dùng 2 g mỗi 4 giờ hoặc 3 g mỗi 6 giờ theo nhãn.',maxDose:'12 g/ngày.',doseSources:[source('MEFOXIN (cefoxitin) – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/050517s053lbl.pdf')]},
    'ceftazidim':{doseDetail:'1–2 g IV mỗi 8 giờ tùy chỉ định; dùng bảng giảm liều theo CrCl sau liều nạp 1 g ở suy thận.',maxDose:'6 g/ngày ở người lớn theo phác đồ 2 g mỗi 8 giờ.',doseSources:[source('FORTAZ (ceftazidime) – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2020/050578s062lbl.pdf')]},
    'imipenem cilastatin':{doseDetail:'Liều tính theo imipenem: CrCl ≥90 thường 500 mg mỗi 6 giờ hoặc 1.000 mg mỗi 8 giờ; dùng đúng bảng liều CrCl trên nhãn. Cepemid 1,5 g chứa 750 mg imipenem + 750 mg cilastatin/lọ.',maxDose:'Tối đa 4.000 mg imipenem/ngày và không quá 50 mg/kg/ngày, chọn mức thấp hơn.',doseSources:[source('Imipenem/cilastatin injection – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=46f54df9-5afe-430c-aa19-0d84c2044b0b'),source('Cepemid 1,5 g – hồ sơ Cục Quản lý Dược','https://dav.gov.vn/file/2015/Theo%20TT%2013-2009/0701/img997.pdf')]},
    'ciprofloxacin':{doseDetail:'Uống 500–750 mg mỗi 12 giờ hoặc IV 400 mg mỗi 8–12 giờ tùy chỉ định; hiệu chỉnh liều/khoảng cách khi CrCl giảm.',maxDose:'Uống 1.500 mg/ngày; IV 1.200 mg/ngày.',doseSources:[source('CIPRO (ciprofloxacin) – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2016/019537s086lbl.pdf')]},
    'colistin':{doseDetail:'Phải xác nhận đơn vị của đúng chế phẩm. Với colistimethate sodium ghi theo MIU, thường dùng liều nạp 9 MIU rồi liều duy trì chia 2 lần, hiệu chỉnh theo CrCl.',maxDose:'Mức duy trì thường không vượt 9 MIU/ngày theo SmPC tham chiếu; không quy đổi trực tiếp MIU sang mg colistin base activity nếu nhãn không nêu chuẩn quy đổi.',doseSources:[source('Colomycin (colistimethate sodium) – eMC SmPC','https://www.medicines.org.uk/emc/product/1094/smpc')]},
    'fosfomycin':{doseDetail:'Fosfomycin IV thường 12–16 g/ngày chia 2–4 lần; nhiễm rất nặng có thể dùng 16–24 g/ngày tùy chỉ định, sau đó áp dụng tỷ lệ liều theo CrCl.',maxDose:'Tối đa 24 g/ngày trong các phác đồ nhiễm rất nặng; một số nhãn/chỉ định giới hạn thấp hơn, phải đối chiếu đúng chế phẩm.',doseSources:[source('Fosfomycin IV – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=855574f2-39f8-43bc-a3d2-79dbb578cb94')]},
    'gentamicin':{doseDetail:'Liều kéo dài thường 5–7 mg/kg/lần; khoảng cách dùng được xác định bằng nomogram và nồng độ thuốc. Liều hiệp đồng thấp hơn và theo phác đồ riêng.',maxDose:'Không có mức mg/ngày cố định cho mọi người bệnh; không vượt phác đồ 7 mg/kg/lần nếu chưa có chỉ định và TDM chuyên biệt.',doseSources:[source('Gentamicin sulfate injection – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=63413469-c676-48a3-a945-7d2489b535ef')]},
    'ampicilin sulbactam':{doseDetail:'1,5–3 g IV mỗi 6 giờ; giảm tần suất còn mỗi 12 hoặc 24 giờ khi CrCl giảm theo bảng nhãn.',maxDose:'12 g/ngày tổng phối hợp, tương ứng tối đa 4 g sulbactam/ngày.',doseSources:[source('UNASYN (ampicillin/sulbactam) – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9a722de6-9dc0-4fb9-b63a-225385aa3314')]},
    'meropenem':{doseDetail:'Thường 1 g IV mỗi 8 giờ; viêm màng não hoặc một số nhiễm nặng 2 g mỗi 8 giờ. Giảm liều/kéo dài khoảng cách khi CrCl ≤50 mL/phút.',maxDose:'6 g/ngày theo phác đồ 2 g mỗi 8 giờ.',doseSources:[source('Meropenem injection – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7a68d899-2678-43a9-a9c1-ef8f916b562f')]},
    'metronidazol':{doseDetail:'Thường 500 mg IV/uống mỗi 8–12 giờ; nhiễm kỵ khí nặng có thể dùng liều nạp 15 mg/kg rồi 7,5 mg/kg mỗi 6 giờ theo nhãn.',maxDose:'4 g/ngày.',doseSources:[source('Metronidazole injection – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6b35138f-491b-46cf-97d3-55f43e651d63')]},
    'moxifloxacin':{doseDetail:'400 mg uống hoặc truyền tĩnh mạch mỗi 24 giờ; không cần hiệu chỉnh theo CrCl, kể cả HD hoặc CAPD.',maxDose:'400 mg/ngày.',doseSources:[source('AVELOX (moxifloxacin) – DailyMed','https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=1ed191f5-7df5-488c-bb72-91ac0b618d9a&version=11')]},
    'piperacilin tazobactam':{doseDetail:'4,5 g IV mỗi 6–8 giờ tùy mức độ nhiễm; giảm liều/kéo dài khoảng cách khi CrCl ≤40 mL/phút. Phác đồ truyền kéo dài chỉ dùng khi bệnh viện phê duyệt.',maxDose:'18 g/ngày tổng phối hợp, tương ứng piperacillin 16 g + tazobactam 2 g/ngày.',doseSources:[source('ZOSYN (piperacillin/tazobactam) – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/050684s105lbl.pdf')]},
    'cefotaxim':{doseDetail:'1–2 g IV mỗi 6–8 giờ; nhiễm đe dọa tính mạng có thể 2 g mỗi 4 giờ theo nhãn. Giảm khoảng 50% liều duy trì khi CrCl rất thấp.',maxDose:'12 g/ngày.',doseSources:[source('CLAFORAN (cefotaxime) – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2015/050547s071%2C050596s042lbl.pdf')]},
    'ceftriaxon':{doseDetail:'1–2 g IV mỗi 24 giờ; viêm màng não 2 g mỗi 12 giờ. Thường không chỉnh đơn độc theo thận; nếu suy gan nặng kèm suy thận, giới hạn tổng liều.',maxDose:'4 g/ngày.',doseSources:[source('Ceftriaxone sodium injection – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e6ac87e3-481e-4884-ac06-1fd7279cad62')]},
    'vancomycin':{doseDetail:'Nhiễm nặng: liều nạp 20–25 mg/kg cân nặng thực; liều duy trì và khoảng cách phải chốt theo AUC24/MIC mục tiêu 400–600 và nồng độ thực đo.',maxDose:'Không có trần duy trì cố định áp dụng cho mọi người bệnh; liều nạp thường giới hạn 3 g theo hướng dẫn AUC, sau đó cá thể hóa bằng TDM.',doseSources:[source('Vancomycin injection – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/050671s024lbl.pdf'),source('Vancomycin AUC monitoring guideline – ASHP/IDSA/PIDS','https://www.ashp.org/-/media/assets/policy-guidelines/docs/therapeutic-guidelines/therapeutic-guidelines-monitoring-vancomycin-ASHP-IDSA-PIDS.pdf')]},
    'spiramycin metronidazol':{doseDetail:'4–6 viên/ngày chia 2–3 lần trong bữa ăn, tương ứng spiramycin 3–4,5 triệu IU và metronidazol 500–750 mg mỗi 24 giờ.',maxDose:'6 viên/ngày = spiramycin 4,5 triệu IU + metronidazol 750 mg/ngày.',doseSources:[source('Spiramycin – Cơ sở dữ liệu thuốc công Pháp','https://base-donnees-publique.medicaments.gouv.fr/medicament/67535280/extrait'),source('Metronidazole – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/018890s052lbl.pdf')]},
    'ofloxacin':{doseDetail:'Thuốc mỡ tra mắt: dải khoảng 1 cm vào túi kết mạc mắt bệnh, 3 lần/ngày; không dùng quá 14 ngày nếu không được đánh giá lại.',maxDose:'Tối đa 3 lần tra/ngày theo chế độ đang dùng; không quy đổi sang g hoạt chất/24 giờ vì là dạng dùng tại chỗ.',doseSources:[source('Ofloxacin ophthalmic – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=8b73d354-4631-40e8-b187-e8b0580bd6ea')]},
    'itraconazol':{doseDetail:'Nang 100–200 mg/lần, ngày 1–2 lần tùy chỉ định, uống ngay sau bữa ăn. Một số nhiễm nấm xâm lấn cần liều tải và TDM theo chuyên khoa.',maxDose:'400 mg/ngày đối với nang uống trong các phác đồ thông thường theo nhãn.',doseSources:[source('Itraconazole capsules – DailyMed','https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6242b7ad-eaa0-a524-b6e0-ec33e63407db')]},
    'cefazolin':{doseDetail:'Điều trị thường 1–2 g IV mỗi 8 giờ. Dự phòng phẫu thuật 2 g IV trong 60 phút trước rạch da, 3 g nếu ≥120 kg; hiệu chỉnh liều duy trì theo CrCl.',maxDose:'Nhãn ghi liều hiếm khi đến 12 g/ngày trong nhiễm đe dọa tính mạng; liều thường không vượt 6 g/ngày nếu không có chỉ định chuyên khoa.',doseSources:[source('Cefazolin for injection – FDA label','https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/216109s003lbl.pdf'),source('Cefazolin renal dosing – UCSF IDMP','https://idmp.ucsf.edu/content/cefazolin')]}
  };

  const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  function key(active){
    const a=normalize(active).replace(/hydrochloride|hydrochlorid/g,'').trim();
    if(a.includes('amoxicillin')||a.includes('amoxicilin'))return 'amoxicillin acid clavulanic';
    if(a.includes('ampicilin')||a.includes('ampicillin'))return 'ampicilin sulbactam';
    if(a.includes('sulfamethoxazol'))return 'sulfamethoxazol trimethoprim';
    if(a.includes('imipenem'))return 'imipenem cilastatin';
    if(a.includes('piperacilin'))return 'piperacilin tazobactam';
    if(a.includes('ciprofloxacin'))return 'ciprofloxacin';
    if(a.includes('ceftriaxon'))return 'ceftriaxon';
    if(a.includes('vancomycin'))return 'vancomycin';
    return a;
  }

  drugs.sort((a,b)=>Number(a.id)-Number(b.id));
  drugs.forEach(d=>{
    const k=key(d.active),r=renalRules[k],m=meta[k];
    if(r){d.standard=r.standard;d.renal=r.rules.map(x=>`${x.label}: ${x.text}`);d.hd=r.hd;d.crrt=r.crrt;d.renalVerified=r.verified;}
    if(m){d.doseDetail=m.doseDetail;d.maxDose=m.maxDose;d.doseSources=m.doseSources;}
    d.reviewed='16/07/2026';
  });
})();
