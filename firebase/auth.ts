import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import type { User } from '@/types';

import { getFirebaseAuth, getFirebaseDb } from './app';

/** Chuẩn hóa SĐT Việt Nam về dạng quốc tế +84 (dùng cho trường liên hệ trong hồ sơ) */
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

/** Đăng ký tài khoản mới bằng email + mật khẩu — trả về uid vừa tạo */
export async function signUpWithEmail(params: {
  email: string;
  password: string;
}): Promise<string> {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    params.email.trim(),
    params.password,
  );
  return credential.user.uid;
}

/** Đăng nhập bằng email + mật khẩu — trả về uid */
export async function signInWithEmail(email: string, password: string): Promise<string> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  return credential.user.uid;
}

/** Gửi email hướng dẫn đặt lại mật khẩu */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

/**
 * Dịch lỗi Firebase Auth sang tiếng Việt cho UI.
 * Mã lỗi của JS SDK và RNFirebase dùng chung tiền tố "auth/...".
 */
export function authErrorMessage(error: unknown): string {
  const code =
    error instanceof Object && 'code' in error ? String((error as { code: string }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email này đã được dùng để đăng ký.';
    case 'auth/invalid-email':
      return 'Định dạng email không hợp lệ.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu — cần ít nhất 6 ký tự.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không đúng.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Kiểm tra internet và thử lại.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Chức năng Email/Mật khẩu chưa được bật trên Firebase Console (Authentication → Sign-in method).';
    case 'auth/invalid-api-key':
      return 'API key Firebase không hợp lệ — kiểm tra lại cấu hình dự án.';
    default:
      if (__DEV__ && code.startsWith('auth/')) {
        // Bản dev hiển thị mã lỗi gốc để dễ chẩn đoán
        return `Có lỗi xảy ra (${code}). Vui lòng thử lại.`;
      }
      return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
}

/** Lấy hồ sơ user từ Firestore (nếu có) */
export async function fetchUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as User;
}

/** Ghi hồ sơ user vào Firestore (tạo mới hoặc cập nhật) */
export async function saveUserProfile(user: User & { uid: string }): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'users', user.uid), user, { merge: true });
}

/** Theo dõi trạng thái đăng nhập Firebase */
export function onAuthStateChange(
  callback: (uid: string | null) => void,
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), (fbUser) => callback(fbUser?.uid ?? null));
}

/** User hiện tại có phải session ẩn danh (khách) không */
export function isAnonymousUser(): boolean {
  return getFirebaseAuth().currentUser?.isAnonymous ?? false;
}

/**
 * Đảm bảo luôn có session Firebase trước khi ghi dữ liệu (seed, tăng lượt xem...).
 * Khách chưa đăng nhập → dùng đăng nhập ẩn danh để qua được security rules.
 */
export async function ensureSessionSignIn(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch {
    // Anonymous auth chưa bật trên Console — app vẫn chạy, chỉ bỏ qua phần ghi của khách
  }
}

/** Đăng xuất khỏi Firebase */
export async function signOutFirebase(): Promise<void> {
  await signOut(getFirebaseAuth());
}
