(() => {
  "use strict";

  const drugs = [
    ["Hapacol 250","Paracetamol","Cao","Độc gan phụ thuộc tổng liều paracetamol trong 24 giờ. Người lớn không vượt liều tối đa theo HDSD; cảnh giác khi > 4.000 mg/ngày, uống cấp khoảng ≥ 7,5–10 g hoặc ≥ 150 mg/kg.","Tính tổng liều từ mọi chế phẩm chứa paracetamol; kiểm tra AST/ALT, bilirubin, INR/PT và xử trí sớm khi nghi quá liều."],
    ["Paracetamol 10 mg/ml","Paracetamol","Cao","Nguy cơ hoại tử gan/suy gan cấp khi vượt tổng liều an toàn. Với đường tiêm, vẫn cộng vào tổng liều paracetamol/ngày; không tách riêng đường dùng.","Không chờ men gan tăng nếu nghi quá liều; đánh giá thời điểm dùng, tổng liều, cân nặng và cân nhắc N-acetylcystein theo phác đồ."],
    ["Para-OPC 150 mg","Paracetamol","Cao","Nguy cơ tăng khi dùng trùng nhiều thuốc cảm cúm/giảm đau cùng chứa paracetamol. Cần cộng tổng liều 24 giờ, đặc biệt ở người uống rượu, suy dinh dưỡng hoặc bệnh gan nền.","Dặn không tự phối hợp nhiều chế phẩm; kiểm tra men gan khi dùng kéo dài hoặc có buồn nôn, đau hạ sườn phải, vàng da."],
    ["Partamol 500 Cap","Paracetamol","Cao","Mỗi viên 500 mg dễ vượt liều nếu uống nhiều lần hoặc phối hợp thuốc cảm. Không vượt tổng liều/ngày theo HDSD; cảnh giác khi > 4.000 mg/ngày ở người lớn.","Rà soát số viên/ngày và thuốc phối hợp; báo bác sĩ khi nghi uống quá liều hoặc xuất hiện triệu chứng gan mật."],
    ["Axuka","Amoxicillin + acid clavulanic","Cao","Không có ngưỡng liều độc gan cố định; thường là phản ứng đặc ứng. Nguy cơ tăng khi dùng liều cao, kéo dài, lặp lại nhiều đợt hoặc người từng vàng da do amoxicillin/clavulanate.","Không dùng lại nếu từng vàng da/rối loạn chức năng gan do thuốc này; theo dõi vàng da, ngứa, bilirubin, ALP/GGT."],
    ["Curam 625 mg","Amoxicillin + acid clavulanic","Cao","Cần dùng đúng liều và thời gian theo chỉ định; không tự kéo dài đợt điều trị. Độc gan có thể xuất hiện muộn, kể cả sau khi ngừng thuốc.","Theo dõi vàng da, nước tiểu sẫm, ngứa; kiểm tra men gan/bilirubin nếu điều trị kéo dài hoặc có triệu chứng."],
    ["Koact 625","Amoxicillin + acid clavulanic","Cao","Không có liều ngưỡng rõ; nguy cơ tăng khi dùng lặp lại nhiều đợt hoặc kéo dài hơn cần thiết.","Ngừng và đánh giá khi xuất hiện vàng da, nước tiểu sẫm, ngứa lan tỏa hoặc bilirubin/ALP tăng."],
    ["Dalekine","Valproat natri","Cao","Độc gan có thể xảy ra trong liều điều trị; nguy cơ tăng khi khởi trị/tăng liều nhanh, đa trị liệu chống động kinh, bệnh gan nền hoặc rối loạn chuyển hóa. Không vượt liều theo cân nặng/HDSD.","Theo dõi AST/ALT, bilirubin; kiểm tra amoniac khi buồn ngủ, nôn, lơ mơ hoặc rối loạn ý thức."],
    ["Methotrexat","Methotrexat","Cao","Cần phân biệt liều thấp hằng tuần với liều cao ung bướu. Dùng nhầm hằng ngày thay vì hằng tuần có thể gây độc tính nặng; nguy cơ gan tăng khi dùng kéo dài/tổng liều tích lũy cao.","Theo dõi AST/ALT, albumin, công thức máu và thận theo phác đồ; tránh rượu và rà soát tương tác làm tăng methotrexat."],
    ["Spulit","Itraconazol","Cao","Không có ngưỡng liều độc gan cố định; nguy cơ tăng khi dùng liều cao, kéo dài nhiều ngày–nhiều tuần hoặc phối hợp thuốc làm tăng nồng độ azol.","Có xét nghiệm nền nếu điều trị kéo dài; theo dõi AST/ALT, bilirubin và rà soát tương tác CYP."],
    ["Hadugut 300","Allopurinol","Cao","Không phải độc gan phụ thuộc liều đơn thuần. Nguy cơ quá mẫn/DRESS tăng khi khởi liều cao, suy thận không hiệu chỉnh liều hoặc dùng kèm thiazid.","Khởi liều thấp và tăng từ từ theo chỉ định; ngừng/báo bác sĩ khi sốt, phát ban, phù mặt, vàng da."],
    ["Diclofenac","Diclofenac","Cao","Nguy cơ tăng khi dùng liều cao, vượt liều tối đa/ngày hoặc dùng kéo dài nhiều tuần–tháng. Tránh phối hợp nhiều NSAID.","Theo dõi AST/ALT khi dùng kéo dài hoặc có bệnh gan nền; ngừng và báo bác sĩ khi mệt nhiều, vàng da hoặc men gan tăng."],
    ["Veltaron TTKN-25","Diclofenac natri","Cao","Dù dùng đường đặt vẫn có hấp thu toàn thân; nguy cơ tăng khi dùng liều cao/kéo dài hoặc phối hợp NSAID khác.","Không bỏ qua tổng liều diclofenac/ngày; theo dõi triệu chứng gan và men gan khi dùng kéo dài."],
    ["Biseptol 480","Sulfamethoxazol + trimethoprim","Cao","Không có ngưỡng liều độc gan cố định; thường liên quan quá mẫn. Nguy cơ tăng khi dùng kéo dài, suy thận không hiệu chỉnh liều hoặc người cao tuổi/suy giảm miễn dịch.","Dùng đúng liều theo chức năng thận; báo bác sĩ khi sốt, ban da, vàng da hoặc tăng men gan."],
    ["Ocebiso SYT-25","Sulfamethoxazol + trimethoprim","Cao","Nguy cơ độc gan có thể đi kèm phản ứng quá mẫn; cần chú ý khi dùng nhiều ngày hoặc bệnh nhân suy thận.","Theo dõi lâm sàng, công thức máu, creatinin và chức năng gan khi có triệu chứng hoặc điều trị kéo dài."],
    ["BFS-Amiron","Amiodaron","Cao","Nguy cơ liên quan phơi nhiễm tích lũy: dùng liều duy trì kéo dài nhiều tháng–năm có thể tăng men gan/xơ hóa; truyền tĩnh mạch hiếm gây tổn thương gan cấp.","Theo dõi AST/ALT định kỳ; báo bác sĩ nếu men gan tăng cấp sau truyền, tụt huyết áp, vàng da hoặc INR tăng."],
    ["Tazopelin 4,5 g","Piperacillin + tazobactam","Trung bình–cao","Không có liều ngưỡng độc gan cố định; nguy cơ tăng khi dùng liều cao, điều trị kéo dài hoặc người bệnh nặng/suy gan mật. Cần hiệu chỉnh theo thận khi có chỉ định.","Theo dõi AST/ALT, ALP/GGT, bilirubin khi dùng kéo dài; đánh giá ban, sốt, bạch cầu ái toan nếu nghi DRESS."],
    ["Bredomax 300","Fenofibrat","Trung bình–cao","Nguy cơ tăng men gan cao hơn khi dùng kéo dài, phối hợp statin, uống rượu hoặc có bệnh gan nền. Không vượt liều tối đa theo HDSD.","Theo dõi men gan định kỳ; ngừng/đánh giá khi tăng kéo dài hoặc có vàng da, đau hạ sườn phải."],
    ["Atoris 10 mg","Atorvastatin","Theo dõi","Nguy cơ tăng khi dùng liều cao, có tương tác làm tăng nồng độ statin, uống rượu hoặc bệnh gan nền; tổn thương gan nặng hiếm.","Kiểm tra men gan khi có triệu chứng hoặc yếu tố nguy cơ; không ngừng chỉ vì tăng nhẹ đơn độc."],
    ["Lovastatin DWP 10 mg","Lovastatin","Theo dõi","Nguy cơ tăng khi dùng liều cao hoặc phối hợp thuốc ức chế chuyển hóa làm tăng nồng độ lovastatin.","Rà soát tương tác trước khi tăng liều; kiểm tra chức năng gan khi mệt nhiều, vàng da hoặc nước tiểu sẫm."],
    ["Pms-Rosuvastatin QG-25","Rosuvastatin","Theo dõi","Tăng men gan nhẹ có thể gặp; nguy cơ tăng khi dùng liều cao, uống rượu, bệnh gan nền hoặc phối hợp thuốc ảnh hưởng nồng độ.","Đánh giá khi mệt nhiều, vàng da, đau hạ sườn phải hoặc men gan tăng dai dẳng."],
    ["Garnotal","Phenobarbital","Theo dõi","Không có ngưỡng liều độc gan cố định; thường liên quan phản ứng quá mẫn trong giai đoạn đầu điều trị hoặc sau tăng liều.","Theo dõi sốt, phát ban, hạch, vàng da; kiểm tra men gan và công thức máu khi nghi quá mẫn."],
    ["Garnotal 10","Phenobarbital","Theo dõi","Nguy cơ gan thường đi kèm phản ứng toàn thân, không đơn thuần do vượt liều.","Báo bác sĩ khi phát ban, sốt, phù mặt, vàng da hoặc tổn thương đa cơ quan."],
    ["Ciproven 10 mg/ml","Ciprofloxacin","Theo dõi","DILI hiếm, thường đặc ứng, không có ngưỡng liều cố định; cảnh giác hơn khi dùng liều cao, kéo dài hoặc người bệnh gan nền.","Không kéo dài khi không cần thiết; kiểm tra chức năng gan khi vàng da, nước tiểu sẫm hoặc men gan tăng nhanh."],
    ["Tamisynt 500 mg","Ciprofloxacin","Theo dõi","Nguy cơ hiếm nhưng có thể khởi phát nhanh; dùng đúng liều/thời gian và hiệu chỉnh theo chức năng thận khi cần.","Theo dõi triệu chứng trong và sau đợt điều trị; ngừng/báo bác sĩ khi có vàng da hoặc men gan tăng rõ."],
    ["Bivelox I.V","Levofloxacin","Theo dõi","Không có ngưỡng độc gan cố định; nguy cơ cần cảnh giác khi dùng liều cao/kéo dài, người cao tuổi hoặc bệnh gan nền.","Cân nhắc thuốc khác nếu từng DILI do fluoroquinolon; theo dõi triệu chứng gan mật."],
    ["Levofloxacin Kabi","Levofloxacin","Theo dõi","Dùng đúng liều theo chức năng thận; quá liều/kéo dài có thể làm tăng phơi nhiễm và nguy cơ ADR, dù DILI thường đặc ứng.","Kiểm tra men gan/bilirubin nếu có mệt nhiều, vàng da, nước tiểu sẫm hoặc đau hạ sườn phải."],
    ["Ozanier 500 mg","Levofloxacin","Theo dõi","Nguy cơ hiếm, có thể xuất hiện sớm; không tự kéo dài đơn hoặc dùng vượt liều.","Theo dõi lâm sàng ở người bệnh có bệnh gan nền hoặc phối hợp nhiều thuốc độc gan."],
    ["Moxifloxacin IMP 400 mg/250 ml","Moxifloxacin","Theo dõi","DILI hiếm nhưng có thể nặng; không có liều ngưỡng cố định. Thận trọng ở suy gan nặng và khi dùng kèm thuốc độc gan.","Báo bác sĩ khi vàng da, men gan tăng nhanh hoặc triệu chứng toàn thân không giải thích được."],
    ["Metronidazol 0,5 g/100 ml","Metronidazol","Hiếm","Nguy cơ DILI thấp; cần thận trọng khi dùng liều cao, kéo dài hoặc bệnh gan nặng. Với suy gan nặng cần cân nhắc giảm/giãn liều theo HDSD.","Theo dõi AST/ALT, bilirubin khi dùng kéo dài hoặc có triệu chứng gan mật."],
    ["Metronidazol 250","Metronidazol","Hiếm","Không có ngưỡng độc gan cố định; nguy cơ tăng khi dùng kéo dài, phối hợp nhiều thuốc hoặc bệnh gan nặng.","Ngừng/đánh giá khi vàng da, nước tiểu sẫm, buồn nôn nhiều hoặc men gan tăng rõ."],
    ["Daphazyl","Spiramycin + metronidazol","Theo dõi","Nguy cơ chủ yếu cần chú ý ở metronidazol khi dùng kéo dài/liều cao hoặc bệnh gan nặng; không tự kéo dài đợt dùng.","Theo dõi triệu chứng gan mật; kiểm tra men gan nếu điều trị kéo dài hoặc có bệnh gan nền."],
    ["Nerusyn 1,5 g","Ampicillin + sulbactam","Theo dõi","Nguy cơ thấp; không có liều ngưỡng cố định. Cảnh giác khi dùng liều cao/kéo dài, người bệnh nặng hoặc suy gan mật.","Theo dõi chức năng gan khi điều trị kéo dài; đánh giá khi vàng da hoặc ngứa."],
    ["Unasyn","Ampicillin + sulbactam","Theo dõi","Dùng đúng liều và thời gian theo chỉ định; nguy cơ tăng khi điều trị kéo dài hoặc có bệnh gan mật nền.","Kiểm tra AST/ALT, bilirubin khi có triệu chứng hoặc dùng kéo dài."],
    ["Medivernol 1 g","Ceftriaxon","Theo dõi","Liều cao hoặc dùng kéo dài có thể liên quan bùn mật/ứ mật, nhất là bệnh nhân dinh dưỡng kém, nằm viện lâu hoặc có bệnh gan mật.","Theo dõi đau hạ sườn phải, vàng da, bilirubin; cân nhắc siêu âm khi nghi bùn mật/giả sỏi mật."],
    ["Cefoperazone 1000","Cefoperazon","Theo dõi","Nguy cơ tăng phơi nhiễm khi bệnh gan/tắc mật; cần thận trọng liều ở người suy gan nặng hoặc phối hợp suy thận.","Theo dõi chức năng gan và INR ở người bệnh nguy cơ; báo bác sĩ khi vàng da/chảy máu bất thường."],
    ["Agilecox 200","Celecoxib","Hiếm","DILI hiếm; nguy cơ tăng khi dùng liều cao, kéo dài hoặc phối hợp nhiều NSAID/thuốc độc gan.","Dùng liều thấp nhất có hiệu quả trong thời gian ngắn nhất; ngừng khi có vàng da hoặc men gan tăng đáng kể."],
    ["Ibupain","Ibuprofen","Hiếm","Tổn thương gan hiếm; nguy cơ tăng khi vượt liều tối đa/ngày, dùng kéo dài hoặc phối hợp nhiều NSAID.","Theo dõi ở người bệnh dùng kéo dài, bệnh gan nền hoặc phối hợp thuốc độc gan."],
    ["Ibuprofen S DWP 150 mg","Ibuprofen","Hiếm","Nguy cơ thấp khi dùng ngắn ngày đúng liều; tăng khi dùng kéo dài/vượt liều hoặc phối hợp NSAID khác.","Theo dõi theo triệu chứng; báo bác sĩ khi vàng da, mệt nhiều hoặc đau hạ sườn phải."],
    ["Ketoprofen EC DWP 100 mg","Ketoprofen","Hiếm","Nguy cơ tăng khi dùng liều cao, kéo dài hoặc phối hợp nhiều NSAID; tránh vượt liều tối đa theo HDSD.","Hạn chế thời gian dùng; kiểm tra men gan khi có triệu chứng hoặc dùng kéo dài."],
    ["Ketorolac-BFS","Ketorolac","Hiếm","Không dùng kéo dài; nguy cơ ADR toàn thân tăng rõ khi vượt thời gian/liều khuyến cáo. Cần tuân thủ HDSD về thời gian dùng tối đa.","Theo dõi nếu có bệnh gan nền; báo bác sĩ khi vàng da hoặc men gan tăng."],
    ["Aspirin tab DWP 100 mg","Acetylsalicylic acid","Hiếm","Liều chống kết tập 100 mg/ngày ít liên quan độc gan; độc gan chủ yếu gặp ở liều cao hơn hoặc dùng kéo dài liều chống viêm.","Rà soát tổng liều aspirin, rượu và bệnh gan nền; theo dõi khi có triệu chứng gan mật."],
    ["Endoxan 200 mg","Cyclophosphamid","Hóa trị","Liều gây độc gan phụ thuộc phác đồ; nguy cơ tăng ở liều cao, hóa trị liều cao/ghép tế bào gốc hoặc bệnh gan nền.","Theo dõi chức năng gan theo phác đồ hóa trị; hiệu chỉnh/trì hoãn theo bác sĩ ung bướu khi bất thường."],
    ["Doxorubicin Bidiphar 50","Doxorubicin","Hóa trị","Không dùng liều chuẩn khi bilirubin tăng. Liều cần hiệu chỉnh theo bilirubin/chức năng gan và phác đồ chuyên khoa.","Kiểm tra bilirubin, AST/ALT trước chu kỳ; báo bác sĩ ung bướu để hiệu chỉnh khi chức năng gan bất thường."],
    ["Doxorubicin DV-26","Doxorubicin","Hóa trị","Phơi nhiễm và độc tính tăng khi suy gan; liều phụ thuộc bilirubin và phác đồ, không áp dụng một ngưỡng chung.","Đánh giá chức năng gan trước mỗi chu kỳ; không tự động dùng liều chuẩn nếu bilirubin/men gan tăng."],
    ["Epirubicin Bidiphar 50","Epirubicin","Hóa trị","Thải trừ qua gan; độc tính tăng khi bilirubin tăng hoặc suy gan. Cần hiệu chỉnh theo HDSD/phác đồ.","Kiểm tra bilirubin, AST/ALT trước điều trị; phối hợp bác sĩ ung bướu khi cần giảm liều/trì hoãn."],
    ["Bestdocel 80 mg/4 ml","Docetaxel","Hóa trị","Độc tính tăng rõ khi chức năng gan bất thường; không dùng hoặc hiệu chỉnh khi bilirubin/men gan vượt tiêu chuẩn HDSD/phác đồ.","Kiểm tra bilirubin, AST/ALT, ALP trước mỗi chu kỳ; báo bác sĩ nếu bất thường để tránh dùng liều chuẩn."],
    ["Canpaxel 250","Paclitaxel","Hóa trị","Phơi nhiễm tăng khi suy gan; liều paclitaxel cần dựa vào bilirubin/transaminase và phác đồ.","Theo dõi trước mỗi chu kỳ; hiệu chỉnh/trì hoãn theo tiêu chuẩn ung bướu khi bilirubin hoặc AST/ALT tăng."],
    ["Paclitaxel Ebewe","Paclitaxel","Hóa trị","Không có ngưỡng độc gan chung; nguy cơ tăng khi suy gan làm giảm thải trừ thuốc.","Kiểm tra bilirubin và men gan trước truyền; không tự dùng liều chuẩn nếu có suy gan."],
    ["Kpec 500","Capecitabin","Hóa trị","Có thể tăng bilirubin/men gan; liều và tạm ngừng phụ thuộc mức độ độc tính và phác đồ.","Theo dõi chức năng gan định kỳ; báo bác sĩ ung bướu khi bilirubin tăng hoặc vàng da."],
    ["Lyoxatin 50/100 mg","Oxaliplatin","Hóa trị","Nguy cơ tổn thương xoang gan liên quan tích lũy qua nhiều chu kỳ; không có liều ngưỡng đơn lẻ.","Theo dõi tiểu cầu, lách to, men gan và dấu hiệu tăng áp cửa theo phác đồ."],
    ["Oxaliplatin Ebewe","Oxaliplatin","Hóa trị","Nguy cơ tăng theo số chu kỳ/tổng phơi nhiễm; cần đánh giá chức năng gan và dấu hiệu tăng áp cửa.","Theo dõi theo phác đồ ung bướu; báo bác sĩ khi tiểu cầu giảm kéo dài, lách to hoặc men gan bất thường."],
    ["Bocartin 150","Carboplatin","Hóa trị","Tăng men gan thường nhẹ; liều chủ yếu dựa vào thận nhưng vẫn cần theo dõi gan trong phác đồ phối hợp.","Theo dõi chức năng gan trong phác đồ; đánh giá thuốc phối hợp nếu men gan tăng."],
    ["Sevoflurane 250 ml","Sevofluran","Hiếm","Viêm gan do thuốc mê hô hấp rất hiếm, không có ngưỡng liều cố định; nguy cơ cao hơn nếu từng viêm gan sau thuốc mê halogen.","Đánh giá nếu sốt, vàng da hoặc tăng men gan sau gây mê; ghi nhận tiền sử phản ứng với thuốc mê."],
    ["Suprane DV-26","Desfluran","Hiếm","Tổn thương gan miễn dịch rất hiếm; không phụ thuộc liều rõ ràng, cần chú ý tiền sử viêm gan do thuốc mê halogen.","Báo bác sĩ gây mê/hồi sức khi vàng da hoặc tăng men gan sau phẫu thuật/gây mê."],
    ["Fresofol 1%","Propofol","Hiếm","DILI hiếm; truyền liều cao kéo dài trong hồi sức có nguy cơ hội chứng truyền propofol. Cần tuân thủ giới hạn liều/tốc độ/thời gian theo phác đồ hồi sức.","Khi truyền kéo dài: theo dõi lactat, CK, triglycerid, men gan, huyết động; báo bác sĩ khi nghi hội chứng truyền propofol."],
    ["MG-TAN INJ","Acid amin + glucose + lipid","Theo dõi","Nguy cơ liên quan tổng năng lượng, glucose/lipid và thời gian nuôi dưỡng tĩnh mạch; tăng khi nuôi dưỡng kéo dài, thừa năng lượng hoặc nhiễm trùng/ứ mật.","Tính liều dinh dưỡng theo cân nặng và bệnh cảnh; theo dõi AST/ALT, ALP/GGT, bilirubin, triglycerid, glucose."],
    ["Vaminolact","Acid amin + glucose + lipid","Theo dõi","Nguy cơ rối loạn chức năng gan tăng khi nuôi dưỡng tĩnh mạch kéo dài hoặc không có nuôi dưỡng đường ruột.","Đánh giá tổng năng lượng, tỷ lệ glucose/lipid, nhiễm trùng và thời gian nuôi dưỡng; theo dõi bilirubin/ALP."],
    ["Smoflipid","Nhũ dịch lipid","Theo dõi","Nguy cơ tăng khi dùng lipid kéo dài, triglycerid cao, quá tải năng lượng hoặc ứ mật; liều lipid cần tính theo cân nặng và triglycerid.","Theo dõi triglycerid và chức năng gan; báo bác sĩ khi triglycerid cao, bilirubin/ALP tăng hoặc nghi quá tải năng lượng."]
  ].map(([name, active, level, risk, monitor], id) => ({id:id+1,name,active,level,risk,monitor}));

  const $ = (id) => document.getElementById(id);
  const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

  function levelClass(level){
    if(level === "Cao") return "high";
    if(level === "Trung bình–cao") return "medium-high";
    if(level === "Hóa trị") return "chemo";
    if(level === "Theo dõi") return "monitor";
    return "rare";
  }

  function matchesLevel(item, selected){
    if(!selected) return true;
    return item.level === selected;
  }

  function drugProfile(d){
    const a = norm(d.active);
    const has = (...terms) => terms.some(t => a.includes(norm(t)));
    const base = {
      pattern: "Không có ngưỡng liều gây độc gan cố định. Độc gan thường là phản ứng đặc ứng, có thể xảy ra dù dùng đúng liều; nguy cơ tăng khi dùng quá liều so với HDSD, dùng kéo dài, phối hợp nhiều thuốc độc gan, người bệnh có bệnh gan nền, uống rượu, suy dinh dưỡng hoặc suy thận/suy đa cơ quan.",
      labs: "Có xét nghiệm nền nếu điều trị kéo dài hoặc người bệnh nguy cơ cao. Theo dõi AST/ALT, ALP/GGT, bilirubin; thêm INR/PT khi có vàng da, men gan tăng nhanh hoặc nghi suy gan.",
      action: "Báo bác sĩ điều trị và cân nhắc ngừng/đổi thuốc khi ALT/AST > 5 lần giới hạn trên bình thường, hoặc > 3 lần kèm triệu chứng/vàng da/bilirubin tăng, hoặc có INR tăng.",
      source: "Tham khảo: HDSD đã được Cục Quản lý Dược phê duyệt, Dược thư Quốc gia Việt Nam, Quyết định 29/QĐ-BYT về giám sát ADR, LiverTox NIH và AASLD/EASL DILI."
    };

    if (has("paracetamol")) return {
      pattern: "Cần tính TỔNG liều paracetamol từ tất cả chế phẩm trong 24 giờ. Người lớn thường không vượt 3.000–4.000 mg/ngày tùy HDSD và tình trạng bệnh nhân. Nguy cơ độc gan tăng rõ khi dùng > 4.000 mg/ngày, uống một lần khoảng ≥ 7,5–10 g hoặc ≥ 150 mg/kg. Người uống rượu, suy dinh dưỡng, bệnh gan nền, người cao tuổi hoặc dùng nhiều thuốc cảm cúm phối hợp có thể cần giới hạn thấp hơn và phải cá thể hóa.",
      labs: "Nếu nghi quá liều: không chờ men gan tăng mới xử trí. Hỏi thời điểm uống, tổng liều 24 giờ, số chế phẩm cùng chứa paracetamol. Kiểm tra AST/ALT, bilirubin, INR/PT, creatinin, đường huyết và nồng độ paracetamol nếu có điều kiện.",
      action: "Báo bác sĩ/xử trí như ngộ độc paracetamol khi vượt ngưỡng hoặc không rõ liều dùng. Cân nhắc N-acetylcystein theo phác đồ, đặc biệt khi liều đáng nghi, thời điểm uống không rõ, có men gan tăng hoặc nồng độ paracetamol dương tính.",
      source: "Tham khảo: HDSD paracetamol; Dược thư Quốc gia Việt Nam; LiverTox NIH; AASLD/FDA về độc tính paracetamol và DILI."
    };

    if (has("amoxicillin", "clavulanic")) return {
      pattern: "Không có ngưỡng liều gây độc gan cố định vì thường là DILI đặc ứng. Nguy cơ tăng khi dùng liều cao, đợt điều trị kéo dài, lặp lại nhiều đợt, người cao tuổi, nam giới hoặc đã từng vàng da/rối loạn chức năng gan do amoxicillin–clavulanate. Không dùng vượt liều và thời gian trong HDSD/khuyến cáo điều trị.",
      labs: "Theo dõi vàng da, ngứa, nước tiểu sẫm, ALP/GGT, bilirubin và ALT/AST; tổn thương có thể xuất hiện muộn, kể cả sau khi đã ngừng thuốc.",
      action: "Không dùng lại nếu từng vàng da hoặc rối loạn chức năng gan liên quan amoxicillin/clavulanate. Báo bác sĩ khi có vàng da, ngứa lan tỏa, bilirubin/ALP tăng hoặc triệu chứng gan mật.",
      source: "Tham khảo: HDSD thuốc được phê duyệt; Dược thư Quốc gia Việt Nam; LiverTox NIH; AASLD/EASL DILI; Quyết định 29/QĐ-BYT về ADR."
    };

    if (has("valproat")) return {
      pattern: "Độc gan của valproat không có ngưỡng liều tuyệt đối; có thể xảy ra trong liều điều trị. Nguy cơ tăng khi khởi trị/tăng liều nhanh, đa trị liệu chống động kinh, trẻ nhỏ, rối loạn chuyển hóa ty thể, bệnh gan nền hoặc có triệu chứng tăng amoniac. Không tự ý vượt liều theo cân nặng/HDSD.",
      labs: "Kiểm tra AST/ALT, bilirubin, INR khi có triệu chứng. Định lượng amoniac khi buồn ngủ, lú lẫn, nôn ói, giảm tri giác dù men gan không tăng nhiều.",
      action: "Báo bác sĩ ngay khi rối loạn ý thức, nôn kéo dài, vàng da, INR tăng hoặc men gan tăng tiến triển. Tránh tự ý tăng liều hoặc phối hợp thêm thuốc độc gan.",
      source: "Tham khảo: HDSD valproat/Dalekine; Dược thư Quốc gia Việt Nam; LiverTox NIH; AASLD DILI."
    };

    if (has("methotrexat")) return {
      pattern: "Cần phân biệt liều thấp dùng hằng tuần và liều cao trong ung bướu. Dùng nhầm methotrexat hằng ngày thay vì hằng tuần có thể gây độc tính nặng. Nguy cơ độc gan tăng khi dùng kéo dài, tổng liều tích lũy cao, uống rượu, béo phì/gan nhiễm mỡ, đái tháo đường, viêm gan virus, suy thận hoặc phối hợp thuốc làm tăng nồng độ methotrexat. Luôn dùng đúng lịch liều theo chuyên khoa và HDSD.",
      labs: "Theo dõi AST/ALT, albumin, công thức máu và chức năng thận theo phác đồ. Đánh giá HBV/HCV và yếu tố nguy cơ gan trước điều trị dài ngày khi phù hợp.",
      action: "Báo bác sĩ khi men gan tăng kéo dài, albumin giảm, vàng da hoặc có dấu hiệu độc tính toàn thân. Tránh rượu và hạn chế phối hợp thuốc gây độc gan nếu không cần thiết.",
      source: "Tham khảo: HDSD methotrexat; Dược thư Quốc gia Việt Nam; hướng dẫn chuyên khoa cơ xương khớp/da liễu/ung bướu; LiverTox NIH."
    };

    if (has("itraconazol", "fluconazol", "voriconazol", "ketoconazol")) return {
      pattern: "Không có ngưỡng liều gây độc gan cố định; nguy cơ tăng khi dùng liều cao, kéo dài nhiều ngày–nhiều tuần, bệnh gan nền hoặc phối hợp thuốc ức chế/cảm ứng CYP làm tăng phơi nhiễm azol. Với azol điều trị kéo dài, không tự ý tăng liều hoặc kéo dài đơn khi chưa đánh giá chức năng gan và tương tác.",
      labs: "Có xét nghiệm nền khi dùng kéo dài. Theo dõi AST/ALT, ALP/GGT, bilirubin; rà soát tương tác CYP và các thuốc cùng độc gan.",
      action: "Ngừng/đổi thuốc và báo bác sĩ khi có mệt nhiều, chán ăn, đau hạ sườn phải, vàng da, nước tiểu sẫm hoặc men gan tăng có ý nghĩa.",
      source: "Tham khảo: HDSD thuốc azol được phê duyệt; Dược thư Quốc gia Việt Nam; LiverTox NIH; AASLD/EASL DILI."
    };

    if (has("allopurinol")) return {
      pattern: "Không phải độc gan phụ thuộc liều đơn thuần. Nguy cơ phản ứng quá mẫn/DRESS tăng khi khởi trị liều cao, không hiệu chỉnh theo chức năng thận, suy thận, dùng kèm lợi tiểu thiazid hoặc có yếu tố nguy cơ di truyền. Nên khởi liều thấp và tăng từ từ theo chỉ định, đặc biệt ở người suy thận.",
      labs: "Khi nghi quá mẫn: kiểm tra AST/ALT, bilirubin, creatinin/eGFR, công thức máu và bạch cầu ái toan.",
      action: "Ngừng thuốc và báo bác sĩ khẩn khi có phát ban lan rộng, sốt, phù mặt, hạch, vàng da hoặc suy thận. Không dùng lại nếu nghi DRESS do allopurinol.",
      source: "Tham khảo: HDSD allopurinol; Dược thư Quốc gia Việt Nam; LiverTox NIH; hướng dẫn ADR Bộ Y tế."
    };

    if (has("diclofenac")) return {
      pattern: "Nguy cơ tăng khi dùng liều cao hoặc kéo dài, đặc biệt dùng liên tục nhiều tuần–tháng, người có bệnh gan nền hoặc phối hợp thuốc độc gan. Không dùng vượt liều tối đa/ngày trong HDSD; tránh dùng kéo dài nếu không có chỉ định rõ.",
      labs: "Theo dõi AST/ALT khi dùng kéo dài hoặc người bệnh có bệnh gan nền. Hỏi triệu chứng mệt, chán ăn, buồn nôn, đau hạ sườn phải, vàng da.",
      action: "Ngừng và báo bác sĩ khi men gan tăng tiến triển hoặc kèm triệu chứng. Tránh phối hợp nhiều NSAID và tránh dùng kéo dài không cần thiết.",
      source: "Tham khảo: HDSD diclofenac; LiverTox NIH; AASLD/EASL DILI; Dược thư Quốc gia Việt Nam."
    };

    if (has("sulfamethoxazol", "trimethoprim")) return {
      pattern: "Không có ngưỡng liều độc gan cố định; thường liên quan phản ứng quá mẫn. Nguy cơ tăng khi dùng kéo dài, suy thận không hiệu chỉnh liều, người cao tuổi, HIV/suy giảm miễn dịch hoặc phối hợp thuốc gây độc gan. Dùng đúng liều theo chức năng thận.",
      labs: "Theo dõi AST/ALT, bilirubin, công thức máu, creatinin và kali khi có triệu chứng hoặc điều trị kéo dài/người bệnh nguy cơ.",
      action: "Ngừng và báo bác sĩ khi xuất hiện ban da, sốt, loét niêm mạc, vàng da, tăng men gan hoặc tăng bạch cầu ái toan.",
      source: "Tham khảo: HDSD cotrimoxazol; Dược thư Quốc gia Việt Nam; LiverTox NIH; Quyết định 29/QĐ-BYT về ADR."
    };

    if (has("amiodaron")) return {
      pattern: "Nguy cơ liên quan phơi nhiễm tích lũy: dùng liều duy trì kéo dài nhiều tháng–năm có thể gây tăng men gan, gan nhiễm mỡ/xơ hóa; dạng truyền tĩnh mạch có thể gây tổn thương gan cấp hiếm gặp. Cần theo dõi chặt hơn khi dùng liều cao, kéo dài hoặc có bệnh gan nền.",
      labs: "Theo dõi AST/ALT định kỳ trong điều trị dài ngày; kiểm tra bilirubin và INR khi men gan tăng nhiều hoặc có triệu chứng.",
      action: "Đánh giá lợi ích-nguy cơ khi men gan tăng dai dẳng hoặc có vàng da. Sau truyền tĩnh mạch, báo bác sĩ ngay nếu men gan tăng cấp, tụt huyết áp hoặc suy gan.",
      source: "Tham khảo: HDSD amiodaron; Dược thư Quốc gia Việt Nam; LiverTox NIH; AASLD DILI."
    };

    if (has("piperacillin", "tazobactam", "ampicillin", "sulbactam", "ceftriaxon", "cefoperazon")) return {
      pattern: "Không có ngưỡng liều độc gan cố định; nguy cơ tăng khi dùng liều cao, điều trị kéo dài, người bệnh nặng, suy gan mật, dinh dưỡng kém hoặc không hiệu chỉnh khi suy thận nếu thuốc cần chỉnh liều. Với ceftriaxon, liều cao/kéo dài và ứ mật có thể làm tăng nguy cơ bùn mật/giả sỏi mật.",
      labs: "Theo dõi AST/ALT, ALP/GGT, bilirubin khi điều trị kéo dài, người bệnh nặng, dinh dưỡng kém hoặc có bệnh gan mật nền.",
      action: "Báo bác sĩ khi vàng da, ngứa, đau hạ sườn phải, bilirubin/ALP tăng hoặc nghi bùn mật do ceftriaxon.",
      source: "Tham khảo: HDSD từng kháng sinh được phê duyệt; Dược thư Quốc gia Việt Nam; LiverTox NIH; hướng dẫn ADR Bộ Y tế."
    };

    if (has("ciprofloxacin", "levofloxacin", "moxifloxacin")) return {
      pattern: "DILI do fluoroquinolon thường đặc ứng, không có ngưỡng liều cố định và có thể khởi phát nhanh. Nguy cơ cần cảnh giác hơn khi dùng liều cao, kéo dài, người cao tuổi, bệnh gan nền hoặc dùng kèm thuốc độc gan. Không dùng vượt liều/không kéo dài khi không cần thiết.",
      labs: "Theo dõi triệu chứng trong và sau đợt điều trị; kiểm tra AST/ALT, bilirubin, ALP/GGT nếu mệt nhiều, vàng da, nước tiểu sẫm hoặc đau hạ sườn phải.",
      action: "Ngừng và báo bác sĩ khi có vàng da hoặc men gan tăng nhanh không giải thích được. Tránh dùng lại cùng nhóm nếu từng DILI do fluoroquinolon.",
      source: "Tham khảo: HDSD fluoroquinolon; LiverTox NIH; AASLD/EASL DILI; cảnh giác dược."
    };

    if (has("metronidazol", "spiramycin")) return {
      pattern: "Nguy cơ DILI nhìn chung thấp; không có ngưỡng liều độc gan cố định. Cần thận trọng khi dùng liều cao, kéo dài, bệnh gan nặng hoặc phối hợp nhiều thuốc. Với bệnh gan nặng, phải cân nhắc hiệu chỉnh/giảm liều theo HDSD và theo dõi sát.",
      labs: "Theo dõi lâm sàng; kiểm tra AST/ALT, bilirubin khi điều trị kéo dài hoặc có triệu chứng gan mật.",
      action: "Báo bác sĩ khi vàng da, nước tiểu sẫm, buồn nôn nhiều hoặc men gan tăng rõ.",
      source: "Tham khảo: HDSD thuốc được phê duyệt; Dược thư Quốc gia Việt Nam; LiverTox NIH."
    };

    if (has("atorvastatin", "lovastatin", "rosuvastatin", "fenofibrat")) return {
      pattern: "Tăng transaminase nhẹ có thể gặp và thường không phụ thuộc liều rõ ràng; nguy cơ tăng khi dùng liều cao, tương tác làm tăng nồng độ statin, uống rượu, bệnh gan nền hoặc phối hợp fibrat. Không dùng vượt liều tối đa theo HDSD; cần kiểm tra tương tác trước khi tăng liều.",
      labs: "Kiểm tra men gan khi có triệu chứng hoặc yếu tố nguy cơ. Không cần ngừng thuốc chỉ vì tăng nhẹ đơn độc nếu không có triệu chứng và không tiến triển.",
      action: "Báo bác sĩ khi ALT/AST tăng dai dẳng, vàng da, nước tiểu sẫm, đau hạ sườn phải hoặc nghi tương tác làm tăng phơi nhiễm thuốc.",
      source: "Tham khảo: HDSD statin/fibrat; Dược thư Quốc gia Việt Nam; LiverTox NIH; khuyến cáo chuyên ngành tim mạch/chuyển hóa."
    };

    if (has("phenobarbital")) return {
      pattern: "Không có ngưỡng liều độc gan cố định; tổn thương gan thường nằm trong phản ứng quá mẫn. Nguy cơ cần cảnh giác khi khởi trị, tăng liều, phối hợp nhiều thuốc chống động kinh hoặc xuất hiện sốt/phát ban trong những tuần đầu.",
      labs: "Khi nghi quá mẫn: kiểm tra AST/ALT, bilirubin, công thức máu, bạch cầu ái toan, creatinin và đánh giá da-niêm mạc.",
      action: "Báo bác sĩ và ngừng thuốc nghi ngờ khi có phát ban lan rộng, sốt, phù mặt, vàng da hoặc tổn thương đa cơ quan.",
      source: "Tham khảo: HDSD phenobarbital; Dược thư Quốc gia Việt Nam; LiverTox NIH; hướng dẫn ADR Bộ Y tế."
    };

    if (has("celecoxib", "ibuprofen", "ketoprofen", "ketorolac", "acetylsalicylic")) return {
      pattern: "Nguy cơ tăng khi dùng liều cao, vượt liều tối đa/ngày, dùng kéo dài hoặc phối hợp nhiều NSAID. Với ketorolac, nguy cơ toàn thân tăng rõ khi dùng quá thời gian khuyến cáo; không dùng kéo dài. Người bệnh gan nền, uống rượu hoặc dùng kèm thuốc độc gan cần hạn chế thời gian dùng.",
      labs: "Theo dõi triệu chứng gan mật; xét nghiệm AST/ALT, bilirubin khi dùng kéo dài hoặc có triệu chứng.",
      action: "Tránh phối hợp nhiều NSAID. Báo bác sĩ khi vàng da, đau hạ sườn phải, mệt nhiều hoặc men gan tăng đáng kể.",
      source: "Tham khảo: HDSD từng NSAID; Dược thư Quốc gia Việt Nam; LiverTox NIH."
    };

    if (has("cyclophosphamid", "doxorubicin", "epirubicin", "docetaxel", "paclitaxel", "capecitabin", "oxaliplatin", "carboplatin")) return {
      pattern: "Không áp dụng một ngưỡng liều chung cho tất cả thuốc hóa trị. Nguy cơ độc gan và quyết định giảm liều/trì hoãn phụ thuộc bilirubin, AST/ALT, ALP, albumin, phác đồ, chu kỳ điều trị và HDSD từng hoạt chất. Không tự động dùng liều chuẩn khi bilirubin hoặc transaminase tăng trước chu kỳ.",
      labs: "Kiểm tra AST/ALT, bilirubin, ALP, albumin, công thức máu và các chỉ số theo phác đồ trước mỗi chu kỳ. Với oxaliplatin, lưu ý tiểu cầu giảm, lách to, dấu tăng áp cửa.",
      action: "Báo bác sĩ/phụ trách hóa trị để hiệu chỉnh, trì hoãn hoặc đổi phác đồ theo tiêu chuẩn chuyên khoa khi chức năng gan bất thường.",
      source: "Tham khảo: HDSD thuốc hóa trị; phác đồ ung bướu hiện hành tại bệnh viện; LiverTox NIH; khuyến cáo chuyên ngành ung bướu."
    };

    if (has("sevofluran", "desfluran", "propofol")) return {
      pattern: "Thuốc mê halogen hiếm gây viêm gan miễn dịch, không có ngưỡng liều cố định; nguy cơ tăng nếu từng viêm gan sau gây mê halogen. Propofol truyền liều cao kéo dài trong hồi sức liên quan hội chứng truyền propofol; cần tránh vượt liều/tốc độ/thời gian theo khuyến cáo hồi sức.",
      labs: "Theo dõi AST/ALT, bilirubin sau gây mê khi có vàng da/sốt; với propofol truyền kéo dài theo dõi lactat, CK, triglycerid, men gan và huyết động.",
      action: "Báo bác sĩ gây mê/hồi sức khi vàng da sau gây mê, tăng men gan cấp hoặc nghi hội chứng truyền propofol. Lưu ý tiền sử viêm gan do thuốc mê halogen.",
      source: "Tham khảo: HDSD thuốc gây mê; LiverTox NIH; khuyến cáo hồi sức/gây mê."
    };

    if (has("acid amin", "glucose", "lipid", "nhũ dịch lipid")) return {
      pattern: "Nguy cơ liên quan tổng năng lượng và thời gian nuôi dưỡng tĩnh mạch. Cảnh giác khi nuôi dưỡng tĩnh mạch kéo dài, thừa năng lượng/glucose/lipid, không nuôi dưỡng đường ruột, nhiễm trùng hoặc ứ mật. Liều năng lượng, acid amin và lipid cần tính theo cân nặng, bệnh cảnh và triglycerid/chức năng gan.",
      labs: "Theo dõi AST/ALT, ALP/GGT, bilirubin, triglycerid, glucose và dấu hiệu nhiễm trùng; đánh giá tổng năng lượng và tỷ lệ lipid.",
      action: "Báo bác sĩ/dinh dưỡng lâm sàng khi bilirubin hoặc ALP tăng, triglycerid cao, ứ mật tiến triển hoặc nghi quá tải năng lượng.",
      source: "Tham khảo: HDSD chế phẩm dinh dưỡng; khuyến cáo dinh dưỡng lâm sàng; LiverTox NIH."
    };

    return base;
  }

  function render(){
    const box = $("liverList");
    if(!box) return;
    const query = norm($("liverQ")?.value);
    const selected = $("liverLevel")?.value || "";
    const filtered = drugs.filter(d => {
      const hay = norm([d.name,d.active,d.level,d.risk,d.monitor].join(" "));
      return (!query || hay.includes(query)) && matchesLevel(d, selected);
    });

    box.innerHTML = filtered.length ? filtered.map(d => {
      const p = drugProfile(d);
      return `
      <details class="liver-item">
        <summary>
          <span class="liver-name"><b>${d.name}</b><small>${d.active}</small></span>
          <span class="liver-badge ${levelClass(d.level)}">${d.level === "Hóa trị" ? "Hóa trị – theo dõi" : d.level}</span>
        </summary>
        <div class="liver-detail">
          <div><b>Nguy cơ chính</b><p>${d.risk}</p></div>
          <div><b>Khuyến nghị theo dõi</b><p>${d.monitor}</p></div>
          <div class="liver-detail-wide"><b>Nguồn tham khảo chính thống</b><p>${p.source.replace(/^Tham khảo:\s*/, "")}</p></div>
        </div>
      </details>`;
    }).join("") : `<div class="empty-state"><div>🔎</div><b>Không tìm thấy thuốc phù hợp</b><span>Thử tên biệt dược, hoạt chất hoặc chọn mức cảnh báo khác.</span></div>`;

    $("liverTotal").textContent = drugs.length;
    $("liverHigh").textContent = drugs.filter(d => d.level === "Cao" || d.level === "Trung bình–cao").length;
    $("liverFollow").textContent = drugs.filter(d => d.level === "Theo dõi" || d.level === "Hiếm" || d.level === "Hóa trị").length;
    if ($("liverResultCount")) $("liverResultCount").textContent = `${filtered.length} kết quả`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("liverQ")?.addEventListener("input", render);
    $("liverLevel")?.addEventListener("change", render);
    $("liverExpandAll")?.addEventListener("click", () => {
      const items = [...document.querySelectorAll("#liverList details")];
      const shouldOpen = items.some(item => !item.open);
      items.forEach(item => item.open = shouldOpen);
      $("liverExpandAll").textContent = shouldOpen ? "Thu gọn tất cả" : "Mở tất cả";
    });
    render();
  });
})();