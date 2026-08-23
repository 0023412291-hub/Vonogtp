# VoNo - Tìm Nhà Nhanh

Ứng dụng tìm & đăng tin thuê nhà tại TP.HCM dành cho sinh viên.
Công nghệ: **Expo SDK 54** (React Native + Expo Router) · **Firebase** (`@react-native-firebase`: Auth OTP, Firestore, FCM) · **Cloudinary** (ảnh tin đăng).

## Tính năng

- Duyệt tin dạng lưới/danh sách realtime (Firestore), lọc giá/quận/loại hình/khoảng cách tới trường
- Tìm kiếm trên bản đồ (`react-native-maps`)
- Chi tiết tin, liên hệ chủ nhà (tạo lead + thông báo), yêu thích, lịch sử xem
- Đăng tin kèm ảnh (upload Cloudinary), quản lý tin: xóa / đánh dấu đã cho thuê
- Đăng nhập/đăng ký bằng **email + mật khẩu** (Firebase Email Auth, có quên mật khẩu); trong Expo Go dùng "tài khoản dùng thử"
- Push notification FCM — token lưu tại `users/{uid}.fcmTokens`

## Chạy dự án

```bash
npm install
npm start                # Expo Go — dữ liệu mock + tài khoản dùng thử
npx expo start --tunnel  # kết nối dev build (APK) trên điện thoại thật
```

Bản **dev/preview build** (APK Android) chứa Firebase thật: OTP, Firestore, FCM.
Chi tiết cấu hình Firebase / EAS Build xem [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

## Cấu trúc thư mục

| Thư mục | Nội dung |
|---|---|
| `app/` | Màn hình (expo-router): `(tabs)`, `auth`, `post`, `listing/[id]`, `search`, `settings`, `terms`, `support`, onboarding |
| `components/` | UI dùng chung (card, form, modal...) |
| `context/` | `AppContext` — trạng thái toàn cục, đồng bộ Firestore/mock |
| `firebase/` | Service layer: `auth.ts`, `firestore.ts`, `messaging.ts`, cờ `firebaseEnabled` |
| `data/` | Dữ liệu mock cho chế độ Expo Go/web |
| `types/`, `utils/`, `constants/` | Kiểu dữ liệu, helper (cloudinary, filters, formatters), màu sắc |
| `scripts/` | `seed-firestore.ts`, `seed-demo-users.ts`, `send-push.ts` |

## Scripts hữu ích

```bash
npm run seed                          # nạp dữ liệu mẫu lên Firestore (cần serviceAccountKey.json)
npm run seed -- --force               # xóa và nạp lại
npm run seed:demo                     # tạo 2 tài khoản demo: chunha@vono.demo / thuenha@vono.demo (mật khẩu vono123)
npm run push -- <uid|all> "Tiêu đề" "Nội dung"   # gửi push FCM từ máy tính
npm run lint && npx tsc --noEmit      # kiểm tra chất lượng code
```
