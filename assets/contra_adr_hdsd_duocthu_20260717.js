(function () {
  'use strict';

  const p = (contraindications, adr) => ({ contraindications, adr });

  // Ưu tiên tờ HDSD đúng chế phẩm. Nếu chưa có tờ HDSD công khai,
  // nội dung được đối chiếu theo chuyên luận hoạt chất trong Dược thư Quốc gia Việt Nam.
  const profiles = {
    1: p([
      'Mẫn cảm với amoxicilin, acid clavulanic, bất kỳ penicilin nào hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn tức thì nghiêm trọng (như phản vệ) với cephalosporin, carbapenem, monobactam hoặc beta-lactam khác.',
      'Tiền sử vàng da hoặc rối loạn chức năng gan liên quan đến amoxicilin/acid clavulanic.'
    ], 'Thường gặp: tiêu chảy, buồn nôn, nôn, nhiễm Candida. Quan trọng: phản vệ, viêm đại tràng do kháng sinh, tổn thương gan ứ mật, giảm tế bào máu, co giật và phản ứng da nặng.'),

    2: p([
      'Tiền sử quá mẫn với bất kỳ kháng sinh penicilin nào.'
    ], 'Đau và viêm tại chỗ tiêm, phát ban, mày đay. Quan trọng: phản vệ, phản ứng Jarisch–Herxheimer, thiếu máu tan máu, giảm bạch cầu/tiểu cầu và tổn thương thần kinh–mạch máu nếu tiêm sai vị trí.'),

    3: p([
      'Mẫn cảm với trimethoprim, sulfonamid hoặc bất kỳ thành phần nào của thuốc.',
      'Rối loạn chuyển hóa porphyrin cấp.',
      'Tiền sử giảm bạch cầu do sulfonamid hoặc trimethoprim theo cơ chế miễn dịch.',
      'Tổn thương nhu mô gan nặng.',
      'Thiếu máu nguyên hồng cầu khổng lồ do thiếu folat.',
      'Suy thận nặng khi không thể giám sát nồng độ thuốc trong huyết tương.',
      'Trẻ dưới 6 tuần tuổi.'
    ], 'Thường gặp: buồn nôn, nôn, chán ăn, phát ban. Quan trọng: tăng kali máu, suy tủy, tan máu ở người thiếu G6PD, tổn thương gan/thận và phản ứng da nặng.'),

    4: p([
      'Dị ứng với levofloxacin, quinolon khác hoặc bất kỳ thành phần nào của thuốc.',
      'Động kinh.',
      'Tiền sử viêm hoặc đứt gân liên quan đến quinolon.',
      'Trẻ em và người dưới 18 tuổi đang tăng trưởng.',
      'Phụ nữ mang thai.',
      'Phụ nữ đang cho con bú.'
    ], 'Thường gặp: buồn nôn, tiêu chảy, đau đầu, chóng mặt, mất ngủ và phản ứng tại chỗ truyền. Quan trọng: kéo dài QT, rối loạn đường huyết, co giật, viêm/đứt gân, bệnh lý thần kinh ngoại biên, tổn thương gan và phản ứng da nặng.'),

    5: p([
      'Mẫn cảm với cefpodoxim, cephalosporin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn tức thì hoặc nghiêm trọng với penicilin hay beta-lactam khác.'
    ], 'Thường gặp: tiêu chảy, buồn nôn, đau bụng, đau đầu và phát ban. Quan trọng: phản vệ, viêm đại tràng do C. difficile, giảm tế bào máu, tổn thương gan/thận và phản ứng da nặng.'),

    6: p([
      'Mẫn cảm với cefixim, cephalosporin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn tức thì hoặc nghiêm trọng với penicilin hay beta-lactam khác.'
    ], 'Thường gặp: tiêu chảy, buồn nôn, đau bụng, khó tiêu và đau đầu. Quan trọng: phản vệ, viêm đại tràng do C. difficile, giảm tế bào máu, tổn thương gan/thận và phản ứng da nặng.'),

    7: p([
      'Mẫn cảm với cefoperazon, cephalosporin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn tức thì hoặc nghiêm trọng với penicilin hay beta-lactam khác.'
    ], 'Tiêu chảy, buồn nôn, phát ban và đau tại chỗ tiêm. Quan trọng: phản vệ, chảy máu do giảm prothrombin, giảm tế bào máu, viêm đại tràng do kháng sinh và tổn thương gan.'),

    8: p([
      'Mẫn cảm với cefoxitin, cephalosporin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn tức thì hoặc nghiêm trọng với penicilin hay beta-lactam khác.'
    ], 'Đau/viêm tại chỗ tiêm, tiêu chảy, buồn nôn, phát ban. Quan trọng: phản vệ, viêm đại tràng do C. difficile, giảm bạch cầu/tiểu cầu, thiếu máu tan máu, tổn thương gan và viêm thận kẽ.'),

    9: p([
      'Mẫn cảm với ceftazidim, cephalosporin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng với penicilin, monobactam, carbapenem hoặc beta-lactam khác.'
    ], 'Tiêu chảy, buồn nôn, phát ban, tăng men gan và phản ứng tại chỗ tiêm. Quan trọng: phản vệ, viêm đại tràng do C. difficile, giảm tế bào máu, bệnh não/co giật khi tích lũy và tổn thương thận.'),

    10: p([
      'Mẫn cảm với imipenem, cilastatin hoặc bất kỳ thành phần nào của thuốc.',
      'Mẫn cảm với carbapenem khác.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng với penicilin, cephalosporin hoặc beta-lactam khác.',
      'Nếu pha với lidocain để tiêm bắp: áp dụng các chống chỉ định của lidocain; không dùng dung dịch này theo đường tĩnh mạch.'
    ], 'Buồn nôn, nôn, tiêu chảy, phát ban và viêm tĩnh mạch. Quan trọng: phản vệ, viêm đại tràng do C. difficile, co giật/bệnh não (nhất là khi suy thận), giảm tế bào máu, tổn thương gan và phản ứng da nặng.'),

    11: p([
      'Mẫn cảm với ciprofloxacin, quinolon khác hoặc bất kỳ thành phần nào của thuốc.',
      'Dùng đồng thời tizanidin.'
    ], 'Buồn nôn, tiêu chảy, đau đầu, chóng mặt và phản ứng tại chỗ truyền. Quan trọng: kéo dài QT, rối loạn đường huyết, co giật, viêm/đứt gân, bệnh lý thần kinh ngoại biên, tổn thương gan và phản ứng da nặng.'),

    12: p([
      'Mẫn cảm với colistimethat natri (colistin) hoặc polymyxin B.'
    ], 'Quan trọng nhất: độc thận, tê quanh miệng/tứ chi, chóng mặt, lú lẫn, yếu cơ, ngừng thở do phong bế thần kinh–cơ và phản ứng quá mẫn.'),

    13: p([
      'Quá mẫn với amoxicilin, acid clavulanic, penicilin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng (như phản vệ) với cephalosporin, carbapenem, monobactam hoặc beta-lactam khác.',
      'Tiền sử vàng da hoặc rối loạn chức năng gan liên quan đến amoxicilin/acid clavulanic.'
    ], 'Thường gặp: tiêu chảy, buồn nôn, nôn, nhiễm Candida. Quan trọng: phản vệ, viêm đại tràng do kháng sinh, viêm gan/vàng da ứ mật, giảm tế bào máu và phản ứng da nặng.'),

    14: p([
      'Mẫn cảm với fosfomycin hoặc bất kỳ thành phần nào của thuốc.'
    ], 'Thường gặp: buồn nôn, tiêu chảy, đau đầu và phản ứng tại chỗ truyền. Quan trọng: phản vệ, tăng natri/quá tải dịch, hạ kali máu, tăng men gan và giảm bạch cầu/tiểu cầu.'),

    15: p([
      'Mẫn cảm với gentamicin hoặc aminoglycosid khác.'
    ], 'Quan trọng nhất: độc thận, giảm thính lực/độc tiền đình có thể không hồi phục và phong bế thần kinh–cơ. Có thể gặp phát ban, sốt, buồn nôn và rối loạn điện giải.'),

    16: p([
      'Mẫn cảm với amikacin hoặc aminoglycosid khác.'
    ], 'Quan trọng nhất: độc thận, giảm thính lực/độc tiền đình có thể không hồi phục và phong bế thần kinh–cơ. Có thể gặp phát ban, sốt, buồn nôn và đau tại chỗ tiêm.'),

    17: p([
      'Quá mẫn với amoxicilin, acid clavulanic, penicilin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng (như phản vệ) với cephalosporin, carbapenem, monobactam hoặc beta-lactam khác.',
      'Tiền sử vàng da hoặc rối loạn chức năng gan liên quan đến amoxicilin/acid clavulanic.'
    ], 'Thường gặp: tiêu chảy, buồn nôn, nôn, nhiễm Candida. Quan trọng: phản vệ, viêm đại tràng do kháng sinh, viêm gan/vàng da ứ mật, giảm tế bào máu và phản ứng da nặng.'),

    18: p([
      'Mẫn cảm với levofloxacin, quinolon khác hoặc bất kỳ thành phần nào của thuốc.',
      'Động kinh.',
      'Tiền sử viêm hoặc đứt gân liên quan đến quinolon.',
      'Trẻ em và người dưới 18 tuổi đang tăng trưởng.',
      'Phụ nữ mang thai.',
      'Phụ nữ đang cho con bú.'
    ], 'Thường gặp: buồn nôn, tiêu chảy, đau đầu, chóng mặt, mất ngủ và phản ứng tại chỗ truyền. Quan trọng: kéo dài QT, rối loạn đường huyết, co giật, viêm/đứt gân, bệnh lý thần kinh ngoại biên, tổn thương gan và phản ứng da nặng.'),

    19: p([
      'Mẫn cảm với ceftriaxon, cephalosporin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng với penicilin, monobactam, carbapenem hoặc beta-lactam khác.',
      'Trẻ sinh non đến 41 tuần tuổi hiệu chỉnh; trẻ sơ sinh đủ tháng dưới 28 ngày bị tăng bilirubin máu, vàng da, giảm albumin máu hoặc toan máu.',
      'Trẻ sơ sinh dưới 28 ngày đang hoặc dự kiến cần dùng dung dịch chứa calci đường tĩnh mạch.',
      'Nếu pha với lidocain để tiêm bắp: áp dụng chống chỉ định của lidocain; không tiêm tĩnh mạch dung dịch đã pha lidocain.'
    ], 'Tiêu chảy, phát ban, tăng men gan, đau tại chỗ tiêm. Quan trọng: phản vệ, viêm đại tràng do C. difficile, thiếu máu tan máu, giảm tế bào máu, bùn/sỏi mật giả và kết tủa ceftriaxon–calci ở trẻ sơ sinh.'),

    20: p([
      'Quá mẫn với meropenem hoặc bất kỳ thành phần nào của thuốc.',
      'Quá mẫn với carbapenem khác.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng (như phản vệ hoặc phản ứng da nặng) với penicilin, cephalosporin hoặc beta-lactam khác.'
    ], 'Thường gặp: đau đầu, buồn nôn, nôn, tiêu chảy, phát ban và đau/viêm tại chỗ tiêm. Quan trọng: phản vệ, viêm đại tràng do kháng sinh, co giật, giảm tế bào máu, tổn thương gan và phản ứng da nặng.'),

    21: p([
      'Quá mẫn với meropenem hoặc bất kỳ thành phần nào của thuốc.',
      'Quá mẫn với carbapenem khác.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng (như phản vệ hoặc phản ứng da nặng) với penicilin, cephalosporin hoặc beta-lactam khác.'
    ], 'Thường gặp: đau đầu, buồn nôn, nôn, tiêu chảy, phát ban và đau/viêm tại chỗ tiêm. Quan trọng: phản vệ, viêm đại tràng do kháng sinh, co giật, giảm tế bào máu, tổn thương gan và phản ứng da nặng.'),

    22: p([
      'Mẫn cảm với metronidazol, dẫn chất nitroimidazol hoặc bất kỳ thành phần nào của thuốc.',
      'Phụ nữ trong 3 tháng đầu thai kỳ, đặc biệt khi điều trị nhiễm Trichomonas.',
      'Người xuất hiện biến chứng thần kinh trong khi đang dùng metronidazol.'
    ], 'Thường gặp: buồn nôn, đau bụng, tiêu chảy, vị kim loại và đau đầu. Quan trọng: bệnh lý thần kinh ngoại biên, co giật/bệnh não, giảm bạch cầu, viêm tụy, tổn thương gan và phản ứng da nặng.'),

    23: p([
      'Mẫn cảm với metronidazol, dẫn chất nitroimidazol hoặc bất kỳ thành phần nào của thuốc.',
      'Phụ nữ trong 3 tháng đầu thai kỳ, đặc biệt khi điều trị nhiễm Trichomonas.',
      'Người xuất hiện biến chứng thần kinh trong khi đang dùng metronidazol.'
    ], 'Thường gặp: buồn nôn, đau bụng, tiêu chảy, vị kim loại và đau đầu. Quan trọng: bệnh lý thần kinh ngoại biên, co giật/bệnh não, giảm bạch cầu, viêm tụy, tổn thương gan và phản ứng da nặng.'),

    24: p([
      'Mẫn cảm với moxifloxacin, quinolon khác hoặc bất kỳ thành phần nào của thuốc.',
      'Phụ nữ mang thai hoặc đang cho con bú; người dưới 18 tuổi.',
      'Tiền sử bệnh hoặc tổn thương gân liên quan đến quinolon.',
      'QT kéo dài bẩm sinh/mắc phải, rối loạn điện giải chưa điều chỉnh (đặc biệt hạ kali máu), nhịp tim chậm có ý nghĩa, suy tim giảm phân suất tống máu hoặc tiền sử loạn nhịp có triệu chứng.',
      'Dùng đồng thời thuốc khác làm kéo dài khoảng QT.',
      'Suy gan nặng hoặc transaminase cao hơn 5 lần giới hạn trên bình thường.'
    ], 'Thường gặp: buồn nôn, tiêu chảy, đau đầu, chóng mặt và phản ứng tại chỗ truyền. Quan trọng: kéo dài QT/loạn nhịp, viêm hoặc đứt gân, bệnh lý thần kinh ngoại biên, rối loạn đường huyết, tổn thương gan và phản ứng da nặng.'),

    25: p([
      'Tiền sử phản ứng dị ứng nghiêm trọng (như phản vệ hoặc hội chứng Stevens–Johnson) với ampicilin, sulbactam hoặc beta-lactam khác.',
      'Tiền sử rối loạn chức năng gan liên quan đến ampicilin/sulbactam.'
    ], 'Thường gặp: tiêu chảy, đau tại chỗ tiêm, viêm tĩnh mạch và tăng men gan. Quan trọng: phản vệ, viêm đại tràng giả mạc, giảm tế bào máu, viêm gan ứ mật, viêm thận kẽ và phản ứng da nặng.'),

    26: p([
      'Mẫn cảm với trimethoprim, sulfonamid hoặc bất kỳ thành phần nào của thuốc.',
      'Rối loạn chuyển hóa porphyrin cấp.',
      'Tiền sử giảm bạch cầu do sulfonamid hoặc trimethoprim theo cơ chế miễn dịch.',
      'Tổn thương nhu mô gan nặng.',
      'Thiếu máu nguyên hồng cầu khổng lồ do thiếu folat.',
      'Suy thận nặng khi không thể giám sát nồng độ thuốc trong huyết tương.',
      'Trẻ dưới 6 tuần tuổi.'
    ], 'Thường gặp: buồn nôn, nôn, chán ăn, phát ban. Quan trọng: tăng kali máu, suy tủy, tan máu ở người thiếu G6PD, tổn thương gan/thận và phản ứng da nặng.'),

    27: p([
      'Mẫn cảm với levofloxacin, quinolon khác hoặc bất kỳ thành phần nào của thuốc.',
      'Động kinh.',
      'Tiền sử viêm hoặc đứt gân liên quan đến quinolon.',
      'Trẻ em và người dưới 18 tuổi đang tăng trưởng.',
      'Phụ nữ mang thai.',
      'Phụ nữ đang cho con bú.'
    ], 'Thường gặp: buồn nôn, tiêu chảy, đau đầu, chóng mặt và mất ngủ. Quan trọng: kéo dài QT, rối loạn đường huyết, co giật, viêm/đứt gân, bệnh lý thần kinh ngoại biên, tổn thương gan và phản ứng da nặng.'),

    28: p([
      'Mẫn cảm với ciprofloxacin, quinolon khác hoặc bất kỳ thành phần nào của thuốc.',
      'Dùng đồng thời tizanidin.'
    ], 'Thường gặp: buồn nôn, tiêu chảy, đau đầu và chóng mặt. Quan trọng: kéo dài QT, rối loạn đường huyết, co giật, viêm/đứt gân, bệnh lý thần kinh ngoại biên, tổn thương gan và phản ứng da nặng.'),

    29: p([
      'Mẫn cảm với piperacilin, tazobactam, penicilin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng dị ứng cấp tính nghiêm trọng với cephalosporin, carbapenem, monobactam hoặc beta-lactam khác.'
    ], 'Thường gặp: tiêu chảy, buồn nôn, nôn, phát ban và đau/viêm tại chỗ truyền. Quan trọng: phản vệ, viêm đại tràng do C. difficile, giảm tế bào máu/chảy máu, hạ kali máu, tổn thương gan thận và phản ứng da nặng.'),

    30: p([
      'Quá mẫn với cefotaxim, cephalosporin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn tức thì hoặc nghiêm trọng với penicilin hay beta-lactam khác.',
      'Nếu pha với lidocain để tiêm bắp: chống chỉ định khi dị ứng lidocain/thuốc tê amid, rối loạn nhịp tim, suy tim nặng, trẻ dưới 30 tháng; không dùng dung dịch này theo đường tĩnh mạch.'
    ], 'Tiêu chảy, buồn nôn, phát ban, tăng men gan và đau tại chỗ tiêm. Quan trọng: phản vệ, viêm đại tràng giả mạc, giảm tế bào máu, bệnh não/co giật, tổn thương gan thận và phản ứng da nặng.'),

    31: p([
      'Mẫn cảm với ampicilin, sulbactam, penicilin hoặc bất kỳ thành phần nào của thuốc.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng với cephalosporin, carbapenem, monobactam hoặc beta-lactam khác.',
      'Tiền sử vàng da hoặc rối loạn chức năng gan liên quan đến ampicilin/sulbactam.'
    ], 'Thường gặp: tiêu chảy, đau tại chỗ tiêm, viêm tĩnh mạch và tăng men gan. Quan trọng: phản vệ, viêm đại tràng giả mạc, giảm tế bào máu, viêm gan ứ mật, viêm thận kẽ và phản ứng da nặng.'),

    32: p([
      'Mẫn cảm với vancomycin hoặc bất kỳ thành phần nào của thuốc.'
    ], 'Quan trọng: độc thận, giảm bạch cầu trung tính/tiểu cầu, độc tai và phản ứng khi truyền nhanh (đỏ bừng, ngứa, tụt huyết áp, đau ngực/lưng). Hiếm gặp phản vệ và phản ứng da nặng.'),

    33: p([
      'Mẫn cảm với vancomycin hoặc bất kỳ thành phần nào của thuốc.'
    ], 'Quan trọng: độc thận, giảm bạch cầu trung tính/tiểu cầu, độc tai và phản ứng khi truyền nhanh (đỏ bừng, ngứa, tụt huyết áp, đau ngực/lưng). Hiếm gặp phản vệ và phản ứng da nặng.'),

    34: p([
      'Mẫn cảm với vancomycin hoặc bất kỳ thành phần nào của thuốc.'
    ], 'Quan trọng: độc thận, giảm bạch cầu trung tính/tiểu cầu, độc tai và phản ứng khi truyền nhanh (đỏ bừng, ngứa, tụt huyết áp, đau ngực/lưng). Hiếm gặp phản vệ và phản ứng da nặng.'),

    35: p([
      'Mẫn cảm với spiramycin, macrolid, metronidazol, dẫn chất imidazol hoặc bất kỳ thành phần nào của thuốc.',
      'Phụ nữ trong 3 tháng đầu thai kỳ, đặc biệt khi điều trị nhiễm Trichomonas.',
      'Người xuất hiện biến chứng thần kinh trong khi đang dùng metronidazol.'
    ], 'Thường gặp: buồn nôn, đau bụng, tiêu chảy, vị kim loại và phát ban. Quan trọng: phản vệ, bệnh lý thần kinh ngoại biên/co giật khi dùng kéo dài, giảm bạch cầu, tổn thương gan và phản ứng da nặng.'),

    36: p([
      'Mẫn cảm với ofloxacin, quinolon khác hoặc bất kỳ thành phần nào của thuốc.'
    ], 'Thường gặp: nóng rát, ngứa, đỏ mắt, chảy nước mắt, cảm giác cộm và nhìn mờ thoáng qua. Ngừng thuốc nếu sưng mắt/mặt, khó thở, phát ban hoặc phản ứng dị ứng nặng.'),

    37: p([
      'Mẫn cảm với itraconazol hoặc bất kỳ thành phần nào của thuốc.',
      'Suy tim sung huyết, tiền sử suy tim sung huyết hoặc rối loạn chức năng thất, trừ trường hợp nhiễm nấm đe dọa tính mạng.',
      'Phụ nữ mang thai hoặc dự định có thai khi điều trị nhiễm nấm không đe dọa tính mạng.',
      'Dùng đồng thời thuốc chống loạn nhịp disopyramid, dofetilid, dronedaron hoặc quinidin.',
      'Dùng đồng thời dabigatran, ticagrelor; statin chuyển hóa qua CYP3A4; terfenadin hoặc mizolastin.',
      'Dùng đồng thời dihydroergotamin, ergometrin, ergotamin, methylergometrin hoặc irinotecan.',
      'Dùng đồng thời lurasidon, midazolam uống, pimozid, quetiapin, sertindol hoặc triazolam.',
      'Dùng đồng thời bepridil, lercanidipin, nisoldipin, aliskiren, ivabradin, ranolazin, eplerenon, astemizol, cisaprid hoặc domperidon.',
      'Dùng telithromycin khi người bệnh suy thận nặng hoặc suy gan nặng.'
    ], 'Thường gặp: buồn nôn, đau bụng, khó tiêu, đau đầu và phát ban. Quan trọng: độc gan, phù/suy tim, hạ kali máu, bệnh lý thần kinh ngoại biên, giảm thính lực và tương tác thuốc nghiêm trọng.'),

    38: p([
      'Mẫn cảm với cefazolin hoặc cephalosporin.',
      'Tiền sử phản ứng quá mẫn nghiêm trọng (như phản vệ) với penicilin, monobactam, carbapenem hoặc beta-lactam khác.',
      'Nếu pha với lidocain để tiêm bắp: chống chỉ định khi dị ứng lidocain/thuốc tê amid, block nhĩ–thất, suy tim nặng hoặc trẻ dưới 30 tháng.',
      'Không tiêm tĩnh mạch dung dịch cefazolin đã pha với lidocain.'
    ], 'Thường gặp: buồn nôn, tiêu chảy, phát ban và đau tại chỗ tiêm. Quan trọng: phản vệ, viêm đại tràng giả mạc, giảm tế bào máu/chảy máu, co giật khi tích lũy, tổn thương gan thận và phản ứng da nặng.')
  };

  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderList = values => '<ul style="margin:8px 0 0;padding-left:20px">' +
    values.map(value => '<li style="margin:0 0 8px;line-height:1.55">' + esc(value) + '</li>').join('') +
    '</ul>';

  window.VPMED_CONTRA_ADR_HTML = function (drug) {
    const data = drug && profiles[Number(drug.id)];
    if (!data) return '';

    return '<div class="profile-grid">' +
      '<div class="info-box"><h3>Chống chỉ định</h3>' + renderList(data.contraindications) + '</div>' +
      '<div class="info-box"><h3>ADR quan trọng</h3><p style="line-height:1.65">' + esc(data.adr) + '</p></div>' +
    '</div>';
  };
})();
