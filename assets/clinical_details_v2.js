(function(){
  const D=window.VPMED_DRUGS||[];
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const IND={
    'amoxicillin clavulanate':[
      'Nhiễm khuẩn đường hô hấp trên: viêm xoang cấp do vi khuẩn, viêm tai giữa cấp và các nhiễm khuẩn tai–mũi–họng do chủng nhạy cảm.',
      'Nhiễm khuẩn đường hô hấp dưới: đợt cấp viêm phế quản mạn, viêm phổi mắc phải cộng đồng và các nhiễm khuẩn phế quản–phổi do chủng nhạy cảm.',
      'Nhiễm khuẩn đường tiết niệu: viêm bàng quang, viêm bể thận và các nhiễm khuẩn tiết niệu do vi khuẩn nhạy cảm.',
      'Nhiễm khuẩn da và mô mềm, bao gồm viêm mô tế bào, áp xe, vết thương nhiễm khuẩn và vết cắn động vật/người.',
      'Nhiễm khuẩn răng–hàm–mặt nặng có viêm mô tế bào lan rộng.',
      'Nhiễm khuẩn xương và khớp, đặc biệt viêm tủy xương, khi vi khuẩn nhạy cảm.',
      'Dạng tiêm có thể được dùng cho nhiễm khuẩn nặng, nhiễm khuẩn ổ bụng, đường mật, phụ khoa, nhiễm khuẩn huyết và dự phòng phẫu thuật khi phù hợp HDSD của chế phẩm.'
    ],
    'benzathine benzylpenicillin':[
      'Điều trị nhiễm liên cầu khuẩn nhóm A mức độ nhẹ đến vừa ở đường hô hấp trên, bao gồm viêm họng/amiđan do liên cầu khi phù hợp.',
      'Điều trị giang mai và các bệnh do xoắn khuẩn nhạy cảm theo phác đồ chuyên khoa.',
      'Dự phòng tái phát thấp tim và viêm cầu thận cấp sau nhiễm liên cầu theo phác đồ.',
      'Chỉ dùng đường tiêm bắp sâu; không dùng để điều trị nhiễm khuẩn nặng cần nồng độ penicillin cao tức thời.'
    ],
    'trimethoprim sulfamethoxazole':[
      'Nhiễm khuẩn đường tiết niệu do vi khuẩn nhạy cảm.',
      'Đợt cấp viêm phế quản mạn và viêm tai giữa cấp do chủng nhạy cảm khi có chỉ định.',
      'Điều trị và dự phòng viêm phổi do Pneumocystis jirovecii.',
      'Nhiễm khuẩn đường tiêu hóa do Shigella; tiêu chảy do một số tác nhân nhạy cảm theo hướng dẫn điều trị.',
      'Một số nhiễm khuẩn da và mô mềm do Staphylococcus aureus nhạy cảm, bao gồm MRSA cộng đồng, theo kháng sinh đồ/phác đồ.',
      'Nocardiosis và một số nhiễm khuẩn cơ hội khác theo phác đồ chuyên khoa.'
    ],
    'levofloxacin':[
      'Viêm phổi mắc phải cộng đồng và viêm phổi bệnh viện do vi khuẩn nhạy cảm, theo mức độ nặng và kháng sinh đồ.',
      'Đợt cấp do vi khuẩn của viêm phế quản mạn và viêm xoang cấp do vi khuẩn khi không có lựa chọn phù hợp hơn.',
      'Nhiễm khuẩn đường tiết niệu có biến chứng, viêm bể thận cấp và viêm tuyến tiền liệt mạn do vi khuẩn.',
      'Nhiễm khuẩn da và cấu trúc da có hoặc không biến chứng do chủng nhạy cảm.',
      'Dự phòng/điều trị sau phơi nhiễm bệnh than đường hô hấp và bệnh dịch hạch theo hướng dẫn chuyên môn.',
      'Chỉ dùng khi lợi ích vượt nguy cơ, đặc biệt với nhiễm khuẩn nhẹ có lựa chọn an toàn hơn.'
    ],
    'cefpodoxime':[
      'Viêm phổi mắc phải cộng đồng, đợt cấp viêm phế quản mạn và một số nhiễm khuẩn hô hấp do chủng nhạy cảm.',
      'Viêm họng/amiđan và viêm xoang cấp do vi khuẩn nhạy cảm khi phù hợp.',
      'Nhiễm khuẩn đường tiết niệu không biến chứng và một số trường hợp viêm bể thận theo phác đồ.',
      'Nhiễm khuẩn da và mô mềm không biến chứng do chủng nhạy cảm.',
      'Lậu cầu không biến chứng chỉ khi hướng dẫn hiện hành còn khuyến cáo và có dữ liệu nhạy cảm phù hợp.'
    ],
    'cefixime':[
      'Nhiễm khuẩn đường tiết niệu không biến chứng do vi khuẩn nhạy cảm.',
      'Viêm tai giữa, viêm họng/amiđan và đợt cấp viêm phế quản mạn do chủng nhạy cảm.',
      'Một số trường hợp viêm phổi mắc phải cộng đồng mức độ nhẹ theo phác đồ và dữ liệu nhạy cảm.',
      'Lậu cầu không biến chứng chỉ khi phù hợp hướng dẫn điều trị hiện hành và kết quả kháng sinh đồ.'
    ],
    'cefoperazone':[
      'Nhiễm khuẩn đường hô hấp, đường tiết niệu, da và mô mềm, xương khớp do vi khuẩn nhạy cảm.',
      'Nhiễm khuẩn ổ bụng, viêm phúc mạc, viêm đường mật và viêm túi mật.',
      'Nhiễm khuẩn huyết và các nhiễm khuẩn nặng do vi khuẩn Gram âm nhạy cảm.',
      'Nhiễm khuẩn phụ khoa và viêm vùng chậu do chủng nhạy cảm.',
      'Có thể phối hợp kháng sinh khác khi cần mở rộng phổ theo vị trí nhiễm và kháng sinh đồ.'
    ],
    'cefoxitin':[
      'Nhiễm khuẩn ổ bụng và phụ khoa do vi khuẩn nhạy cảm, bao gồm vi khuẩn kỵ khí.',
      'Nhiễm khuẩn da, mô mềm, xương khớp và đường tiết niệu do chủng nhạy cảm.',
      'Nhiễm khuẩn đường hô hấp dưới và nhiễm khuẩn huyết do vi khuẩn nhạy cảm.',
      'Dự phòng nhiễm khuẩn trong phẫu thuật tiêu hóa, phụ khoa và một số phẫu thuật có nguy cơ nhiễm vi khuẩn kỵ khí.',
      'Điều trị Mycobacterium abscessus chỉ trong phác đồ phối hợp chuyên khoa và theo kháng sinh đồ.'
    ],
    'ceftazidime':[
      'Nhiễm khuẩn nặng do vi khuẩn Gram âm nhạy cảm, đặc biệt Pseudomonas aeruginosa.',
      'Viêm phổi bệnh viện/thở máy, nhiễm khuẩn hô hấp dưới ở người bệnh nặng hoặc xơ nang.',
      'Nhiễm khuẩn huyết, viêm màng não do vi khuẩn Gram âm và nhiễm khuẩn ở người giảm bạch cầu trung tính.',
      'Nhiễm khuẩn đường tiết niệu có biến chứng, da–mô mềm, xương khớp và ổ bụng; phối hợp thuốc kháng kỵ khí khi cần.',
      'Viêm tai ngoài ác tính và các nhiễm khuẩn Pseudomonas khác theo kháng sinh đồ.'
    ],
    'imipenem cilastatin':[
      'Nhiễm khuẩn ổ bụng, hô hấp dưới, phụ khoa, da–mô mềm, xương khớp và đường tiết niệu có biến chứng do vi khuẩn nhạy cảm.',
      'Nhiễm khuẩn huyết và nhiễm khuẩn đa vi khuẩn nặng cần phổ rộng.',
      'Điều trị kinh nghiệm nhiễm khuẩn nặng ở người bệnh giảm bạch cầu trung tính theo phác đồ.',
      'Không ưu tiên điều trị viêm màng não vì nguy cơ co giật; chỉ dùng khi HDSD/phác đồ chuyên khoa cho phép.'
    ],
    'ciprofloxacin':[
      'Nhiễm khuẩn đường tiết niệu có/không biến chứng, viêm bể thận và viêm tuyến tiền liệt do vi khuẩn nhạy cảm.',
      'Nhiễm khuẩn đường hô hấp dưới do vi khuẩn Gram âm, đặc biệt Pseudomonas, khi phù hợp.',
      'Nhiễm khuẩn ổ bụng khi phối hợp thuốc kháng kỵ khí; nhiễm khuẩn da–mô mềm, xương khớp do chủng nhạy cảm.',
      'Tiêu chảy nhiễm khuẩn, thương hàn và một số nhiễm khuẩn đường tiêu hóa theo phác đồ.',
      'Dự phòng/điều trị sau phơi nhiễm bệnh than và bệnh dịch hạch theo hướng dẫn chuyên môn.',
      'Không dùng thường quy cho nhiễm khuẩn nhẹ khi còn lựa chọn an toàn hơn.'
    ],
    'colistin':[
      'Điều trị nhiễm khuẩn nặng do vi khuẩn Gram âm đa kháng còn nhạy cảm với colistin, như Acinetobacter baumannii, Pseudomonas aeruginosa và Enterobacterales kháng carbapenem.',
      'Chỉ sử dụng khi lựa chọn an toàn/hiệu quả hơn không phù hợp, dựa trên kháng sinh đồ, hội chẩn và phác đồ bệnh viện.',
      'Có thể dùng đơn trị hoặc phối hợp tùy vị trí nhiễm, mức độ nặng và bằng chứng hiện hành; phải quy đổi đúng đơn vị CMS/CBA/IU.'
    ],
    'fosfomycin iv':[
      'Nhiễm khuẩn nặng do vi khuẩn nhạy cảm, đặc biệt chủng đa kháng, khi các lựa chọn thông thường không phù hợp.',
      'Nhiễm khuẩn đường tiết niệu có biến chứng, viêm thận–bể thận, nhiễm khuẩn huyết, viêm nội tâm mạc, viêm xương tủy và nhiễm khuẩn hệ thần kinh trung ương theo phác đồ phối hợp.',
      'Nhiễm khuẩn hô hấp bệnh viện, da–mô mềm và ổ bụng do vi khuẩn nhạy cảm, thường phối hợp kháng sinh khác để hạn chế kháng thuốc.'
    ],
    'gentamicin':[
      'Nhiễm khuẩn Gram âm nặng, nhiễm khuẩn huyết, đường tiết niệu có biến chứng, ổ bụng, hô hấp dưới, da–mô mềm và xương khớp do chủng nhạy cảm.',
      'Phối hợp hiệp đồng trong viêm nội tâm mạc do Enterococcus hoặc Streptococcus theo phác đồ chuyên khoa.',
      'Không dùng đơn trị cho nhiễm khuẩn nặng ngoài đường tiết niệu; phải cá thể hóa theo cân nặng, CrCl và TDM.'
    ],
    'amikacin':[
      'Nhiễm khuẩn nặng do vi khuẩn Gram âm nhạy cảm, kể cả một số chủng kháng gentamicin/tobramycin.',
      'Nhiễm khuẩn huyết, viêm phổi bệnh viện/thở máy, nhiễm khuẩn ổ bụng, đường tiết niệu có biến chứng, da–mô mềm, xương khớp và bỏng nhiễm khuẩn.',
      'Điều trị phối hợp một số nhiễm Mycobacterium không lao và lao kháng thuốc theo phác đồ chuyên khoa.',
      'Phải cá thể hóa theo cân nặng, CrCl, vị trí nhiễm và TDM.'
    ],
    'meropenem':[
      'Viêm phổi mắc phải cộng đồng nặng, viêm phổi bệnh viện và viêm phổi liên quan thở máy do vi khuẩn nhạy cảm.',
      'Nhiễm khuẩn ổ bụng có biến chứng, nhiễm khuẩn da–mô mềm có biến chứng và nhiễm khuẩn đường tiết niệu có biến chứng.',
      'Viêm màng não do vi khuẩn và nhiễm khuẩn huyết liên quan các ổ nhiễm nhạy cảm.',
      'Điều trị kinh nghiệm người bệnh giảm bạch cầu trung tính có sốt theo phác đồ.',
      'Nhiễm khuẩn do vi khuẩn sinh ESBL hoặc đa kháng khi phù hợp kháng sinh đồ và chương trình quản lý kháng sinh.'
    ],
    'metronidazole':[
      'Nhiễm khuẩn do vi khuẩn kỵ khí tại ổ bụng, phụ khoa, da–mô mềm, xương khớp, thần kinh trung ương và nhiễm khuẩn huyết.',
      'Phối hợp trong điều trị viêm ruột thừa, viêm phúc mạc, áp xe ổ bụng và các nhiễm khuẩn hỗn hợp có thành phần kỵ khí.',
      'Điều trị nhiễm Trichomonas, amip, Giardia và một số nhiễm đơn bào theo phác đồ.',
      'Điều trị viêm đại tràng do Clostridioides difficile chỉ khi phù hợp hướng dẫn hiện hành.',
      'Dự phòng nhiễm khuẩn kỵ khí trong phẫu thuật đại–trực tràng và phụ khoa.'
    ],
    'moxifloxacin':[
      'Viêm phổi mắc phải cộng đồng, đợt cấp viêm phế quản mạn và viêm xoang cấp do vi khuẩn khi không có lựa chọn phù hợp hơn.',
      'Nhiễm khuẩn da–mô mềm có biến chứng và nhiễm khuẩn ổ bụng có biến chứng do chủng nhạy cảm.',
      'Không dùng cho nhiễm khuẩn tiết niệu vì nồng độ niệu không phù hợp.',
      'Chỉ dùng khi lợi ích vượt nguy cơ, đặc biệt ở người có nguy cơ kéo dài QT hoặc bệnh gân.'
    ],
    'ampicillin sulbactam':[
      'Nhiễm khuẩn đường hô hấp dưới, tai–mũi–họng, đường tiết niệu, da–mô mềm và xương khớp do vi khuẩn nhạy cảm.',
      'Nhiễm khuẩn ổ bụng, viêm phúc mạc, viêm túi mật và nhiễm khuẩn phụ khoa.',
      'Nhiễm khuẩn huyết, viêm phổi hít và vết cắn động vật/người theo phác đồ.',
      'Nhiễm Acinetobacter nhạy cảm với sulbactam có thể cần liều sulbactam cao theo phác đồ chuyên khoa.'
    ],
    'piperacillin tazobactam':[
      'Viêm phổi bệnh viện/thở máy và viêm phổi nặng do vi khuẩn Gram âm, bao gồm Pseudomonas aeruginosa nhạy cảm.',
      'Nhiễm khuẩn ổ bụng có biến chứng, viêm phúc mạc, viêm ruột thừa và nhiễm khuẩn đường mật.',
      'Nhiễm khuẩn đường tiết niệu có biến chứng, da–mô mềm có biến chứng, bàn chân đái tháo đường và nhiễm khuẩn huyết.',
      'Điều trị kinh nghiệm sốt giảm bạch cầu trung tính, thường phối hợp aminoglycosid tùy phác đồ.',
      'Nhiễm khuẩn đa vi khuẩn do chủng nhạy cảm, theo kháng sinh đồ và chương trình quản lý kháng sinh.'
    ],
    'cefotaxime':[
      'Nhiễm khuẩn hô hấp dưới, đường tiết niệu, da–mô mềm, xương khớp, ổ bụng và phụ khoa do vi khuẩn nhạy cảm.',
      'Nhiễm khuẩn huyết, viêm màng não do vi khuẩn và nhiễm lậu cầu khi phù hợp kháng sinh đồ/hướng dẫn.',
      'Nhiễm khuẩn ở trẻ sơ sinh và trẻ nhỏ theo chỉ định, liều và phác đồ chuyên khoa.',
      'Dự phòng phẫu thuật trong một số thủ thuật có nguy cơ nhiễm khuẩn.'
    ],
    'ceftriaxone':[
      'Viêm phổi mắc phải cộng đồng, viêm màng não do vi khuẩn, nhiễm khuẩn huyết và viêm nội tâm mạc do chủng nhạy cảm.',
      'Nhiễm khuẩn đường tiết niệu, ổ bụng, đường mật, da–mô mềm, xương khớp và phụ khoa; phối hợp metronidazol khi cần phủ kỵ khí.',
      'Lậu cầu, giang mai thần kinh và một số bệnh do Borrelia theo phác đồ chuyên khoa.',
      'Viêm tai giữa cấp và dự phòng phẫu thuật theo HDSD/phác đồ.',
      'Tuân thủ chống chỉ định liên quan trẻ sơ sinh tăng bilirubin máu và dung dịch calci đường tĩnh mạch.'
    ],
    'vancomycin':[
      'Nhiễm khuẩn Gram dương nặng do chủng nhạy cảm, đặc biệt MRSA: nhiễm khuẩn huyết, viêm nội tâm mạc, viêm phổi, viêm xương tủy và nhiễm khuẩn da–mô mềm nặng.',
      'Viêm màng não do Gram dương thường dùng phối hợp theo phác đồ.',
      'Điều trị nhiễm Enterococcus hoặc tụ cầu kháng beta-lactam khi phù hợp kháng sinh đồ.',
      'Đường uống dùng điều trị viêm đại tràng do Clostridioides difficile; dạng tiêm tĩnh mạch không đạt nồng độ điều trị trong lòng ruột.',
      'Liều tĩnh mạch phải dựa trên cân nặng, chức năng thận và TDM/AUC.'
    ]
  };
  function key(a,route){const x=norm(a),r=norm(route);
    if(/amoxic/.test(x)&&/clav/.test(x))return'amoxicillin clavulanate';
    if(/benzathin/.test(x))return'benzathine benzylpenicillin';
    if(/sulfamethoxazol/.test(x))return'trimethoprim sulfamethoxazole';
    if(/levofloxacin/.test(x))return'levofloxacin'; if(/cefpodoxim/.test(x))return'cefpodoxime'; if(/cefixim/.test(x))return'cefixime';
    if(/cefoperazon/.test(x))return'cefoperazone'; if(/cefoxitin/.test(x))return'cefoxitin'; if(/ceftazidim/.test(x))return'ceftazidime';
    if(/imipenem/.test(x))return'imipenem cilastatin'; if(/ciprofloxacin/.test(x))return'ciprofloxacin'; if(/colistin/.test(x))return'colistin';
    if(/fosfomycin/.test(x))return'fosfomycin iv'; if(/gentamicin/.test(x))return'gentamicin'; if(/amikacin/.test(x))return'amikacin';
    if(/meropenem/.test(x))return'meropenem'; if(/metronidazol/.test(x))return'metronidazole'; if(/moxifloxacin/.test(x))return'moxifloxacin';
    if(/ampicilin|ampicillin/.test(x)&&/sulbactam/.test(x))return'ampicillin sulbactam'; if(/piperacilin/.test(x))return'piperacillin tazobactam';
    if(/cefotaxim/.test(x))return'cefotaxime'; if(/ceftriaxon/.test(x))return'ceftriaxone'; if(/vancomycin/.test(x))return'vancomycin'; return'';
  }
  function infusion(a,route,strength){const x=norm(a),r=norm(route),s=String(strength||'');
    if(/uong/.test(r)) return {reconstitution:'Không áp dụng.',dilution:'Không áp dụng.',administration:'Dùng đường uống theo HDSD; lưu ý thời điểm với thức ăn và khoảng cách với thuốc/cation khi có.',line:'Không áp dụng đường truyền.',stability:'Bảo quản theo nhãn và HDSD của đúng chế phẩm.'};
    if(/levofloxacin/.test(x))return {reconstitution:'Dung dịch truyền 5 mg/mL thường là chế phẩm pha sẵn; không cần hoàn nguyên.',dilution:'Không pha loãng thêm trừ khi HDSD của đúng chế phẩm cho phép.',administration:'500 mg truyền ít nhất 60 phút; 750 mg truyền ít nhất 90 phút. Không tiêm tĩnh mạch nhanh/bolus.',line:'Dùng đường truyền tĩnh mạch riêng hoặc kiểm tra tương hợp trước khi dùng chung; không trộn với dung dịch có pH kiềm hoặc thuốc chưa xác nhận tương hợp.',stability:'Sử dụng và bảo quản theo thời hạn sau mở bao bì ghi trong HDSD.'};
    if(/amikacin/.test(x)&&/100ml/.test(norm(s)))return {reconstitution:'Chế phẩm 500 mg/100 mL là dung dịch pha sẵn; không cần hoàn nguyên.',dilution:'Không pha loãng thêm nếu HDSD không yêu cầu.',administration:'Truyền tĩnh mạch trong 30–60 phút ở người lớn; không tiêm bolus.',line:'Không trộn trực tiếp aminoglycosid với beta-lactam trong cùng chai/bơm tiêm; nếu dùng chung đường truyền phải súc rửa kỹ giữa các thuốc.',stability:'Dùng theo thời hạn sau mở túi/chai của nhà sản xuất; loại bỏ phần thừa.'};
    if(/gentamicin|amikacin/.test(x))return {reconstitution:'Nếu dạng bột: hoàn nguyên bằng dung môi và thể tích ghi trong HDSD. Nếu dung dịch tiêm: không cần hoàn nguyên.',dilution:'Pha loãng trong dung dịch tương hợp theo HDSD để đạt nồng độ truyền phù hợp.',administration:'Truyền tĩnh mạch 30–60 phút ở người lớn; đường tiêm bắp chỉ dùng khi HDSD cho phép.',line:'Không trộn trực tiếp với beta-lactam; súc rửa đường truyền giữa các thuốc.',stability:'Dùng trong thời gian ổn định sau pha của đúng chế phẩm.'};
    if(/vancomycin/.test(x))return {reconstitution:'Hoàn nguyên lọ bột bằng nước cất pha tiêm theo thể tích ghi trên HDSD để tạo dung dịch đậm đặc.',dilution:'Tiếp tục pha loãng bằng NaCl 0,9% hoặc glucose 5% đến nồng độ phù hợp; đường ngoại vi thường cần nồng độ thấp hơn đường trung tâm.',administration:'Truyền không quá 10 mg/phút; mỗi liều tối thiểu 60 phút, liều >1 g thường cần kéo dài hơn để giảm phản ứng liên quan truyền.',line:'Ưu tiên đường riêng. Không dùng chung với thuốc không tương hợp; súc rửa đường truyền trước/sau.',stability:'Tuân thủ thời gian ổn định của dung dịch hoàn nguyên và dung dịch đã pha loãng trong HDSD.'};
    if(/meropenem/.test(x))return {reconstitution:'Hoàn nguyên lọ bột bằng nước cất pha tiêm hoặc dung môi được HDSD cho phép.',dilution:'Pha tiếp bằng NaCl 0,9% hoặc dung dịch tương hợp theo HDSD nếu truyền tĩnh mạch.',administration:'Truyền thường 15–30 phút; truyền kéo dài khoảng 3 giờ chỉ áp dụng khi có phác đồ bệnh viện và dữ liệu ổn định phù hợp.',line:'Không trộn chung với thuốc khác khi chưa xác nhận tương hợp; dùng đường riêng hoặc súc rửa đường truyền.',stability:'Độ ổn định phụ thuộc dung môi, nồng độ và nhiệt độ; phải dùng trong thời gian HDSD quy định.'};
    if(/imipenem/.test(x))return {reconstitution:'Hoàn nguyên bằng dung môi được HDSD cho phép; không dùng dung môi chứa lactat nếu chế phẩm không cho phép.',dilution:'Pha loãng đến nồng độ truyền theo HDSD.',administration:'Liều ≤500 mg thường truyền 20–30 phút; liều >500 mg truyền 40–60 phút. Giảm tốc độ nếu buồn nôn.',line:'Không trộn trực tiếp với kháng sinh khác; kiểm tra tương hợp và súc rửa đường truyền.',stability:'Dùng trong thời gian ổn định sau pha theo HDSD.'};
    if(/piperacilin/.test(x))return {reconstitution:'Hoàn nguyên lọ bột bằng nước cất pha tiêm hoặc NaCl 0,9% theo thể tích HDSD.',dilution:'Pha tiếp bằng dung dịch tương hợp đến thể tích/nồng độ truyền phù hợp.',administration:'Truyền chuẩn khoảng 30 phút; truyền kéo dài 3–4 giờ chỉ theo phác đồ PK/PD đã phê duyệt.',line:'Không trộn trực tiếp với aminoglycosid; nếu dùng chung đường truyền cần dùng riêng thời điểm và súc rửa.',stability:'Tuân thủ thời gian ổn định theo dung môi và điều kiện bảo quản của đúng chế phẩm.'};
    if(/ceftriaxon/.test(x))return {reconstitution:'Hoàn nguyên bằng dung môi phù hợp với đường tiêm. Lidocain chỉ dùng hoàn nguyên để tiêm bắp khi HDSD cho phép.',dilution:'Để truyền tĩnh mạch, pha tiếp bằng dung dịch không chứa calci được HDSD cho phép.',administration:'Truyền khoảng 30 phút; không tiêm tĩnh mạch dung dịch có lidocain.',line:'Không pha hoặc dùng đồng thời trong cùng đường truyền với dung dịch chứa calci. Tuân thủ chống chỉ định ở trẻ sơ sinh.',stability:'Dùng trong thời gian ổn định sau pha; quan sát màu và tiểu phân trước dùng.'};
    if(/ceftazidim|cefotaxim|cefoxitin|cefoperazon/.test(x))return {reconstitution:'Hoàn nguyên lọ bột bằng nước cất pha tiêm hoặc dung môi được HDSD cho phép.',dilution:'Nếu truyền, pha tiếp bằng NaCl 0,9%, glucose 5% hoặc dung dịch tương hợp được nhà sản xuất công bố.',administration:'Tiêm tĩnh mạch chậm hoặc truyền khoảng 15–30 phút tùy hoạt chất, liều và HDSD.',line:'Không trộn trực tiếp với aminoglycosid hoặc thuốc khác khi chưa có dữ liệu tương hợp; dùng đường riêng hoặc súc rửa.',stability:'Tuân thủ thời gian ổn định theo dung môi, nồng độ, nhiệt độ và ánh sáng của đúng chế phẩm.'};
    if(/ampicilin|ampicillin/.test(x)&&/sulbactam/.test(x))return {reconstitution:'Hoàn nguyên lọ bột bằng nước cất pha tiêm hoặc dung môi phù hợp theo HDSD.',dilution:'Pha tiếp bằng dung dịch tương hợp nếu truyền tĩnh mạch.',administration:'Tiêm tĩnh mạch chậm hoặc truyền 15–30 phút theo HDSD.',line:'Không trộn trực tiếp với aminoglycosid; dùng khác thời điểm và súc rửa đường truyền.',stability:'Dùng trong thời gian ổn định sau pha của đúng chế phẩm.'};
    if(/amoxic/.test(x)&&/clav/.test(x))return {reconstitution:'Hoàn nguyên lọ bột bằng nước cất pha tiêm theo thể tích HDSD; dùng ngay sau hoàn nguyên trong giới hạn ổn định.',dilution:'Nếu truyền, pha tiếp bằng dung dịch tương hợp được HDSD cho phép.',administration:'Tiêm tĩnh mạch chậm hoặc truyền khoảng 30–40 phút tùy chế phẩm; không tiêm bắp nếu HDSD không cho phép.',line:'Không trộn chung với aminoglycosid trong cùng chai/bơm tiêm/đường truyền; súc rửa giữa các thuốc.',stability:'Clavulanat kém ổn định; tuân thủ nghiêm thời gian sử dụng sau pha.'};
    if(/metronidazol/.test(x))return {reconstitution:'Dung dịch truyền thường pha sẵn; không cần hoàn nguyên.',dilution:'Không pha loãng thêm trừ khi HDSD cho phép.',administration:'Truyền trong khoảng 20–60 phút; không tiêm bolus.',line:'Kiểm tra tương hợp trước khi dùng chung; ưu tiên đường riêng hoặc súc rửa.',stability:'Dùng theo thời hạn sau mở bao bì và bảo quản tránh ánh sáng theo HDSD.'};
    if(/moxifloxacin/.test(x))return {reconstitution:'Dung dịch truyền pha sẵn; không cần hoàn nguyên.',dilution:'Không pha loãng thêm nếu HDSD không yêu cầu.',administration:'Truyền 400 mg trong 60 phút; không tiêm bolus.',line:'Không trộn chung với thuốc/dung dịch chưa xác nhận tương hợp; dùng đường riêng hoặc súc rửa.',stability:'Dùng theo thời hạn sau mở bao bì của nhà sản xuất.'};
    if(/ciprofloxacin/.test(x))return {reconstitution:'Dung dịch truyền thường pha sẵn; không cần hoàn nguyên.',dilution:'Không pha loãng thêm trừ khi HDSD cho phép.',administration:'400 mg truyền khoảng 60 phút; 200 mg ít nhất 30 phút. Không tiêm bolus.',line:'Không trộn với dung dịch kiềm hoặc thuốc chưa xác nhận tương hợp; dùng đường riêng hoặc súc rửa.',stability:'Tuân thủ thời hạn sau mở và điều kiện ánh sáng theo HDSD.'};
    if(/fosfomycin/.test(x))return {reconstitution:'Hoàn nguyên lọ bột bằng nước cất pha tiêm theo thể tích HDSD.',dilution:'Pha tiếp bằng glucose 5% hoặc dung dịch tương hợp được HDSD cho phép đến thể tích truyền.',administration:'Truyền chậm, thường trong 1–2 giờ tùy liều.',line:'Không trộn với thuốc khác khi chưa xác nhận tương hợp; theo dõi tải natri, kali và dịch.',stability:'Dùng trong thời gian ổn định sau pha theo HDSD.'};
    if(/colistin/.test(x))return {reconstitution:'Hoàn nguyên colistimethate sodium đúng thể tích và đơn vị theo HDSD; tránh nhầm IU với mg CBA.',dilution:'Pha tiếp bằng dung dịch tương hợp đến thể tích truyền phù hợp.',administration:'Truyền thường 30–60 phút; không tiêm nhanh.',line:'Không trộn chung với thuốc khác khi chưa có dữ liệu tương hợp; dùng đường riêng hoặc súc rửa.',stability:'Dung dịch sau pha có thể kém ổn định; dùng ngay hoặc trong thời gian HDSD quy định.'};
    if(/benzathin/.test(x))return {reconstitution:'Nếu dạng bột/hỗn dịch: hoàn nguyên/lắc theo HDSD để tạo hỗn dịch đồng nhất.',dilution:'Không pha truyền tĩnh mạch.',administration:'Chỉ tiêm bắp sâu bằng kim phù hợp; tuyệt đối không tiêm tĩnh mạch, trong hoặc gần động mạch.',line:'Không áp dụng đường truyền.',stability:'Dùng ngay sau chuẩn bị theo HDSD.'};
    return {reconstitution:'Hoàn nguyên theo đúng dung môi và thể tích ghi trong HDSD của chế phẩm.',dilution:'Pha loãng bằng dung dịch tương hợp và đến nồng độ được nhà sản xuất công bố.',administration:'Tiêm/truyền theo thời gian và tốc độ ghi trong HDSD.',line:'Không trộn chung hoặc dùng chung đường truyền khi chưa xác nhận tương hợp; súc rửa khi cần.',stability:'Tuân thủ thời gian ổn định sau pha, điều kiện bảo quản và giới hạn ánh sáng/nhiệt độ.'};
  }
  D.forEach(d=>{const k=key(d.active,d.route); if(k&&IND[k])d.indicationsDetailed=IND[k]; d.infusionStructured=infusion(d.active,d.route,d.strength); d.indicationSource='Tờ HDSD được Cục Quản lý Dược phê duyệt; Dược thư Quốc gia Việt Nam; hướng dẫn chẩn đoán và điều trị của Bộ Y tế. Phạm vi áp dụng phải đối chiếu đúng số đăng ký, dạng bào chế và đường dùng của chế phẩm.';});
})();
