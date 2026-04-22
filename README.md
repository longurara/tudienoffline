# Từ Điển Offline

Trang web này dùng để tra từ điển Anh - Việt và Việt - Anh ngay trên máy, không cần cài server.

## Dùng nhanh cho người mới

1. Mở file `index.html` ở thư mục gốc của dự án.
2. Trình duyệt sẽ mở giao diện từ điển.
3. Chọn bộ dữ liệu phù hợp:

   * `Dictionary 1`: nhẹ hơn, mở nhanh hơn
   * `Dictionary 2`: bản FULL, nặng hơn rất nhiều
   * `Cả 2`: ghép cả hai bộ dữ liệu, nặng nhất
4. Gõ từ khóa vào ô tìm kiếm để bắt đầu tra.

Bạn cũng có thể mở trực tiếp các file trong thư mục `web`:

* `index.html`: chỉ dùng `Dictionary 1`
* `index-dict2.html`: chỉ dùng `Dictionary 2`
* `index-both.html`: dùng cả hai bộ dữ liệu

## Cảnh báo quan trọng

* Nếu chọn `Dictionary 2` hoặc `Cả 2`, hãy chuẩn bị cho việc chờ đợi lâu.
* Trên máy chậm hoặc khi trình duyệt thiếu RAM, việc nạp dữ liệu có thể mất khoảng `10-15 phút`.
* Trong lúc đang nạp, trình duyệt có thể trông như bị đơ, phản hồi chậm, hoặc chưa hiện kết quả ngay. Đây là hiện tượng có thể xảy ra do file dữ liệu rất lớn.
* Không nên đóng cửa sổ quá sớm nếu bạn vừa chọn `Dictionary 2` hoặc `Cả 2`.

Nếu bạn muốn mở nhanh và tra cơ bản, nên ưu tiên `Dictionary 1`.

## Các chế độ tra cứu

* `Tự động`: tự nhận diện nên ưu tiên tra Anh -> Việt hay Việt -> Anh
* `Anh -> Việt`: tìm theo mục từ tiếng Anh
* `Việt -> Anh`: tìm ngược trong nghĩa, chú thích và nội dung tiếng Việt

## Khi nào nên dùng từng bộ dữ liệu

* `Dictionary 1`: khi cần mở nhanh, máy yếu, hoặc chỉ muốn tra cứu hằng ngày
* `Dictionary 2`: khi cần bộ FULL, chấp nhận đợi lâu hơn
* `Cả 2`: khi muốn tra rộng nhất, nhưng đây là tùy chọn nặng nhất

## Cấu trúc file trong thư mục `web`

* `index.html`: trang dành cho `Dictionary 1`
* `index-dict2.html`: trang dành cho `Dictionary 2`
* `index-both.html`: trang dành cho cả hai bộ dữ liệu
* `main.js`: xử lý tìm kiếm, đổi mode, hiển thị kết quả
* `bootstrap.js`: nạp dữ liệu và hiển thị trạng thái loading
* `styles.css`: giao diện
* `dictionary-data.js`: dữ liệu từ điển nhẹ hơn
* `dictionary-data2.js`: file nguồn FULL trước khi tách chunk
* `dictionary-data2-manifest.js`: manifest cho bộ FULL đã tách chunk
* `dictionary-data2_1.js`, `dictionary-data2_2.js`, ...: các chunk của bộ FULL

## Lưu ý kỹ thuật

* Ứng dụng được thiết kế để mở trực tiếp bằng file local.
* Không cần backend để sử dụng cơ bản.
* Các file dữ liệu được sinh từ file `.prc`, không nên sửa tay.
* Do giới hạn bảo mật của `file://`, dự án dùng nhiều file HTML tách riêng thay vì lazy-load động trong một trang duy nhất.
* `Dictionary 2` hiện được tách thành nhiều file chunk để dễ theo dõi tiến độ và giảm áp lực nạp một file JS quá lớn.

## Nếu gặp vấn đề

* Nếu mở lâu, hãy chờ thêm, đặc biệt với `Dictionary 2` và `Cả 2`.
* Nếu trình duyệt bị treo quá lâu, thử đóng lại và mở bản `Dictionary 1` trước.
* Nếu chữ hiển thị bị vỡ dấu hoặc tách ký tự, thử đóng tab cũ rồi mở lại file `index.html`.
