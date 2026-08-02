(function(){
  const COMMON_SOURCES = [
    {title:'Cục Quản lý Dược – tra cứu giấy đăng ký/tờ HDSD', url:'https://dichvucong.dav.gov.vn/congbothuoc/index'},
    {title:'Dược thư Quốc gia Việt Nam lần xuất bản thứ ba – Quyết định 3445/QĐ-BYT', url:'https://soyte.ninhbinh.gov.vn/y-te-du-phong/quyet-dinh-3445-qd-byt-nam-2022-duoc-thu-quoc-gia-viet-nam-lan-xuat-ban-thu-ba-330210'},
    {title:'Quyết định 5948/QĐ-BYT – tương tác thuốc chống chỉ định', url:'https://kcb.vn/tin-tuc/danh-muc-tuong-tac-thuoc-chong-chi-dinh-trong-thuc-hanh-lam-sang-va-huong-dan-giam-sat-phan-ung-co-hai-cua-thuoc-adr-tai.html'}
  ];
  window.VPMED_VERIFIED_DRUG_PROFILES = [
    {
      key:'atorvastatin', aliases:['atorvastatin'], regNumbers:['VN-18272-14'], group:'Thuốc hạ lipid máu – statin',
      standard:'Người lớn: thường khởi đầu 10–20 mg uống 1 lần/ngày; khoảng liều 10–80 mg/ngày. Đánh giá lipid sau 2–4 tuần và chỉnh liều theo mục tiêu, dung nạp và nguy cơ tim mạch. Không tự tăng liều khi chưa đánh giá tương tác và chức năng gan.',
      route:'Uống 1 lần/ngày, có thể dùng cùng hoặc không cùng thức ăn; dùng vào thời điểm cố định.',
      indications:[
        'Điều trị tăng cholesterol máu nguyên phát, bao gồm tăng cholesterol máu gia đình dị hợp tử, và tăng lipid máu hỗn hợp khi chế độ ăn/biện pháp không dùng thuốc chưa đủ hiệu quả.',
        'Điều trị bổ trợ tăng cholesterol máu gia đình đồng hợp tử theo chỉ định chuyên khoa.',
        'Dự phòng biến cố tim mạch ở người có nguy cơ cao theo hướng dẫn điều trị; mã ICD phải là chẩn đoán thực tế của người bệnh, không lấy biến cố tim mạch làm chỉ định mặc định.'
      ],
      contraindications:[
        'Quá mẫn với atorvastatin hoặc tá dược.',
        'Bệnh gan tiến triển hoặc tăng transaminase huyết thanh kéo dài không giải thích được.',
        'Phụ nữ mang thai, đang cho con bú; phụ nữ có khả năng mang thai không áp dụng biện pháp tránh thai phù hợp theo tờ HDSD.'
      ],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:[
        'Clarithromycin/erythromycin, azol kháng nấm, thuốc ức chế protease, ciclosporin và các chất ức chế CYP3A4/OATP: tăng nồng độ atorvastatin và nguy cơ bệnh cơ/tiêu cơ vân; giới hạn liều hoặc tránh phối hợp theo tờ HDSD.',
        'Gemfibrozil và các fibrat, niacin liều hạ lipid, colchicin: tăng nguy cơ bệnh cơ; theo dõi đau/yếu cơ và CK khi có chỉ định.',
        'Nước bưởi lượng lớn: có thể tăng nồng độ atorvastatin.',
        'Thuốc chống đông kháng vitamin K: theo dõi INR khi bắt đầu, đổi liều hoặc ngừng statin.'
      ],
      icdMappings:[
        {term:'Tăng cholesterol máu đơn thuần', codes:['E78.0']},
        {term:'Tăng lipid máu hỗn hợp', codes:['E78.2']},
        {term:'Tăng lipid máu chưa xác định rõ', codes:['E78.5']}
      ],
      sources:[
        {title:'Quyết định gia hạn Atoris 10mg – SĐK VN-18272-14', url:'https://dav.gov.vn/upload_images/files/853_Q%C4%90_QLD%202022_signed.pdf'},
        {title:'Tờ HDSD atorvastatin do Cục Quản lý Dược công bố – đối chiếu theo hoạt chất, không thay thế HDSD đúng chế phẩm Atoris', url:'https://dav.gov.vn/file/2016/Nam%202016%20theo%20TT%2013-2009/0513/img216.pdf'},
        ...COMMON_SOURCES
      ]
    },
    {
      key:'acetylsalicylic_acid', aliases:['acetylsalicylic acid','aspirin'], group:'Thuốc chống kết tập tiểu cầu',
      standard:'Dự phòng huyết khối động mạch: thường 75–150 mg uống mỗi ngày. Trong hội chứng vành cấp có thể dùng liều nạp theo hướng dẫn chuyên khoa; không áp dụng liều giảm đau/kháng viêm cho chế phẩm aspirin liều thấp nếu chưa kiểm tra đúng chỉ định.',
      route:'Uống sau ăn với nước; không nghiền viên bao tan trong ruột trừ khi tờ HDSD cho phép.',
      indications:[
        'Dự phòng thứ phát nhồi máu cơ tim và đột quỵ thiếu máu não/TIA.',
        'Hội chứng vành cấp, sau can thiệp mạch vành hoặc bệnh động mạch ngoại biên theo phác đồ chuyên khoa.',
        'Không tự gán chỉ định cho mọi bệnh tim mạch; phải khớp hồ sơ bệnh án và chiến lược kháng huyết khối.'
      ],
      contraindications:['Đang chảy máu hoặc rối loạn chảy máu nặng','Tiền sử quá mẫn aspirin/NSAID hoặc hen do aspirin','Loét dạ dày–tá tràng tiến triển','Suy gan, suy thận hoặc suy tim nặng theo tờ HDSD','Trẻ em/thiếu niên mắc bệnh do virus do nguy cơ hội chứng Reye'],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:['Thuốc chống đông/thuốc chống kết tập tiểu cầu khác/NSAID: tăng nguy cơ xuất huyết','Methotrexat: tăng độc tính; một số mức liều là phối hợp chống chỉ định theo nguồn chuyên môn','Ibuprofen dùng đồng thời có thể làm giảm tác dụng chống kết tập của aspirin','Corticosteroid, SSRI/SNRI và rượu: tăng nguy cơ xuất huyết tiêu hóa'],
      icdMappings:[
        {term:'Hội chứng vành cấp/nhồi máu cơ tim', codes:['I20.0','I21.9']},
        {term:'Tiền sử nhồi máu cơ tim', codes:['I25.2']},
        {term:'Nhồi máu não/TIA', codes:['I63.9','G45.9']},
        {term:'Bệnh động mạch ngoại biên', codes:['I73.9']}
      ],
      sources:COMMON_SOURCES
    },
    {
      key:'clopidogrel', aliases:['clopidogrel'], group:'Thuốc chống kết tập tiểu cầu – ức chế P2Y12',
      standard:'Liều duy trì thường 75 mg uống 1 lần/ngày. Liều nạp 300–600 mg chỉ dùng khi có chỉ định hội chứng vành cấp/PCI theo phác đồ và đánh giá nguy cơ chảy máu.',
      route:'Uống 1 lần/ngày, cùng hoặc không cùng thức ăn.',
      indications:['Dự phòng biến cố xơ vữa huyết khối sau nhồi máu cơ tim, nhồi máu não hoặc bệnh động mạch ngoại biên','Hội chứng vành cấp và sau can thiệp mạch vành, thường phối hợp aspirin theo thời gian phác đồ','Không dùng rung nhĩ đơn thuần như chỉ định mặc định khi chưa xác định chiến lược chống đông'],
      contraindications:['Quá mẫn','Đang chảy máu bệnh lý như xuất huyết tiêu hóa hoặc xuất huyết nội sọ','Suy gan nặng theo tờ HDSD'],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:['Omeprazol/esomeprazol: có thể giảm hoạt hóa clopidogrel qua CYP2C19; cân nhắc PPI khác theo hướng dẫn','Thuốc chống đông, aspirin, NSAID, SSRI/SNRI: tăng nguy cơ chảy máu','Chất cảm ứng/ức chế CYP2C19 có thể thay đổi hiệu lực'],
      icdMappings:[
        {term:'Hội chứng vành cấp/nhồi máu cơ tim', codes:['I20.0','I21.9']},
        {term:'Tiền sử nhồi máu cơ tim', codes:['I25.2']},
        {term:'Nhồi máu não', codes:['I63.9']},
        {term:'Bệnh động mạch ngoại biên', codes:['I73.9']}
      ],
      sources:COMMON_SOURCES
    },
    {
      key:'acenocoumarol', aliases:['acenocoumarol'], group:'Thuốc chống đông kháng vitamin K',
      standard:'Liều cá thể hóa hoàn toàn theo INR, chỉ định, tuổi, chức năng gan, chế độ ăn và tương tác. Không hiển thị liều cố định để tránh sử dụng sai; cần theo phác đồ chống đông và kết quả INR hiện tại.',
      route:'Uống 1 lần/ngày vào cùng thời điểm; điều chỉnh liều theo INR.',
      indications:['Dự phòng và điều trị huyết khối/thuyên tắc tĩnh mạch','Phòng ngừa thuyên tắc ở rung nhĩ khi thuốc kháng vitamin K được lựa chọn','Van tim cơ học hoặc chỉ định chống đông khác theo chuyên khoa'],
      contraindications:['Đang chảy máu hoặc nguy cơ xuất huyết rất cao','Thai kỳ, đặc biệt ba tháng đầu và cuối thai kỳ, trừ chỉ định chuyên khoa đặc biệt','Suy gan nặng, tăng huyết áp nặng không kiểm soát, tổn thương có nguy cơ chảy máu theo tờ HDSD','Không có khả năng theo dõi INR hoặc tuân thủ điều trị'],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:['Rất nhiều tương tác: kháng sinh, azol, amiodaron, NSAID, thuốc chống kết tập tiểu cầu, thuốc chống động kinh, vitamin K và thảo dược có thể làm thay đổi INR','Bắt buộc kiểm tra tương tác và theo dõi INR khi thêm, ngừng hoặc đổi liều thuốc'],
      icdMappings:[
        {term:'Rung nhĩ/cuồng nhĩ', codes:['I48.0','I48.1','I48.2','I48.9']},
        {term:'Huyết khối tĩnh mạch', codes:['I82.9']},
        {term:'Thuyên tắc phổi', codes:['I26.9']},
        {term:'Có van tim nhân tạo', codes:['Z95.2']}
      ],
      sources:COMMON_SOURCES
    },
    {
      key:'fenofibrate', aliases:['fenofibrat','fenofibrate'], group:'Thuốc hạ lipid máu – fibrat',
      standard:'Liều phụ thuộc dạng bào chế và sinh khả dụng của đúng chế phẩm; không quy đổi mg giữa các chế phẩm 145/160/200/300 mg. Hiệu chỉnh hoặc tránh dùng theo mức suy thận và tờ HDSD.',
      route:'Uống theo hướng dẫn của đúng chế phẩm; một số dạng dùng cùng bữa ăn.',
      indications:['Tăng triglycerid máu nặng','Tăng lipid máu hỗn hợp khi statin không phù hợp hoặc phối hợp có chỉ định sau đánh giá nguy cơ bệnh cơ','Điều trị luôn đi kèm chế độ ăn và xử trí nguyên nhân thứ phát'],
      contraindications:['Suy gan nặng hoặc bệnh gan đang hoạt động','Suy thận nặng','Bệnh túi mật','Tiền sử phản ứng quang độc/quang dị ứng với fibrat hoặc ketoprofen theo tờ HDSD'],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:['Statin/gemfibrozil hoặc thuốc gây bệnh cơ: tăng nguy cơ bệnh cơ/tiêu cơ vân','Thuốc chống đông kháng vitamin K: tăng tác dụng; theo dõi INR và chỉnh liều','Ciclosporin: tăng nguy cơ suy thận'],
      icdMappings:[{term:'Tăng triglycerid máu đơn thuần',codes:['E78.1']},{term:'Tăng lipid máu hỗn hợp',codes:['E78.2']}],
      sources:COMMON_SOURCES
    },
    {
      key:'rosuvastatin', aliases:['rosuvastatin'], group:'Thuốc hạ lipid máu – statin',
      standard:'Người lớn thường khởi đầu 5–10 mg uống 1 lần/ngày; khoảng liều 5–40 mg/ngày. Liều 40 mg chỉ dùng cho người chưa đạt mục tiêu với liều thấp hơn và cần theo dõi chặt.',
      route:'Uống 1 lần/ngày, cùng hoặc không cùng thức ăn.',
      indications:['Tăng cholesterol máu nguyên phát/tăng lipid máu hỗn hợp','Tăng cholesterol máu gia đình theo chỉ định','Dự phòng biến cố tim mạch ở người nguy cơ cao theo hướng dẫn'],
      contraindications:['Bệnh gan tiến triển','Suy thận nặng đối với liều cao theo tờ HDSD','Bệnh cơ','Dùng đồng thời ciclosporin','Mang thai và cho con bú'],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:['Ciclosporin: chống chỉ định','Gemfibrozil/fibrat: tăng nguy cơ bệnh cơ','Thuốc kháng acid chứa nhôm/magnesi giảm hấp thu; dùng cách thời điểm','Kháng vitamin K: theo dõi INR'],
      icdMappings:[{term:'Tăng cholesterol máu đơn thuần',codes:['E78.0']},{term:'Tăng lipid máu hỗn hợp',codes:['E78.2']},{term:'Tăng lipid máu chưa xác định rõ',codes:['E78.5']}],
      sources:COMMON_SOURCES
    },
    {
      key:'lovastatin', aliases:['lovastatin'], group:'Thuốc hạ lipid máu – statin',
      standard:'Liều theo đúng chế phẩm; thường 10–20 mg/ngày, chỉnh liều cách nhau ít nhất 4 tuần. Một số dạng dùng cùng bữa tối; giới hạn liều thay đổi theo thuốc phối hợp.',
      route:'Uống theo tờ HDSD, thường cùng bữa tối đối với dạng giải phóng thông thường.',
      indications:['Tăng cholesterol máu nguyên phát và tăng lipid máu hỗn hợp khi chế độ ăn chưa đủ hiệu quả','Dự phòng biến cố tim mạch theo chỉ định và hướng dẫn'],
      contraindications:['Bệnh gan tiến triển/tăng transaminase kéo dài','Mang thai và cho con bú','Dùng cùng chất ức chế CYP3A4 mạnh theo tờ HDSD'],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:['Clarithromycin, azol, thuốc ức chế protease và các chất ức chế CYP3A4 mạnh: tăng nguy cơ tiêu cơ vân, thường phải tránh phối hợp','Gemfibrozil/fibrat, ciclosporin, amiodaron, verapamil/diltiazem: giới hạn liều hoặc theo dõi chặt'],
      icdMappings:[{term:'Tăng cholesterol máu đơn thuần',codes:['E78.0']},{term:'Tăng lipid máu hỗn hợp',codes:['E78.2']},{term:'Tăng lipid máu chưa xác định rõ',codes:['E78.5']}],
      sources:COMMON_SOURCES
    },
    {
      key:'aciclovir_cream_5', brands:['Aciclovir 5%'], brandsOnly:true, group:'Kháng virus dùng ngoài',
      standard:'Bôi lớp mỏng lên vùng tổn thương theo tờ HDSD của đúng chế phẩm; thường dùng nhiều lần trong ngày và bắt đầu càng sớm càng tốt khi xuất hiện triệu chứng herpes.',
      route:'Dùng ngoài da; rửa tay trước và sau khi bôi, tránh mắt và niêm mạc nếu chế phẩm không dùng cho các vị trí này.',
      indications:['Điều trị tổn thương da do Herpes simplex, như herpes môi hoặc herpes sinh dục, theo chỉ định của tờ HDSD.'],
      contraindications:['Quá mẫn với aciclovir, valaciclovir hoặc tá dược của chế phẩm.'],
      infusionDetails:['Không áp dụng pha/truyền đối với chế phẩm dùng ngoài.'],
      interactions:['Tương tác toàn thân ít gặp khi dùng ngoài; không bôi đồng thời nhiều chế phẩm tại cùng vị trí nếu chưa kiểm tra tương hợp.'],
      icdMappings:[{term:'Nhiễm Herpes simplex ở da/niêm mạc',codes:['B00.1','B00.9']}],
      sources:COMMON_SOURCES
    },
    {
      key:'aciclovir_eye_3', brands:['Acyclovir 3% SYT-25'], brandsOnly:true, group:'Kháng virus dùng tại mắt',
      standard:'Tra mắt theo tờ HDSD của đúng chế phẩm; điều trị phải được bác sĩ mắt đánh giá và tiếp tục đủ thời gian sau khi tổn thương biểu mô lành.',
      route:'Tra vào túi kết mạc; không để đầu tuýp chạm mắt hoặc bề mặt khác.',
      indications:['Viêm giác mạc do Herpes simplex.'],
      contraindications:['Quá mẫn với aciclovir, valaciclovir hoặc tá dược.'],
      infusionDetails:['Không áp dụng pha/truyền.'],
      interactions:['Không dùng đồng thời thuốc tra mắt khác cùng thời điểm; cách các thuốc tại mắt theo hướng dẫn và dùng thuốc mỡ sau thuốc nhỏ.'],
      icdMappings:[{term:'Bệnh mắt do Herpes simplex',codes:['B00.5']}],
      sources:COMMON_SOURCES
    },
    {
      key:'spiramycin_metronidazole_dental', aliases:['spiramycin metronidazol'], group:'Kháng sinh phối hợp dùng trong răng–miệng',
      standard:'Liều phụ thuộc hàm lượng spiramycin/metronidazol của đúng chế phẩm; không quy đổi giữa các biệt dược. Dùng đủ liệu trình theo chẩn đoán nhiễm khuẩn răng–miệng.',
      route:'Uống trong hoặc sau bữa ăn; nuốt nguyên viên nếu là viên bao.',
      indications:['Nhiễm khuẩn răng–miệng cấp hoặc mạn do vi khuẩn nhạy cảm, gồm áp xe răng, viêm quanh thân răng, viêm nướu và viêm nha chu theo chỉ định.','Dự phòng biến chứng nhiễm khuẩn tại chỗ sau thủ thuật răng–miệng khi tờ HDSD/phác đồ cho phép.'],
      contraindications:['Quá mẫn với spiramycin, macrolid, metronidazol hoặc nitroimidazol','Ba tháng đầu thai kỳ hoặc các trường hợp chống chỉ định khác theo tờ HDSD','Rối loạn thần kinh tiến triển hoặc bệnh máu cần thận trọng/đánh giá theo tờ HDSD'],
      infusionDetails:['Không áp dụng pha/truyền đối với viên uống.'],
      interactions:['Rượu: tránh trong khi dùng và ít nhất 48 giờ sau metronidazol do phản ứng kiểu disulfiram','Thuốc chống đông kháng vitamin K: tăng tác dụng, theo dõi INR','Disulfiram, lithium, phenytoin/phenobarbital: có tương tác đáng kể; kiểm tra trước khi phối hợp'],
      icdMappings:[{term:'Viêm nướu/viêm nha chu',codes:['K05.0','K05.3']},{term:'Áp xe quanh chóp răng',codes:['K04.7']}],
      sources:[{title:'Hướng dẫn sử dụng kháng sinh – Quyết định 708/QĐ-BYT',url:'https://kcb.vn/thu-vien-tai-lieu/tai-lieu-huong-dan-su-dung-khang-sinh.html'},...COMMON_SOURCES]
    },
    {
      key:'ofloxacin_eye_ointment', brands:['Oflovid mỡ 3.5g'], brandsOnly:true, group:'Kháng sinh fluoroquinolon dùng tại mắt',
      standard:'Tra mắt theo tờ HDSD của đúng chế phẩm và mức độ nhiễm khuẩn; không dùng kéo dài hơn cần thiết để hạn chế kháng thuốc.',
      route:'Tra thuốc mỡ vào túi kết mạc; tránh đầu tuýp chạm mắt.',
      indications:['Nhiễm khuẩn phần trước của mắt do vi khuẩn nhạy cảm, như viêm bờ mi, viêm kết mạc, viêm giác mạc hoặc nhiễm khuẩn quanh phẫu thuật theo HDSD.'],
      contraindications:['Quá mẫn với ofloxacin hoặc quinolon.'],
      infusionDetails:['Không áp dụng pha/truyền.'],
      interactions:['Khi dùng nhiều thuốc tại mắt, dùng cách nhau theo hướng dẫn; thuốc mỡ thường dùng sau thuốc nhỏ.'],
      icdMappings:[{term:'Viêm kết mạc',codes:['H10.9']},{term:'Viêm giác mạc',codes:['H16.9']},{term:'Viêm bờ mi',codes:['H01.0']}],
      sources:COMMON_SOURCES
    },
    {
      key:'polygynax_vaginal', brands:['Polygynax'], brandsOnly:true, group:'Kháng khuẩn/kháng nấm dùng âm đạo',
      standard:'Đặt âm đạo theo tờ HDSD của đúng chế phẩm; dùng đủ liệu trình, không tự kéo dài hoặc lặp lại khi chưa xác định nguyên nhân viêm âm đạo.',
      route:'Đặt sâu vào âm đạo, thường vào buổi tối; không dùng đường uống.',
      indications:['Điều trị tại chỗ viêm âm đạo do vi khuẩn và/hoặc Candida nhạy cảm với nystatin, neomycin, polymyxin B theo tờ HDSD.','Dự phòng nhiễm khuẩn âm đạo trước một số thủ thuật phụ khoa khi có chỉ định.'],
      contraindications:['Quá mẫn với bất kỳ thành phần nào','Dùng đồng thời với bao cao su/màng ngăn latex hoặc chất diệt tinh trùng có thể không phù hợp tùy tá dược; kiểm tra tờ HDSD'],
      infusionDetails:['Không áp dụng pha/truyền.'],
      interactions:['Tránh phối hợp tại chỗ với các thuốc âm đạo khác nếu chưa có chỉ định; tá dược dầu có thể ảnh hưởng phương tiện tránh thai bằng latex.'],
      icdMappings:[{term:'Viêm âm đạo cấp',codes:['N76.0']},{term:'Nhiễm Candida âm hộ–âm đạo',codes:['B37.3']}],
      sources:COMMON_SOURCES
    },
    {
      key:'cefazolin', aliases:['cefazolin'], group:'Cephalosporin thế hệ 1',
      standard:'Người lớn thường 0,5–1 g tiêm tĩnh mạch hoặc tiêm bắp mỗi 6–8 giờ tùy loại và mức độ nhiễm khuẩn; nhiễm nặng có thể dùng liều cao hơn theo phác đồ. Hiệu chỉnh khi suy thận. Dự phòng phẫu thuật dùng theo thời điểm rạch da và thời gian phẫu thuật.',
      route:'Tiêm tĩnh mạch chậm hoặc truyền tĩnh mạch; có thể tiêm bắp theo tờ HDSD.',
      indications:['Nhiễm khuẩn da và mô mềm, xương khớp, tiết niệu hoặc nhiễm khuẩn khác do vi khuẩn nhạy cảm','Dự phòng nhiễm khuẩn vết mổ trong các phẫu thuật phù hợp phổ tác dụng'],
      contraindications:['Quá mẫn với cefazolin/cephalosporin; đánh giá tiền sử phản vệ hoặc phản ứng da nặng với beta-lactam'],
      infusionDetails:['Hoàn nguyên và pha loãng theo đúng lọ/hàm lượng; tiêm tĩnh mạch chậm hoặc truyền thường 15–30 phút. Không trộn trực tiếp với aminoglycosid trong cùng dung dịch.'],
      interactions:['Probenecid: giảm thải trừ cefazolin','Thuốc chống đông: có thể tăng nguy cơ chảy máu ở người nguy cơ cao; theo dõi','Aminoglycosid/thuốc độc thận: tăng nguy cơ tổn thương thận'],
      icdMappings:[{term:'Nhiễm khuẩn da và mô mềm',codes:['L08.9','L03.9']},{term:'Viêm xương tủy',codes:['M86.9']},{term:'Nhiễm khuẩn tiết niệu',codes:['N39.0']}],
      sources:[{title:'Hướng dẫn sử dụng kháng sinh – Quyết định 708/QĐ-BYT',url:'https://kcb.vn/thu-vien-tai-lieu/tai-lieu-huong-dan-su-dung-khang-sinh.html'},...COMMON_SOURCES]
    }
  ];
})();
