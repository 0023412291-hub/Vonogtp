import {
  getAuth,
  onAuthStateChanged,
  PhoneAuthProvider,
  signInAnonymously,
  signInWithCredential,
  signInWithPhoneNumber,
  signOut,
} from '@react-native-firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from '@react-native-firebase/firestore';

import type { User } from '@/types';

/** Chuẩn hóa SĐT về dạng quốc tế +84 (Việt Nam) */
export function normalizeVietnamesePhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, '');
  if (p.startsWith('+84')) return p;
  if (p.startsWith('84')) return `+${p}`;
  if (p.startsWith('0')) return `+84${p.slice(1)}`;
  return `+84${p}`;
}

/** Chuyển SĐT quốc tế +84 về dạng hiển thị 0xxxxxxxxx */
export function formatPhoneVN(intl: string): string {
  return intl.startsWith('+84') ? `0${intl.slice(3)}` : intl;
}

export interface PendingVerification {
  verificationId: string;
  phone: string;
}

/** Gửi mã OTP tới SĐT — trả về confirmation cần giữ để xác minh ở bước sau */
export async function sendOtp(rawPhone: string): Promise<PendingVerification> {
  const phone = normalizeVietnamesePhone(rawPhone);
  const confirmation = await signInWithPhoneNumber(getAuth(), phone);
  return { verificationId: confirmation.verificationId, phone };
}

/** Xác minh mã OTP — đăng nhập (hoặc tạo) tài khoản Firebase */
export async function verifyOtp(
  verificationId: string,
  code: string,
): Promise<{ uid: string; phone: string }> {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const userCredential = await signInWithCredential(getAuth(), credential);
  return { uid: userCredential.user.uid, phone: userCredential.user.phoneNumber ?? '' };
}

/** Lấy hồ sơ user từ Firestore (nếu có) */
export async function fetchUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(getFirestore(), 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as User;
}

/** Ghi hồ sơ user vào Firestore (tạo mới hoặc cập nhật) */
export async function saveUserProfile(user: User & { uid: string }): Promise<void> {
  await setDoc(doc(getFirestore(), 'users', user.uid), user, { merge: true });
}

/** Theo dõi trạng thái đăng nhập Firebase */
export function onAuthStateChange(
  callback: (uid: string | null) => void,
): () => void {
  return onAuthStateChanged(getAuth(), (user) => callback(user?.uid ?? null));
}

/** User hiện tại có phải session ẩn danh (khách) không */
export function isAnonymousUser(): boolean {
  return getAuth().currentUser?.isAnonymous ?? false;
}

/**
 * Đảm bảo luôn có session Firebase trước khi ghi dữ liệu (seed, tăng lượt xem...).
 * Khách chưa đăng nhập → dùng đăng nhập ẩn danh để qua được security rules.
 */
export async function ensureSessionSignIn(): Promise<void> {
  const auth = getAuth();
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch {
    // Lỗi hiếm gặp (mất mạng / provider bị tắt) — app vẫn chạy, chỉ bỏ qua phần ghi của khách
  }
}

/** Đăng xuất khỏi Firebase */
export async function signOutFirebase(): Promise<void> {
  await signOut(getAuth());
}