import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * RNFirebase cần native code — chỉ khả dụng trong development/production build.
 * Trong Expo Go (appOwnership === 'expo') hoặc web, ta tắt Firebase để app không crash
 * và rơi về hành vi demo (mock).
 */
export const firebaseEnabled = Platform.OS !== 'web' && Constants.appOwnership !== 'expo';