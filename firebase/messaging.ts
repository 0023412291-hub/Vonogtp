import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { arrayUnion, doc, setDoc } from 'firebase/firestore';

import { getFirebaseDb } from './app';

/**
 * RNFirebase Messaging cần native code — chỉ khả dụng trong development/production
 * build (Expo Go có appOwnership === 'expo'). Khai báo cục bộ thay vì import từ
 * './index' để không phụ thuộc barrel bị lỗi transform.
 */
const nativeMessagingAvailable =
  Platform.OS !== 'web' && Constants.appOwnership !== 'expo';

type FirebaseMessagingModule = typeof import('@react-native-firebase/messaging');

/**
 * RNFirebase cần native code — chỉ tồn tại trong development/production build.
 * Nạp lười bằng require() để Expo Go/web không crash lúc bundle được đánh giá;
 * khi thiếu native module trả về null và các hàm bên dưới tự no-op.
 */
function loadMessaging(): FirebaseMessagingModule | null {
  if (!nativeMessagingAvailable) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/messaging') as FirebaseMessagingModule;
  } catch {
    return null;
  }
}

/** Xin quyền hiện thông báo (Android 13+ POST_NOTIFICATIONS / iOS) */
export async function ensurePushPermission(): Promise<boolean> {
  const messaging = loadMessaging();
  if (!messaging) return false;
  const { AuthorizationStatus, getMessaging, requestPermission } = messaging;
  const status = await requestPermission(getMessaging());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Lưu FCM token của thiết bị vào hồ sơ user (`users/{uid}.fcmTokens`).
 * Server/script dùng danh sách token này để gửi push theo user.
 * Gọi sau khi user đăng nhập bằng SĐT thật.
 * Chỉ chạy trên build có native module — Expo Go/web bỏ qua im lặng.
 */
export async function registerFcmToken(uid: string): Promise<void> {
  if (!(await ensurePushPermission())) return;
  const messaging = loadMessaging();
  if (!messaging) return;
  const { getToken, getMessaging } = messaging;
  const token = await getToken(getMessaging());
  await setDoc(
    doc(getFirebaseDb(), 'users', uid),
    { fcmTokens: arrayUnion(token) },
    { merge: true },
  );
}

/** Đọc route đích (`data.route`, vd `/listing/abc`) từ payload push — không có thì bỏ qua */
function extractPushRoute(data?: {[key: string]: string | object}): string | null {
  const route = data?.route;
  return typeof route === 'string' && route.startsWith('/') ? route : null;
}

/**
 * Bấm push khi app đang chạy nền → trả về route cần mở.
 * Trả về hàm hủy lắng nghe.
 */
export function onPushOpened(handler: (route: string) => void): () => void {
  const messaging = loadMessaging();
  if (!messaging) return () => {};
  const { getMessaging, onNotificationOpenedApp } = messaging;
  return onNotificationOpenedApp(getMessaging(), (message) => {
    const route = extractPushRoute(message.data);
    if (route) handler(route);
  });
}

/** App được mở từ trạng thái tắt hẳn nhờ bấm push → route cần mở (hoặc null) */
export async function getInitialPushRoute(): Promise<string | null> {
  const messaging = loadMessaging();
  if (!messaging) return null;
  const { getMessaging, getInitialNotification } = messaging;
  const message = await getInitialNotification(getMessaging());
  return extractPushRoute(message?.data);
}
