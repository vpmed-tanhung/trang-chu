(()=>{
  const D=window.VPMED_DRUGS||[];
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const oral={
    reconstitution:'Không áp dụng cho chế phẩm đường uống.',
    dilution:'Không áp dụng cho chế phẩm đường uống.',
    administration:'Dùng nguyên viên hoặc dạng uống đúng liều đã kê; không chuyển sang đường tiêm truyền.',
    line:'Không áp dụng đường truyền.',
    stability:'Bảo quản trong bao bì kín, tránh ẩm và nhiệt theo điều kiện ghi trên nhãn.'
  };
  function set(a,route,strength){
    const x=norm(a),r=norm(route),s=norm(strength);
    if(/uong/.test(r)) return oral;
    if(/benzathin/.test(x)) return {
      reconstitution:'Lắc kỹ bơm tiêm hoặc lọ hỗn dịch để thuốc phân tán đồng nhất trước khi rút liều.',
      dilution:'Không pha loãng để truyền tĩnh mạch.',
      administration:'Chỉ tiêm bắp sâu. Tiêm chậm vào khối cơ lớn; chia liều sang hai vị trí khi thể tích lớn.',
      line:'Tuyệt đối không tiêm tĩnh mạch, không tiêm trong hoặc gần động mạch và không dùng qua catheter mạch máu.',
      stability:'Dùng ngay sau khi chuẩn bị liều; loại bỏ phần thuốc còn thừa.'
    };
    if(/levofloxacin/.test(x)) return {
      reconstitution:'Dung dịch 5 mg/mL đã pha sẵn, không cần hoàn nguyên.',
      dilution:'Dùng trực tiếp từ chai hoặc túi truyền. Không thêm thuốc khác vào cùng chai hoặc túi.',
      administration:'Liều 250 mg hoặc 500 mg truyền trong ít nhất 60 phút; liều 750 mg truyền trong ít nhất 90 phút. Không tiêm tĩnh mạch nhanh hoặc bolus.',
      line:'Có thể truyền qua đường riêng hoặc bộ dây chữ Y. Khi dùng chung đường truyền, ngừng dịch đang chạy và súc rửa dây trước và sau truyền bằng dung dịch tương hợp.',
      stability:'Chế phẩm dùng một lần; sử dụng ngay sau khi mở bao bì và loại bỏ phần còn dư.'
    };
    if(/moxifloxacin/.test(x)) return {
      reconstitution:'Dung dịch 400 mg/250 mL đã pha sẵn, không cần hoàn nguyên.',
      dilution:'Dùng trực tiếp, không thêm thuốc hoặc phụ gia vào chai hoặc túi truyền.',
      administration:'Truyền tĩnh mạch 400 mg trong 60 phút. Không tiêm bolus.',
      line:'Có thể truyền trực tiếp hoặc qua bộ dây chữ Y. Không truyền đồng thời với thuốc khác trong cùng đường truyền; súc rửa đường truyền trước và sau truyền.',
      stability:'Dùng ngay sau khi lấy khỏi bao ngoài; chế phẩm dùng một lần, loại bỏ phần thừa.'
    };
    if(/ciprofloxacin/.test(x)) return {
      reconstitution:'Chế phẩm 10 mg/mL là dung dịch đậm đặc, không cần hoàn nguyên.',
      dilution:'Pha loãng đến nồng độ 1–2 mg/mL bằng natri clorid 0,9%, glucose 5%, glucose 10%, Ringer hoặc Ringer lactat.',
      administration:'Truyền 200 mg trong ít nhất 30 phút; truyền 400 mg trong 60 phút. Không tiêm tĩnh mạch nhanh.',
      line:'Không trộn với dung dịch có pH kiềm hoặc thuốc tạo kết tủa. Tạm ngừng các dịch khác khi truyền qua bộ dây chữ Y và súc rửa dây trước, sau truyền.',
      stability:'Dùng dung dịch đã pha trong thời gian sớm nhất; loại bỏ khi có kết tủa, đổi màu hoặc tiểu phân.'
    };
    if(/metronidazol/.test(x)) return {
      reconstitution:'Dung dịch 500 mg/100 mL đã pha sẵn, không cần hoàn nguyên.',
      dilution:'Dùng trực tiếp, không cần pha loãng thêm.',
      administration:'Truyền tĩnh mạch chậm, thường 500 mg trong khoảng 20–60 phút; không tiêm bolus.',
      line:'Không thêm thuốc khác vào cùng chai hoặc túi. Khi dùng chung đường truyền, súc rửa dây trước và sau truyền.',
      stability:'Chế phẩm dùng một lần; bảo vệ khỏi ánh sáng và loại bỏ phần còn dư.'
    };
    if(/amikacin/.test(x)&&/100ml/.test(s)) return {
      reconstitution:'Dung dịch 500 mg/100 mL đã pha sẵn, không cần hoàn nguyên.',
      dilution:'Dùng trực tiếp; không thêm thuốc khác vào chai hoặc túi.',
      administration:'Truyền tĩnh mạch trong 30–60 phút ở người lớn. Không tiêm bolus.',
      line:'Không trộn trực tiếp với beta-lactam trong cùng chai, bơm tiêm hoặc dây truyền; dùng khác thời điểm và súc rửa đường truyền giữa các thuốc.',
      stability:'Chế phẩm dùng một lần; sử dụng ngay sau khi mở và loại bỏ phần còn dư.'
    };
    if(/gentamicin/.test(x)) return {
      reconstitution:'Dung dịch tiêm 80 mg/2 mL không cần hoàn nguyên.',
      dilution:'Pha liều cần dùng vào 50–200 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Truyền tĩnh mạch trong 30–120 phút. Có thể tiêm bắp sâu khi đường dùng này được chỉ định.',
      line:'Không trộn trực tiếp với penicillin, cephalosporin hoặc thuốc có khả năng bất hoạt aminoglycosid; dùng đường riêng hoặc súc rửa kỹ giữa các thuốc.',
      stability:'Chuẩn bị ngay trước khi dùng; loại bỏ phần dung dịch còn thừa.'
    };
    if(/amikacin/.test(x)) return {
      reconstitution:'Dung dịch tiêm không cần hoàn nguyên.',
      dilution:'Pha liều cần dùng vào 100–200 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Truyền tĩnh mạch trong 30–60 phút ở người lớn. Không tiêm bolus.',
      line:'Không trộn trực tiếp với beta-lactam trong cùng chai, bơm tiêm hoặc dây truyền; dùng khác thời điểm và súc rửa đường truyền giữa các thuốc.',
      stability:'Chuẩn bị ngay trước khi dùng; loại bỏ phần dung dịch còn thừa.'
    };
    if(/vancomycin/.test(x)) return {
      reconstitution:'Lọ 500 mg: thêm 10 mL nước cất pha tiêm. Lọ 1 g: thêm 20 mL nước cất pha tiêm. Nồng độ dung dịch sau hoàn nguyên là 50 mg/mL.',
      dilution:'Pha tiếp bằng natri clorid 0,9% hoặc glucose 5%. Nồng độ thường dùng qua đường ngoại vi không quá 5 mg/mL; có thể dùng đến 10 mg/mL khi hạn chế dịch và theo dõi chặt phản ứng tại chỗ.',
      administration:'Truyền với tốc độ không quá 10 mg/phút và mỗi liều ít nhất 60 phút. Liều trên 1 g cần kéo dài thời gian truyền tương ứng.',
      line:'Ưu tiên đường truyền riêng. Không trộn chung với beta-lactam hoặc thuốc chưa xác nhận tương hợp; súc rửa đường truyền trước và sau truyền.',
      stability:'Dùng dung dịch đã pha trong thời gian sớm nhất; kiểm tra độ trong, màu sắc và tiểu phân trước khi truyền.'
    };
    if(/meropenem/.test(x)) return {
      reconstitution:'Lọ 1 g: thêm 20 mL nước cất pha tiêm để tạo dung dịch 50 mg/mL.',
      dilution:'Để truyền, pha tiếp liều đã hoàn nguyên vào 50–200 mL natri clorid 0,9%.',
      administration:'Truyền tĩnh mạch trong 15–30 phút. Truyền kéo dài 3 giờ chỉ áp dụng khi phác đồ bệnh viện quy định và dung dịch được chuẩn bị trong giới hạn ổn định đã thẩm định.',
      line:'Không trộn trực tiếp với thuốc khác. Dùng đường riêng hoặc súc rửa dây truyền trước và sau truyền.',
      stability:'Ưu tiên sử dụng ngay sau khi pha; không dùng khi dung dịch đổi màu hoặc có tiểu phân.'
    };
    if(/imipenem/.test(x)) return {
      reconstitution:'Chuyển toàn bộ bột thuốc vào khoảng 100 mL dung dịch truyền tương hợp bằng cách hòa tan từng phần và tráng lọ cho đến khi chuyển hết thuốc.',
      dilution:'Dùng natri clorid 0,9% hoặc glucose 5%. Không dùng dung dịch chứa lactat để pha thuốc.',
      administration:'Liều đến 500 mg truyền trong 20–30 phút; liều trên 500 mg truyền trong 40–60 phút. Có thể giảm tốc độ nếu buồn nôn xuất hiện trong khi truyền.',
      line:'Không pha chung với kháng sinh khác. Dùng đường riêng hoặc súc rửa dây truyền giữa các thuốc.',
      stability:'Sử dụng dung dịch sau pha trong thời gian sớm nhất; loại bỏ khi có đổi màu hoặc tiểu phân.'
    };
    if(/piperacilin/.test(x)) return {
      reconstitution:'Lọ 4,5 g: thêm 20 mL nước cất pha tiêm, natri clorid 0,9% hoặc glucose 5%; lắc đến tan hoàn toàn.',
      dilution:'Pha tiếp dung dịch đã hoàn nguyên vào 50–150 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Truyền tĩnh mạch trong 30 phút. Truyền kéo dài 3–4 giờ chỉ áp dụng theo phác đồ PK/PD của bệnh viện.',
      line:'Không trộn trực tiếp với aminoglycosid. Khi cùng chỉ định, truyền riêng từng thuốc và súc rửa đường truyền giữa hai lần truyền.',
      stability:'Chuẩn bị gần thời điểm dùng; quan sát dung dịch và loại bỏ nếu có kết tủa hoặc đổi màu.'
    };
    if(/ceftriaxon/.test(x)) return {
      reconstitution:'Tiêm tĩnh mạch: lọ 1 g thêm 10 mL nước cất pha tiêm. Tiêm bắp: lọ 1 g có thể pha với khoảng 3,5 mL lidocain 1% để giảm đau tại chỗ.',
      dilution:'Truyền tĩnh mạch: pha liều vào khoảng 40 mL dung dịch không chứa calci như natri clorid 0,9% hoặc glucose 5%.',
      administration:'Tiêm tĩnh mạch chậm trong 2–4 phút hoặc truyền trong ít nhất 30 phút. Dung dịch pha lidocain chỉ dùng tiêm bắp, không tiêm tĩnh mạch.',
      line:'Không pha hoặc truyền đồng thời với dung dịch chứa calci. Súc rửa kỹ đường truyền khi phải dùng nối tiếp.',
      stability:'Dùng dung dịch sau pha trong thời gian sớm nhất; không sử dụng khi có kết tủa hoặc tiểu phân.'
    };
    if(/ceftazidim/.test(x)) return {
      reconstitution:'Lọ 1 g: thêm khoảng 10 mL nước cất pha tiêm để tiêm tĩnh mạch; lắc đến tan và chờ bọt khí thoát hết.',
      dilution:'Để truyền, pha tiếp liều đã hoàn nguyên vào 50–100 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Tiêm tĩnh mạch chậm trong 3–5 phút hoặc truyền trong 15–30 phút.',
      line:'Không trộn trực tiếp với aminoglycosid hoặc vancomycin trong cùng dung dịch; dùng đường riêng hoặc súc rửa dây truyền.',
      stability:'Sử dụng sớm sau khi pha; loại bỏ dung dịch có kết tủa, đổi màu bất thường hoặc tiểu phân.'
    };
    if(/cefotaxim/.test(x)) return {
      reconstitution:'Lọ 1 g: thêm khoảng 4 mL nước cất pha tiêm để tiêm tĩnh mạch; lắc đến tan hoàn toàn.',
      dilution:'Để truyền, pha tiếp vào 50–100 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Tiêm tĩnh mạch chậm trong 3–5 phút hoặc truyền trong 20–60 phút.',
      line:'Không trộn trực tiếp với aminoglycosid trong cùng bơm tiêm hoặc chai truyền; dùng riêng và súc rửa đường truyền.',
      stability:'Sử dụng sớm sau khi pha; loại bỏ dung dịch có kết tủa hoặc tiểu phân.'
    };
    if(/cefoxitin/.test(x)) return {
      reconstitution:'Lọ 1 g: thêm khoảng 10 mL nước cất pha tiêm để tiêm tĩnh mạch.',
      dilution:'Để truyền, pha tiếp vào 50–100 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Tiêm tĩnh mạch chậm trong 3–5 phút hoặc truyền trong 15–30 phút.',
      line:'Không trộn trực tiếp với aminoglycosid; dùng đường riêng hoặc súc rửa đường truyền giữa các thuốc.',
      stability:'Sử dụng sớm sau khi pha; loại bỏ dung dịch có kết tủa hoặc đổi màu bất thường.'
    };
    if(/cefoperazon/.test(x)) return {
      reconstitution:'Lọ 1 g: thêm nước cất pha tiêm, natri clorid 0,9% hoặc glucose 5% để tạo dung dịch nồng độ phù hợp cho tiêm hoặc truyền.',
      dilution:'Để truyền ngắt quãng, pha tiếp liều đã hoàn nguyên vào 50–100 mL dung dịch tương hợp.',
      administration:'Tiêm tĩnh mạch chậm trong ít nhất 3–5 phút hoặc truyền trong 15–30 phút.',
      line:'Không trộn trực tiếp với aminoglycosid; truyền riêng từng thuốc và súc rửa đường truyền giữa các lần dùng.',
      stability:'Chuẩn bị gần thời điểm dùng; loại bỏ dung dịch có kết tủa hoặc tiểu phân.'
    };
    if((/ampicilin|ampicillin/.test(x))&&/sulbactam/.test(x)) return {
      reconstitution:'Lọ 1,5 g: thêm khoảng 3,2 mL nước cất pha tiêm để tạo dung dịch đậm đặc.',
      dilution:'Để truyền, pha tiếp liều đã hoàn nguyên vào 50–100 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Tiêm tĩnh mạch chậm trong ít nhất 10–15 phút hoặc truyền trong 15–30 phút.',
      line:'Không trộn trực tiếp với aminoglycosid; truyền riêng và súc rửa đường truyền giữa các thuốc.',
      stability:'Chuẩn bị gần thời điểm dùng; loại bỏ dung dịch có kết tủa hoặc đổi màu bất thường.'
    };
    if(/amoxic/.test(x)&&/clav/.test(x)) return {
      reconstitution:'Lọ 1,2 g: thêm 20 mL nước cất pha tiêm và lắc đến tan hoàn toàn.',
      dilution:'Để truyền, pha tiếp dung dịch đã hoàn nguyên vào khoảng 100 mL natri clorid 0,9%.',
      administration:'Tiêm tĩnh mạch chậm trong 3–4 phút hoặc truyền trong 30–40 phút. Không tiêm bắp.',
      line:'Không trộn trực tiếp với aminoglycosid trong cùng bơm tiêm, chai hoặc dây truyền; truyền riêng và súc rửa đường truyền.',
      stability:'Dùng ngay sau khi pha; không để kéo dài vì clavulanat giảm ổn định trong dung dịch.'
    };
    if(/fosfomycin/.test(x)) return {
      reconstitution:'Lọ 2 g: thêm khoảng 20 mL nước cất pha tiêm và lắc đến tan hoàn toàn.',
      dilution:'Pha tiếp dung dịch đã hoàn nguyên vào 100–200 mL glucose 5% hoặc dung dịch tương hợp.',
      administration:'Truyền tĩnh mạch chậm trong 1–2 giờ.',
      line:'Không trộn trực tiếp với thuốc khác. Dùng đường riêng hoặc súc rửa dây truyền; theo dõi tải natri, kali và dịch.',
      stability:'Chuẩn bị gần thời điểm dùng; loại bỏ dung dịch có kết tủa hoặc đổi màu.'
    };
    if(/colistin/.test(x)) return {
      reconstitution:'Lọ 2 triệu IU: thêm khoảng 10 mL nước cất pha tiêm hoặc natri clorid 0,9%; xoay nhẹ đến tan, tránh lắc mạnh tạo bọt.',
      dilution:'Pha tiếp liều đã hoàn nguyên vào 50–100 mL natri clorid 0,9% hoặc glucose 5%.',
      administration:'Truyền tĩnh mạch trong 30–60 phút. Không tiêm nhanh.',
      line:'Không trộn trực tiếp với thuốc khác; dùng đường riêng hoặc súc rửa đường truyền.',
      stability:'Dùng ngay sau khi pha để hạn chế chuyển đổi colistimethate thành colistin; loại bỏ phần còn dư.'
    };
    return {
      reconstitution:'Dữ liệu hoàn nguyên chưa được chuẩn hóa cho đúng chế phẩm trong danh mục.',
      dilution:'Dữ liệu pha loãng chưa được chuẩn hóa cho đúng chế phẩm trong danh mục.',
      administration:'Chưa hiển thị tốc độ truyền để tránh đưa ra thông số không được xác minh.',
      line:'Dùng đường truyền riêng và súc rửa dây trước, sau khi truyền cho đến khi có dữ liệu tương hợp cụ thể.',
      stability:'Không lưu dung dịch sau pha khi chưa có dữ liệu ổn định được xác minh.'
    };
  }
  D.forEach(d=>{d.infusionStructured=set(d.active,d.route,d.strength);});
})();
