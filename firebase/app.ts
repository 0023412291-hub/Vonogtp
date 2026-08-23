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
 * Persistence tự đóng gói từ AsyncStorage — thay cho getReactNativePersistence()
 * vốn phụ thuộc conditional exports dễ vỡ giữa các bundler.
 *
 * QUAN TRỌNG: bản RN của @firebase/auth yêu cầu persistence là CLASS (không phải
 * instance) — nó tự gọi `new cls()` bên trong `_getInstance()` và cache theo class
 * (debugAssert(cls instanceof Function, 'Expected a class definition')).
 */
class AsyncStoragePersistence {
  readonly type = 'LOCAL' as const;

  async _isAvailable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem('@auth_available_test', '1');
      await AsyncStorage.removeItem('@auth_available_test');
      return true;
    } catch {
      return false;
    }
  }

  async _set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async _get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async _remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  // PersistenceUserManager gọi khi tạo/khôi phục — bản in-memory của SDK cũng
  // để stub rỗng (không cần lắng nghe thay đổi storage trong RN).
  _addListener(_key: string, _listener: () => void): void {}

  _removeListener(_key: string, _listener: () => void): void {}
}

// Truyền CHÍNH CLASS (không new) — SDK tự khởi tạo bên trong.
const asyncStoragePersistence = AsyncStoragePersistence as unknown as Persistence;

/**
 * Auth của JS SDK với persistence AsyncStorage để giữ phiên đăng nhập giữa các
 * lần mở app trên React Native (mặc định chỉ giữ trong RAM). initializeAuth chỉ
 * gọi được một lần cho mỗi app — lần gọi sau (vd do Fast Refresh) rơi vào catch
 * và dùng lại instance đã có sẵn.
 */
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    try {
      authInstance = initializeAuth(app, {
        persistence: asyncStoragePersistence,
      });
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
