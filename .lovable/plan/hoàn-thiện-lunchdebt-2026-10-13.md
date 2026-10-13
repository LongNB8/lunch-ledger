# Hoàn thiện LunchDebt

## Kết quả rà soát
- Đã mở cả 5 trang bằng tài khoản hiện có: không có lỗi khi hiển thị; 9 kiểm tra tự động đều đạt.
- **Dễ mất dữ liệu đang nhập:** chuyển khỏi trang tạo bữa rồi quay lại làm mất toàn bộ nội dung; bỏ chọn rồi chọn lại một người không khôi phục phần món của họ.
- **Khó hiểu vì sao chưa lưu được:** khi tiền đã khớp nhưng thiếu tên bữa, nút Lưu bị khóa mà không nêu phần còn thiếu.
- **Dễ ghi nhận trả tiền nhầm:** chạm ô “Đã trả hết” lập tức ghi nhận toàn bộ khoản nợ; chỉ có hoàn tác trong thông báo ngắn.
- **Nội dung gửi nhóm chưa đúng:** bản chốt nợ gọi toàn bộ nợ tồn là tiền “tuần này” và dẫn đến mã VietQR, nhưng ứng dụng chưa có trang mã thanh toán.
- **Lịch sử có thể không đầy đủ khi dùng lâu:** các lần đọc bữa ăn, món và thanh toán không chia trang; toàn bộ lịch sử được đưa về trình duyệt để tính tổng và lọc ngày.
- **Có hai cách tính tiền cần thu:** trang chủ tự tính từ từng món, sổ nợ lấy số dư đã tính sẵn; dễ lệch nhau khi dữ liệu đọc thiếu hoặc cập nhật khác thời điểm.
- **Thiếu kiểm tra cho tiền ăn:** hiện chưa có kiểm tra tự động cho đối soát, chia tiền và ghi nhận/hoàn tác thanh toán.

## Thứ tự cải tiến
1. **Tạo bữa ăn rõ ràng và an toàn hơn**
   - Cảnh báo trước khi rời trang có nội dung chưa lưu, kể cả tải lại trang.
   - Xác nhận trước khi bỏ một người đang được chia món; không âm thầm đổi phần chia.
   - Hiển thị các mục còn thiếu ngay cạnh nút Lưu, số tiền đầy đủ bên dưới ô tổng hóa đơn, lỗi tải thành viên và nút thử lại.
   - Thêm lối sang trang Thành viên khi danh sách trống và thông báo khi tìm không có kết quả.
   - Giữ đơn vị nhập nghìn đồng và hành vi lưu xong mở đúng ngày, đúng bữa.
   - **Kiểm tra:** nhập một bữa, thử rời trang/hủy, bỏ người/hủy, làm khớp tiền, lưu và tải lại bảng kê.
2. **Ghi nhận thanh toán khó nhầm hơn**
   - Thay ô đánh dấu thanh toán bằng nút rõ tên người và hộp xác nhận số tiền.
   - Hiển thị đang xử lý, chặn bấm lặp và cập nhật lại cả trang chủ lẫn sổ nợ sau thành công/hoàn tác.
   - Đổi bản gửi nhóm thành công nợ hiện tại; bỏ lời hứa mã QR chưa có và dùng số tiền thực tế được ghi nhận trong thông báo.
   - **Kiểm tra:** hủy xác nhận không đổi nợ; xác nhận một khoản, xem trang chủ, hoàn tác và đọc lại số dư.
3. **Đọc lịch sử đầy đủ, thống nhất số dư**
   - Dùng chung số dư đã tính sẵn cho trang chủ và sổ nợ; tổng và chi tiết không phụ thuộc một danh sách bị cắt ngắn.
   - Đọc bảng kê theo ngày, chia trang cho “Tất cả ngày” và danh sách dài; tổng quan lấy số tổng hợp riêng, không tải toàn bộ lịch sử mỗi lần mở.
   - Tập trung phần tính chi tiết chia tiền vào một nơi dùng chung.
   - **Kiểm tra:** đối chiếu tổng trang chủ/sổ nợ/chi tiết; kiểm tra nhiều trang lịch sử không thiếu hoặc trùng dòng.
4. **Hoàn thiện trạng thái tài khoản và kiểm tra hồi quy**
   - Bổ sung đăng xuất trong menu tài khoản và giữ trang người dùng đang xem sau đăng nhập Google.
   - Việt hóa thông báo trang lỗi và trang không tồn tại, có nút thử lại rõ ràng.
   - Bỏ dữ liệu minh họa không còn được dùng; thêm kiểm tra đối soát, chia tiền, ngày thanh toán theo giờ Việt Nam và hoàn tác.
   - **Kiểm tra:** đăng xuất/đăng nhập, lỗi tải dữ liệu, liên kết sai, chạy lại các kiểm tra và kiểm tra từng bước trên bản xem trước.

## Chi tiết kỹ thuật
- Giữ TanStack Start, shell chung, semantic tokens và ranh giới server có xác thực hiện tại; không viết lại ứng dụng.
- Dùng TanStack navigation blocker cho nội dung chưa lưu; dùng Dialog/AlertDialog cho xác nhận.
- Giữ cache theo tài khoản, vô hiệu hóa đúng các query sau thay đổi; dùng truy vấn số dư chung và đọc phân trang có thứ tự ổn định.
- Mỗi bước giữ ứng dụng hoạt động; xác minh trên preview trước khi sang bước tiếp theo.
- Không sửa gói phụ thuộc, không thay đổi dữ liệu hiện có và không thêm mã QR/thanh toán trực tuyến trong đợt này.

## Bảo mật
Chưa có kết quả quét bảo mật để kết luận; hãy chạy quét từ mục **Security** trước khi đánh giá phần này. Đợt rà soát này không tự thực hiện kiểm toán bảo mật.