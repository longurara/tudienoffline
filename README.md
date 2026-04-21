# Tu Dien Offline

Trang web nay dung de tra tu dien Anh - Viet va Viet - Anh ngay tren may, khong can cai server.

## Dung nhanh cho nguoi moi

1. Mo file `index.html` o thu muc goc cua du an.
2. Trinh duyet se mo giao dien tu dien.
3. Chon bo du lieu phu hop:
   - `Dictionary 1`: nhe hon, mo nhanh hon
   - `Dictionary 2`: ban FULL, nang hon rat nhieu
   - `Ca 2`: ghep ca hai bo du lieu, nang nhat
4. Go tu khoa vao o tim kiem de bat dau tra.

Ban cung co the mo truc tiep cac file trong thu muc `web`:

- `index.html`: chi dung `Dictionary 1`
- `index-dict2.html`: chi dung `Dictionary 2`
- `index-both.html`: dung ca hai bo du lieu

## Canh bao quan trong

- Neu chon `Dictionary 2` hoac `Ca 2`, hay chuan bi cho viec cho doi lau.
- Tren may cham hoac khi trinh duyet thieu RAM, viec nap du lieu co the mat khoang `10-15 phut`.
- Trong luc dang nap, trinh duyet co the trong nhu bi dung, cham phan hoi, hoac chua hien ket qua ngay. Day la hien tuong co the xay ra do file du lieu rat lon.
- Khong nen dong cua so qua som neu ban vua chon `Dictionary 2` hoac `Ca 2`.

Neu ban muon mo nhanh va tra co ban, nen uu tien `Dictionary 1`.

## Cac che do tra cuu

- `Tu dong`: tu nhan dien nen uu tien tra Anh -> Viet hay Viet -> Anh
- `Anh -> Viet`: tim theo muc tu tieng Anh
- `Viet -> Anh`: tim nguoc trong nghia, chu thich va noi dung tieng Viet

## Khi nao nen dung tung bo du lieu

- `Dictionary 1`: khi can mo nhanh, may yeu, hoac chi muon tra cuu hang ngay
- `Dictionary 2`: khi can bo FULL, chap nhan doi lau hon
- `Ca 2`: khi muon tra rong nhat, nhung day la tuy chon nang nhat

## Cau truc file trong thu muc `web`

- `index.html`: trang danh cho `Dictionary 1`
- `index-dict2.html`: trang danh cho `Dictionary 2`
- `index-both.html`: trang danh cho ca hai bo du lieu
- `main.js`: xu ly tim kiem, doi mode, hien thi ket qua
- `styles.css`: giao dien
- `dictionary-data.js`: du lieu tu dien nhe hon
- `dictionary-data2.js`: du lieu tu dien FULL, rat lon

## Luu y ky thuat

- Ung dung duoc thiet ke de mo truc tiep bang file local.
- Khong can backend de su dung co ban.
- Cac file du lieu duoc sinh tu file `.prc`, khong nen sua tay.
- Do gioi han bao mat cua `file://`, du an dung nhieu file HTML tach rieng thay vi lazy-load dong trong mot trang duy nhat.

## Neu gap van de

- Neu mo lau, hay cho them, dac biet voi `Dictionary 2` va `Ca 2`.
- Neu trinh duyet bi treo qua lau, thu dong lai va mo ban `Dictionary 1` truoc.
- Neu chu hien thi bi vo dau hoac tach ky tu, thu dong tab cu roi mo lai file `index.html`.
