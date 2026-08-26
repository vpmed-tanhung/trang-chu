# Rà soát đơn thuốc BHYT & dịch vụ

Tính năng được mở từ thẻ **Rà soát đơn thuốc BHYT & dịch vụ** trên trang chủ hoặc đường dẫn `#prescription-check`.

## Chức năng đã có

- Nhận danh sách thuốc từ HIS bằng cách dán riêng danh sách thuốc hoặc nhập tay.
- Tải đồng thời tối đa 20 đơn của cùng người bệnh/lượt khám.
- Đọc tiêu đề từng ảnh để gợi ý loại đơn: BHYT hoặc dịch vụ; trường hợp không chắc chắn bắt buộc chọn thủ công.
- Tự đọc vùng chẩn đoán, phân loại MA_BENH_CHINH và các mã bệnh kèm theo; không yêu cầu nhập tay trong luồng bình thường.
- Nhận ảnh đơn thuốc bằng OCR cục bộ thử nghiệm; mọi tiêu đề và dòng thuốc phải được nhân viên y tế xác nhận.
- Chuẩn hóa tên thuốc theo 309 thuốc nội trú hiện có.
- Kiểm tra mọi cặp thuốc trong cùng đơn, kể cả cặp chéo giữa thuốc BHYT và thuốc dịch vụ, theo 633 cặp tương tác trong QĐ 5948/QĐ-BYT.
- Với thuốc được đánh dấu BHYT, đối chiếu mã bệnh theo mã chính xác và theo nhóm ICD có kiểm soát; chỉ cảnh báo khi không có mã trực tiếp hoặc cùng nhóm chỉ định đã xác minh.
- Cảnh báo thuốc chưa chuẩn hóa hoặc chưa có hồ sơ ICD để người dùng kiểm tra thủ công.
- In phiếu kết quả rà soát.

## Bắt đầu đơn mới

Nút **Đơn mới** chỉ được bật sau khi đã kiểm tra đơn. Khi bấm và xác nhận, hệ thống xóa mã bệnh, danh sách thuốc, tệp đã tải và kết quả hiện tại để tiếp tục lượt rà soát kế tiếp.

## Quy tắc phân loại nhiều đơn

- Dấu hiệu mạnh `ĐƠN THUỐC BHYT`, `Quầy Phát Thuốc Bảo Hiểm` hoặc `Quầy Phát Thuốc Bảo Hiểm Y Tế`: gợi ý **BHYT** và được ưu tiên khi OCR đồng thời đọc được vùng liên hệ của nhà thuốc.
- Tiêu đề có `BHYT` hoặc `Bảo hiểm y tế`: gợi ý **BHYT**.
- Tiêu đề có `Dịch vụ`, `Tự túc`, `Thu phí`, `Ngoài BHYT`, `Không BHYT` hoặc `Không bảo hiểm`: gợi ý **Dịch vụ**.
- Mẫu có cụm `Nhà thuốc Bệnh Viện` (bao gồm dòng `Liên hệ: Nhà thuốc Bệnh Viện` hoặc cụm này dưới tên phòng khám): gợi ý **Dịch vụ** khi không có dấu hiệu BHYT mạnh. Tiêu đề `ĐƠN THUỐC` đứng một mình không đủ để phân loại.
- Không đọc rõ tiêu đề: **Chưa xác định** và không dùng thuốc của đơn đó để cảnh báo thiếu ICD cho đến khi nhân viên xác nhận.
- Không tải chung đơn của nhiều người bệnh hoặc nhiều lượt khám. Công cụ kiểm tra tương tác giữa tất cả thuốc đã tải trong một lượt.

## Quy tắc nhận diện mã bệnh

- Ưu tiên các nhãn `Chẩn đoán chính`, `Bệnh chính`, `Mã bệnh chính` hoặc `MA_BENH_CHINH`.
- Nhận các nhãn `Chẩn đoán kèm theo`, `Bệnh kèm`, `Bệnh phụ` hoặc `Mã bệnh kèm theo` làm chẩn đoán phụ.
- Lấy toàn bộ mã ICD xuất hiện trong từng vùng chẩn đoán, không chỉ mã đầu tiên. Mọi mã chính được giữ ở nhóm chính; mọi mã kèm theo được giữ ở nhóm kèm theo.
- Mỗi mã được giữ và hiển thị riêng đúng như mục chứa mã trên đơn; không gộp các mã có cùng ba ký tự đầu, không thay mã con bằng mã nhóm và không tự suy rộng sang mã cùng họ.
- Không cắt theo số lượng mã hoặc độ dài cố định của chuỗi chẩn đoán; vùng đọc chỉ kết thúc khi gặp mục chẩn đoán kế tiếp hoặc phần thuốc/kê đơn.
- Nếu một mã xuất hiện ở cả chẩn đoán chính và chẩn đoán kèm theo, mã đó được hiển thị ở cả hai nhóm; chỉ loại trùng bên trong chính cùng một nhóm.
- Mỗi ảnh in được OCR cục bộ ba lượt: toàn trang, khối văn bản tăng cường tương phản và văn bản thưa tăng cường tương phản. Kết quả của ba lượt được hợp nhất để giảm bỏ sót chuỗi mã dài.
- OCR nhận cả mã bị mất dấu chấm hoặc nhầm ký tự số thường gặp, sau đó chỉ giữ mã chính xác có trong danh mục ICD-10 Bộ Y tế 2026; không dùng ảnh đơn làm dữ liệu để bổ sung danh mục.
- Không quét ICD trên toàn ảnh. Mã nằm ở vùng số thẻ BHYT, mã người bệnh, thông tin hành chính hoặc bảng thuốc bị bỏ qua để tránh nhận nhầm dữ liệu định danh thành mã bệnh.
- Nếu nhiều đơn cho ra nhiều mã bệnh chính khác nhau, công cụ vẫn hiển thị đầy đủ các mã và đồng thời cảnh báo để nhân viên xác nhận; không tự chuyển mã chính thành mã bệnh kèm theo.
- Mục chỉnh sửa chỉ là phương án dự phòng khi ảnh mờ hoặc OCR đọc sai.

## Quy tắc đối chiếu ICD với thuốc

- Ưu tiên khớp chính xác toàn bộ mã ICD.
- Chỉ khớp theo nhóm ba ký tự khi hồ sơ nguồn thể hiện rõ mã cha, dùng mã `.9` làm đại diện không đặc hiệu, hoặc đã liệt kê từ hai mã con khác nhau trong cùng nhóm. Không coi mọi mã có ba ký tự đầu giống nhau là tương đương.
- Ví dụ kỹ thuật tổng quát: mã con cụ thể được chấp nhận khi hồ sơ thuốc dùng mã `.9` đại diện cho toàn nhóm; một mã con đơn lẻ không tự động mở rộng thành toàn nhóm.
- Mỗi lần khớp theo nhóm đều được ghi rõ trong kết quả để nhân viên y tế biết mã nào và nhóm nào đã được dùng để đối chiếu.
- Kết quả là hỗ trợ sàng lọc, không phải kết luận tự động về điều kiện thanh toán BHYT.

## Nguồn dữ liệu và thứ tự ưu tiên

- Hệ thống không coi dữ liệu nội bộ là phạm vi nguồn duy nhất. Dữ liệu cấu trúc trong ứng dụng chỉ là lớp cache/chuẩn hóa để hỗ trợ đối chiếu; căn cứ chuyên môn phải truy nguyên được về nguồn chính thức tương ứng.
- Thuốc: ưu tiên tờ hướng dẫn sử dụng/SPC đúng chế phẩm được Cục Quản lý Dược phê duyệt; tiếp theo là Dược thư Quốc gia Việt Nam lần xuất bản thứ ba ban hành theo QĐ 3445/QĐ-BYT và hướng dẫn chẩn đoán, điều trị của Bộ Y tế/Cục Quản lý Khám, chữa bệnh.
- Danh mục, tỷ lệ và điều kiện thanh toán BHYT: Thông tư 20/2022/TT-BYT, Thông tư 37/2024/TT-BYT, Thông tư 01/2025/TT-BYT và Nghị định 188/2025/NĐ-CP trong phạm vi liên quan.
- Mã bệnh: áp dụng Danh mục ICD-10 ban hành kèm Thông tư 06/2026/TT-BYT, có hiệu lực từ ngày 01/07/2026. Liên kết trỏ thẳng tới [văn bản chính](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt.pdf) và [Phụ lục Danh mục mã bệnh ICD-10](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/4/06-byt-kem.pdf).
- Kê đơn ngoại trú: Thông tư 26/2025/TT-BYT, đồng thời đối chiếu HDSD/SPC và hướng dẫn chuyên môn theo bệnh khi đánh giá chỉ định, liều và cách dùng.
- Tương tác chống chỉ định: Quyết định 5948/QĐ-BYT; lớp cảnh giác dược bổ sung được phân tầng theo QĐ 29/QĐ-BYT/Trung tâm DI&ADR Quốc gia và không tự động nâng thành chống chỉ định nếu văn bản không quy định.
- Khi một thuốc có hồ sơ kiểm chứng tăng cường theo đúng hoạt chất hoặc số đăng ký, hồ sơ này được ưu tiên hơn bản đồ ICD tổng hợp. Hồ sơ phải giữ nguồn dẫn chứng và không được dùng ảnh đơn thuốc của người dùng để mở rộng dữ liệu.
- Website không gửi ảnh đơn, toàn văn OCR hoặc mã bệnh của người dùng ra ngoài để tra cứu. Việc mở rộng nguồn áp dụng cho kho tài liệu chuyên môn/căn cứ được quản trị và các cổng chính thức, không làm thay đổi nguyên tắc tối thiểu hóa dữ liệu người bệnh.

## Quy tắc riêng tư và tối thiểu dữ liệu

- Chỉ nhận tệp ảnh; không có chế độ gửi ảnh lên OCR/Vision máy chủ.
- Tesseract.js chạy trong trình duyệt. Ảnh không được tải lên website hoặc dịch vụ bên ngoài.
- Toàn văn OCR chỉ tồn tại tạm trong biến xử lý và không được ghi vào giao diện, `localStorage`, cơ sở dữ liệu hoặc nhật ký.
- Tên tệp thật không được đọc hoặc hiển thị; hàng đợi chỉ dùng nhãn trung tính `Đơn 01`, `Đơn 02`.
- Sau mỗi ảnh, tham chiếu tới tệp được xóa; sau cả lô, OCR worker được kết thúc để giải phóng dữ liệu ảnh và văn bản thô.
- Chỉ giữ trong phiên: loại đơn, MA_BENH_CHINH, các mã bệnh kèm theo và thuốc đã chuẩn hóa.
- Không trích xuất hoặc lưu họ tên, mã người bệnh, ngày sinh, giới tính, địa chỉ, điện thoại hay số thẻ BHYT.
- Ảnh và nội dung OCR không được sử dụng để xây dựng dữ liệu nguồn hoặc huấn luyện.
- Ảnh người dùng cung cấp để báo lỗi chỉ được dùng để xác định đường đi gây lỗi; không trích nội dung của ảnh để sửa, mở rộng hay hard-code hồ sơ thuốc/ICD.

Do yêu cầu riêng tư này, PDF và OCR máy chủ không được hỗ trợ. Khả năng nhận chữ viết tay hoặc ảnh mờ có giới hạn.

## Giới hạn an toàn

- Cảnh báo ICD là đối chiếu với hồ sơ gợi ý hiện có, không phải kết luận được BHYT thanh toán.
- Phần gợi ý ICD chỉ dùng để đối chiếu; không có nút hoặc thao tác thêm mã bệnh từ kết quả gợi ý.
- Không tự động thêm mã bệnh khi không có chẩn đoán lâm sàng trong hồ sơ.
- Kết quả không loại trừ tương tác ngoài QĐ 5948, chống chỉ định theo bệnh nền, dị ứng, liều, xét nghiệm hoặc quy định thanh toán khác.

## Cập nhật 17/08/2026 — phân tầng nguồn tương tác chính thức

- QĐ 5948/QĐ-BYT là lớp chuẩn để xác định cặp tương tác chống chỉ định; hệ thống giữ đủ 633 cặp và hiển thị khác nhau giữa chống chỉ định tuyệt đối và chống chỉ định có điều kiện/ưu tiên tránh.
- Bổ sung lớp cảnh báo tương tác từ Trung tâm DI & ADR Quốc gia. Lớp này được ghi rõ là cảnh báo chuyên môn bổ sung trong khung giám sát ADR theo QĐ 29/QĐ-BYT và **không tự động được nâng thành chống chỉ định** nếu QĐ 5948 không quy định.
- TT26/2025/TT-BYT và TT37/2024/TT-BYT được ghi nhận theo đúng phạm vi kê đơn/BHYT, không dùng để tự sinh cặp tương tác thuốc.
- Khi dán danh sách từ HIS, tên hoạt chất có trong bộ tương tác/cảnh báo vẫn có thể được nhận diện dù chưa có trong danh mục kho nội trú hiện tại; các thuốc chưa chuẩn hóa vẫn phải được nhân viên y tế xác nhận.
