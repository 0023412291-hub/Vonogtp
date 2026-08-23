import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Auth + Firestore dùng Firebase JS SDK (thuần JS) → hoạt động ở mọi môi trường,
 * kể cả Expo Go và web. Cờ này giữ lại để các caller phân nhánh logic như trước.
 */
export const firebaseEnabled = true;

/**
 * RNFirebase Messaging cần native code — chỉ khả dụng trong development/production
 * build (Expo Go có appOwnership === 'expo'). Khi cờ sai, các hàm trong
 * firebase/messaging.ts tự no-op để Expo Go/web không crash.
 */
export const nativeMessagingAvailable =
  Platform.OS !== 'web' && Constants.appOwnership !== 'expo';
