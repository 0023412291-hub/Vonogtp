import {
  arrayUnion,
  doc,
  getFirestore,
  setDoc,
} from '@react-native-firebase/firestore';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  requestPermission,
} from '@react-native-firebase/messaging';

/** Xin quyền hiện thông báo (Android 13+ POST_NOTIFICATIONS / iOS) */
export async function ensurePushPermission(): Promise<boolean> {
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
 */
export async function registerFcmToken(uid: string): Promise<void> {
  if (!(await ensurePushPermission())) return;
  const token = await getToken(getMessaging());
  await setDoc(
    doc(getFirestore(), 'users', uid),
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
  return onNotificationOpenedApp(getMessaging(), (message) => {
    const route = extractPushRoute(message.data);
    if (route) handler(route);
  });
}

/** App được mở từ trạng thái tắt hẳn nhờ bấm push → route cần mở (hoặc null) */
export async function getInitialPushRoute(): Promise<string | null> {
  const message = await getInitialNotification(getMessaging());
  return extractPushRoute(message?.data);
}
