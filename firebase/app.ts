import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * getReactNativePersistence chỉ được xuất ở bản RN của SDK (@firebase/auth/dist/rn)
 * nên phải nạp bằng require để Metro chọn đúng bản react-native; TypeScript không
 * nhìn thấy export này trong typings bản browser nên khai báo kiểu thủ công.
 */
type GetReactNativePersistence = (storage: unknown) => Persistence;
const rnAuthRuntime = require('@firebase/auth') as {
  getReactNativePersistence?: GetReactNativePersistence;
};

/**
 * Firebase JS SDK (thuần JavaScript) — dùng chung cho Auth + Firestore.
 * Chạy được ở mọi môi trường: Expo Go, development build, production build và web.
 *
 * Cấu hình lấy từ google-services.json (Android) / GoogleService-Info.plist (iOS)
 * trong repo. Auth + Firestore không phụ thuộc native module nên không cần file này
 * lúc runtime, chỉ cần đúng apiKey/projectId trùng với project trên Firebase Console.
 */
const PROJECT_INFO = {
  projectId: 'vono-app-1b443',
  authDomain: 'vono-app-1b443.firebaseapp.com',
  storageBucket: 'vono-app-1b443.firebasestorage.app',
  messagingSenderId: '634414445630',
};

const IOS_OPTIONS: FirebaseOptions = {
  ...PROJECT_INFO,
  apiKey: 'AIzaSyClZ9gSD5IFeon6-4H-IzwvHXHruHrtRQ8',
  appId: '1:634414445630:ios:c6bf94428d8dc8e1494d6f',
};

const ANDROID_OPTIONS: FirebaseOptions = {
  ...PROJECT_INFO,
  apiKey: 'AIzaSyBlZXU2eTx_YZ-Si4xwgILe7Rv26G5Z7yA',
  appId: '1:634414445630:android:70d69a633153680e494d6f',
};

function optionsForPlatform(): FirebaseOptions {
  if (Platform.OS === 'android') return ANDROID_OPTIONS;
  // iOS và web dùng chung bộ cấu hình iOS
  return IOS_OPTIONS;
}

const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(optionsForPlatform());

let authInstance: Auth | null = null;

/**
 * Auth của JS SDK với persistence chính thức getReactNativePersistence(AsyncStorage)
 * để giữ phiên đăng nhập giữa các lần mở app trên React Native.
 *
 * KHÔNG dùng lớp persistence tự viết — nó làm treo event manager nội bộ của SDK
 * (signInAnonymously không bao giờ hoàn tất, currentUser luôn null).
 *
 * initializeAuth chỉ gọi được một lần cho mỗi app — lần gọi sau (vd do Fast Refresh)
 * rơi vào catch và dùng lại instance đã có sẵn.
 */
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const persistence = rnAuthRuntime.getReactNativePersistence?.(AsyncStorage);
    try {
      authInstance = initializeAuth(app, persistence ? { persistence } : undefined);
    } catch (error) {
      // Chỉ rơi về getAuth khi auth thực sự đã được khởi tạo trước đó
      // (Fast Refresh / hot reload). Lỗi khác phải ném ra để thấy tận gốc.
      const code = (error as { code?: string })?.code;
      if (code === 'auth/already-initialized') {
        authInstance = getAuth(app);
      } else {
        throw error;
      }
    }
  }
  return authInstance;
}

/** Firestore instance của JS SDK (an toàn khi gọi nhiều lần) */
export function getFirebaseDb(): Firestore {
  return getFirestore(app);
}
