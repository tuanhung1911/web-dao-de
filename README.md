# Hướng Dẫn Triển Khai Web Đảo Đề (Exam Shuffler) Lên Firebase

Tài liệu này hướng dẫn chi tiết cách cấu hình và triển khai tự động (CI/CD) dự án **web-dao-de** lên Firebase Hosting thông qua GitHub Actions.

---

## Phần 1: Chuẩn bị trên Firebase Console

1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Nhấn **Add project** (Thêm dự án).
3. Đặt tên dự án là: `web-dao-de` (Nếu tên này đã bị người khác lấy, Firebase sẽ thêm số ngẫu nhiên phía sau, ví dụ `web-dao-de-1234`. Hãy nhớ **Project ID** chính xác này).
4. Tắt Google Analytics (không cần thiết cho dự án này) và nhấn **Create project**.
5. Sau khi tạo xong, vào mục **Build** > **Hosting** ở menu bên trái.
6. Nhấn **Get started** > **Next** > **Next** > **Continue to console** (Bạn chỉ cần kích hoạt Hosting, chưa cần cài đặt CLI lúc này).

---

## Phần 2: Cập nhật Code

Trước khi đẩy code lên GitHub, bạn cần cập nhật ID dự án vào 2 file cấu hình sau:

### 1. Cập nhật file `.firebaserc`
Mở file `.firebaserc` và sửa nội dung thành (thay `web-dao-de` bằng Project ID thực tế của bạn nếu khác):

```json
{
  "projects": {
    "default": "web-dao-de"
  }
}
```

### 2. Cập nhật file Workflow GitHub
Mở file `.github/workflows/firebase-hosting-merge.yml`.
Tìm dòng `projectId` ở dưới cùng và sửa thành:

```yaml
          projectId: web-dao-de
```

Tìm dòng `firebaseServiceAccount` và đảm bảo tên biến bí mật khớp với quy tắc đặt tên (ví dụ):
```yaml
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_WEB_DAO_DE }}'
```

---

## Phần 3: Lấy khóa bí mật (Service Account) từ Google Cloud

Để GitHub có quyền deploy lên Firebase của bạn, cần một khóa Service Account.

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Đảm bảo bạn đang chọn đúng dự án `web-dao-de` ở trên thanh menu trên cùng.
3. Mở menu bên trái, chọn **IAM & Admin** > **Service Accounts**.
4. Bạn sẽ thấy một tài khoản có tên dạng `firebase-adminsdk-...`. Nhấn vào email của tài khoản đó.
5. Chuyển sang tab **Keys**.
6. Nhấn **Add Key** > **Create new key**.
7. Chọn định dạng **JSON** và nhấn **Create**.
8. Một file `.json` sẽ được tải xuống máy tính của bạn. **Mở file này bằng Notepad/Text Editor và copy toàn bộ nội dung bên trong.**

---

## Phần 4: Cấu hình GitHub Repository

1. Tạo một Repository mới trên GitHub.
2. Đẩy (Push) toàn bộ code của bạn lên Repository đó.
3. Trên trang GitHub của dự án, vào mục **Settings**.
4. Ở menu bên trái, chọn **Secrets and variables** > **Actions**.
5. Nhấn nút **New repository secret**.
   - **Name:** Điền tên giống hệt bạn đã cấu hình trong file yml ở Phần 2. Ví dụ: `FIREBASE_SERVICE_ACCOUNT_WEB_DAO_DE`.
   - **Secret:** Dán toàn bộ nội dung file JSON bạn vừa copy ở Phần 3 vào đây.
6. Nhấn **Add secret**.

---

## Phần 5: Kích hoạt Deploy

Quy trình đã hoàn tất. Bây giờ, mỗi khi bạn có thay đổi và đẩy code lên nhánh `main`, GitHub Actions sẽ tự động chạy.

1. Để kiểm tra, hãy thử sửa nhẹ một file (ví dụ thêm dấu chấm vào file `index.html`) rồi commit và push lên `main`.
2. Trên GitHub, chuyển sang tab **Actions**.
3. Bạn sẽ thấy một quy trình (Workflow) đang chạy màu vàng.
4. Khi chuyển sang màu xanh lá (Success), hãy vào Firebase Console > Hosting, bạn sẽ thấy đường link trang web (thường là `https://web-dao-de.web.app`).

---

## Khắc phục sự cố thường gặp

- **Lỗi: "Error: Process completed with exit code 1" tại bước Build:**
  - Kiểm tra xem máy tính của bạn chạy lệnh `npm run build` có thành công không. Nếu lỗi cục bộ, nó sẽ lỗi trên GitHub.
  
- **Lỗi: "HTTP Error: 403, The caller does not have permission":**
  - Kiểm tra lại xem nội dung Secret trong GitHub đã dán đúng toàn bộ file JSON chưa.
  - Kiểm tra xem Project ID trong `.firebaserc` và file `.yml` có khớp nhau và khớp với trên Firebase Console không.

Chúc bạn thành công!
