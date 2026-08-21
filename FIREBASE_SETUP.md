# Firebase Setup — VoNo

Trạng thái tích hợp Firebase cho app **VoNo - Tìm Nhà Nhanh** (Expo SDK 54, React Native).
Cập nhật: 20/08/2026
 
## Mục tiêu

Thay thế toàn bộ dữ liệu mock (`data/mock.ts`, `context/app-context.tsx`) bằng Firebase, theo hướng **EAS Build + `@react-native-firebase` (native SDK)**.

---

## ✅ ĐÃ HOÀN THÀNH

### 1. Firebase Console (user làm)

1. Tạo Firebase project — **`vono-app-1b443`**
2. Add app **Android** package id `com.vono.app`
3. Add app **iOS** bundle id `com.vono.app`
4. Bật **Authentication → Sign-in method → Phone**
5. Tải về và đặt vào thư mục gốc project:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)
6. Đã thêm **SHA-1 + SHA-256** fingerprint của keystore EAS vào app Android (bắt buộc cho Phone Auth).

### 2. Code & cấu hình (đã làm)

**Packages:**
```json
"@react-native-firebase/app": "^26.3.0",
"@react-native-firebase/auth": "^26.3.0",
"@react-native-firebase/firestore": "^26.3.0",
"@react-native-firebase/storage": "^26.3.0",
"expo-build-properties": "~1.0.10",
"expo-dev-client": "~6.0.21",
"eas-cli": "^22.0.0"
```

**app.json:**
- `slug` = `vono-tim-nha-nhanh` (đổi từ `VoNo` để khớp EAS project)
- `extra.eas.projectId` = `16cc11ec-e878-43da-b01f-5cff17632843`
- `ios.bundleIdentifier` = `com.vono.app` + `ios.googleServicesFile`
- `android.package` = `com.vono.app` + `android.googleServicesFile`
- Plugins: `@react-native-firebase/app`, `@react-native-firebase/auth`, `expo-build-properties` (`ios.useFrameworks: "dynamic"`)
- `firestore`/`storage` không cần config plugin.

**eas.json:** profile `development` (dev client), `preview`, `production`.

**app.config.js:** vì 2 file Firebase bị gitignore, copy chúng từ EAS file env vars (`GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICES_PLIST`) vào đúng vị trí trước prebuild. **Lưu ý: file env var của EAS là ĐƯỜNG DẪN file, phải copy chứ không ghi nội dung** (đã sửa bug này).

**Code Auth (phone OTP):**
- `firebase/index.ts` — cờ `firebaseEnabled` (tắt Firebase trên Expo Go/web để không crash).
- `firebase/auth.ts` — `sendOtp`, `verifyOtp`, `fetchUserProfile`, `saveUserProfile`, `onAuthStateChange`, `signOutFirebase`, chuẩn hóa SĐT +84.
- `app/auth.tsx` — luồng đăng nhập SĐT 2 bước (nhập SĐT → OTP → tự tạo/lấy profile → vào app).
- `context/app-context.tsx` — lắng nghe trạng thái đăng nhập, khôi phục session khi mở lại app; `signIn`/`signOut`/`updateUser` đồng bộ xuống Firestore.
- `types/index.ts` — thêm trường `uid` vào `User`.

**Kiểm tra:** `npx tsc --noEmit` ✅ · `npm run lint` ✅ · `npx expo config --introspect` ✅

### 3. EAS Build (đã làm)

- Đã login EAS (`mylamne`), project **`@vono-gtd/vono-tim-nha-nhanh`**
- Tạo 2 file env vars `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICES_PLIST` (visibility `secret`, cả 3 môi trường) bằng lệnh:
  ```sh
  npx eas-cli env:set --name GOOGLE_SERVICES_JSON --type file --visibility secret --value ./google-services.json --environment development --environment preview --environment production --non-interactive
  npx eas-cli env:set --name GOOGLE_SERVICES_PLIST --type file --visibility secret --value ./GoogleService-Info.plist --environment development --environment preview --environment production --non-interactive
  ```
- **Build dev Android THÀNH CÔNG** (lần 1 lỗi do bug app.config.js, đã sửa, lần 2 OK):
  - Build ID: `5779dbeb-a857-4e2f-80b1-8e88303ee3ce`
  - Link cài: https://expo.dev/accounts/vono-gtd/projects/vono-tim-nha-nhanh/builds/5779dbeb-a857-4e2f-80b1-8e88303ee3ce
- **Build preview Android THÀNH CÔNG** (JS nhúng sẵn, chạy độc lập KHÔNG cần Metro — test từ xa được):
  - Build ID: `51cd640c-9f13-4d06-a1df-437636da488d`
  - Link cài: https://expo.dev/accounts/vono-gtd/projects/vono-tim-nha-nhanh/builds/51cd640c-9f13-4d06-a1df-437636da488d
  - APK trực tiếp: https://expo.dev/artifacts/eas/sCGkvF4IAzzIDHbteSSnXDUalYIlo014stum5BVBgTc.apk

---

## ⏳ ĐANG CHỜ / CHƯA LÀM

### 4. Test đăng nhập SĐT trên Android

- **Bản preview** (dùng được từ xa, không cần Metro): tải APK ở mục 3, cài, mở là vào thẳng app → Tài Khoản → Đăng nhập → nhập SĐT → nhận OTP → vào app. Chỉ cần internet (4G) cho Firebase.
- **Bản dev** (khi cùng WiFi): cài dev build → `npx expo start` → mở app (dev client kết nối Metro) → Tài Khoản → Đăng nhập → SĐT → OTP.

### 5. Build iOS (dùng Apple ID miễn phí) — CHƯA LÀM

**Yêu cầu:**
- Apple ID (miễn phí) — app dev **hết hạn sau 7 ngày**, giới hạn ~3 thiết bị/7 ngày.
- Tạo **App-Specific Password**: https://appleid.apple.com → Sign-In and Security → App-Specific Passwords → Generate.

**Các bước:**
```sh
npx eas-cli build --profile development --platform ios
```
- Nhập Apple ID + app-specific password khi được hỏi.
- EAS tự tạo certificate + provisioning profile + đăng ký UDID iPhone.
- Build xong mở link trên iPhone để cài.
- Lưu ý: free account **không test được FCM push** trên iOS → test push trên Android.

### 6. Firestore — ĐÃ LÀM ✅

Chuyển dữ liệu mock sang **Firestore** (realtime). Khi app chạy bằng dev/preview build (`firebaseEnabled`), toàn bộ dữ liệu đọc/ghi từ Firestore; chạy Expo Go/web vẫn dùng mock để không crash.

**Collections:**
| Collection | Cấu trúc | Ghi chú |
|---|---|---|
| `users/{uid}` | hồ sơ user | đã có từ Auth |
| `listings/{id}` | tin đăng + `ownerUid` | seed dữ liệu mẫu ownerUid rỗng |
| `favorites/{uid}` | `{ listingIds: string[] }` | 1 doc/user |
| `leads/{id}` | lead + `ownerUid` | lead demo ownerUid rỗng |

**Đã làm:**
- `firebase/firestore.ts` — service: `subscribeListings`, `subscribeFavorites`, `toggleFavoriteRemote`, `addListingRemote`, `updateListingRemote`, `deleteListingRemote`, `markRentedRemote`, `incrementListingViews`, `subscribeLeads`, `updateLeadStatusRemote`, `seedFirestoreDataIfEmpty`.
- `context/app-context.tsx` — realtime listings + favorites; `myListings` = tin có `ownerUid` trùng user; `addListing` async; `trackView` tăng lượt xem.
- `app/(tabs)/account.tsx` — khách quan tâm đọc từ Firestore (lead riêng + lead mẫu).
- `app/(tabs)/post.tsx` — submit await `addListing`.
- `types/index.ts` — thêm `ownerUid?` vào `Listing`.
- `firestore.rules` — rules an toàn (**ĐÃ DEPLOY 21/08/2026** ✅).
- `npx tsc --noEmit` ✅ · `npm run lint` ✅

**Seed tự động:** khi collection `listings` trống, app tự đẩy 14 tin mẫu + khách quan tâm lên Firestore (1 lần/session).

**20 phòng đẹp có ảnh thật:** `npm run seed:rooms` (`scripts/seed-rooms.ts`) — ghi đè 20 tin công khai `bds001`–`bds020` với **ảnh phòng ở thật từ Unsplash** (3 ảnh/tin, đã kiểm tra URL sống), giữ nguyên tin demo & tin người dùng. Đã chạy 21/08/2026 ✅ — hiện Firestore có 23 tin (20 phòng mới + 3 của chủ nhà demo).

**Đã làm 21/08/2026:**
- Cài `firebase-tools`, login `hhd211105@gmail.com`, tạo `firebase.json` + alias default.
- `firebase deploy --only firestore:rules` ✅ — CLI đồng thời tự tạo Firestore database (default) vì trước đó project CHƯA có database → dữ liệu chưa từng lưu thật lên cloud. Mở app lần nữa sẽ tự seed lên DB mới.
- **Fix seed bị rules chặn**: rules yêu cầu `signedIn()` mà seed chạy khi khách chưa đăng nhập → thêm **đăng nhập ẩn danh** (`ensureSessionSignIn` trong `firebase/auth.ts`): khách có session để seed/tăng views qua được rules nhưng UI vẫn hiện "Khách". ⚠️ Đã bật Anonymous provider trên Console (bắt buộc).
- **Analytics thật**: `savedCount` tăng khi bấm Lưu tin (`incrementListingSaves`), contactCount tăng khi bấm Gọi.
- **Script seed từ máy tính**: `scripts/seed-firestore.ts` + `npm run seed` (dùng `firebase-admin` + `serviceAccountKey.json` ở thư mục gốc, đã gitignore). Đã chạy thành công: **14 listings + 5 leads + 6 videos** đang nằm trên Firestore. Lệnh `npm run seed -- --force` xóa rồi nạp lại.
- **Dữ liệu demo đủ 6 collection**: `scripts/seed-demo-users.ts` + `npm run seed:demo` — tạo 2 tài khoản Auth thật (SĐT `0903000001` chủ nhà demo / `0903000002` người thuê demo) + hồ sơ users, 3 tin của chủ demo, 3 leads, 3 notifications, favorites. Đăng nhập SĐT `0903000001` là thấy dashboard đầy đủ. ⚠️ Ai có SĐT này đều OTP vào được tài khoản demo.
- **Videos đọc Firestore**: ĐÃ LÀM ✅ (21/08/2026) — thêm `subscribeVideos` + state `videos` trong context (realtime, Expo Go fallback mock). Trang chủ và màn xem video dùng dữ liệu Firestore; màn video có trạng thái "Đang tải" khi list chưa về.
- **FCM Push**: ĐÃ LÀM CODE ✅ (21/08/2026), CHỜ BUILD LẠI APP ĐỂ TEST:
  - Cài `@react-native-firebase/messaging@26.3.0` (native mới → phải build lại APK/IPA).
  - `firebase/messaging.ts` — xin quyền thông báo + lưu FCM token vào `users/{uid}.fcmTokens` (gọi khi đăng nhập SĐT thật / khôi phục session).
  - Collection `notifications/{id}`: `{uid, role, icon, title, body, createdAt}` — rules đã deploy (người nhận chỉ đọc của mình, không sửa/xóa).
  - Khi khách bấm Gọi tạo lead → tự tạo notification cho chủ tin → hiện realtime trong THÔNG BÁO (account.tsx, Expo Go fallback mock).
  - `scripts/send-push.ts` + `npm run push -- <uid|all> "Tiêu đề" "Nội dung" [/listing/<id>]` — gửi push thật từ máy tính qua firebase-admin. Tham số thứ 4 là route: bấm vào thông báo sẽ mở đúng màn hình đó (`data.route`, xử lý cả app đang nền lẫn app tắt hẳn qua `onPushOpened`/`getInitialPushRoute` trong `_layout.tsx`).
  - iOS thêm `UIBackgroundModes: remote-notification`. Lưu ý: push foreground (app đang mở) không tự hiện banner — cần notifee nếu muốn; push nền/tắt app hiển thị bình thường.
  - **Build preview Android chứa FCM — THÀNH CÔNG (21/08/2026):**
    - Build ID: `0b32fe70-87b6-41df-b95a-9ebdf0dbdd86`
    - APK trực tiếp: https://expo.dev/artifacts/eas/xHXjcAU4IxC6qorkEE8lqx5hSTzScCGPA8BQZZygUPI.apk
    - (APK preview cũ 51cd640c đã lỗi thời — không có messaging/videos/leads)

**Cần user làm:**
- Khi cần xóa dữ liệu test: xóa toàn bộ doc trong `listings` (app sẽ tự seed lại khi mở).

### 7. Code tích hợp tiếp (chưa làm)

- **Storage**: thay bằng **Cloudinary** ✅ HOÀN THÀNH (21/08/2026) — `utils/cloudinary.ts` upload ảnh trực tiếp từ app (unsigned preset, không cần API secret). `post.tsx` tự upload ảnh local khi bấm Đăng tin/Lưu (nút hiện "ĐANG TẢI ẢNH x/y..."), ảnh đã là URL giữ nguyên. Đã cấu hình + test upload thành công: cloud `ovfyu2dv`, preset `vono_unsigned`.
- **Cloud Messaging**: push notification (thay `MOCK_NOTIFICATIONS` đang dùng trong account)
- **Analytics**: ĐÃ LÀM ✅ — views (mở tin), contactCount (bấm Gọi), savedCount (Lưu tin) đều tăng thật trên Firestore. Chỉ thiếu: chưa đếm khi khách CHƯA đăng nhập lưu tin (cố ý, tránh spam).
- **Leads**: ĐÃ LÀM ✅ (21/08/2026) — khách bấm "Gọi" trên tin → tăng `contactCount` thật + tạo lead thật cho chủ tin (`addLeadRemote`, 1 lead/tin/session, chỉ khi đã đăng nhập và không phải tin của mình). Lead thật lưu `createdAt` (serverTimestamp), hiển thị dạng "x phút trước" tự tính (`relativeTimeFromNow`).

---

## Lưu ý chung

- `@react-native-firebase` **không chạy trong Expo Go** — phải dùng development build.
- `google-services.json` / `GoogleService-Info.plist` đã gitignore — cấp qua EAS env vars khi build cloud.
- Cảnh báo `REVERSED_CLIENT_ID not found in GoogleService-Info.plist` chỉ liên quan **Google Sign-In**, không ảnh hưởng Phone auth.