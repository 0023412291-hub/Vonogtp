import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { COLORS } from '@/constants/colors';
import { AppProvider } from '@/context/app-context';

console.log('[BOOT] Bundle mới đã load — 20260823-1625');

export const unstable_settings = {
  // Màn hình mở đầu khi khởi động app (expo-router v5+: anchor thay cho initialRouteName)
  anchor: 'splash',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <Stack
          initialRouteName="splash"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.white },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="splash" />
          <Stack.Screen name="needs" />
          <Stack.Screen name="permissions" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing/[id]" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="support" />
          <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style="dark" />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
