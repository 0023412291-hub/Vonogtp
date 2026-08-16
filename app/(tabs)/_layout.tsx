import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ focused, outline, color, isFocused }: { focused: IoniconName; outline: IoniconName; color: string; isFocused: boolean }) {
  return <Ionicons name={isFocused ? focused : outline} size={24} color={color} />;
}

function tabIcon(focused: IoniconName, outline: IoniconName) {
  return function IconRenderer({ color, focused: isFocused }: { color: string; focused: boolean }) {
    return <TabIcon focused={focused} outline={outline} color={color} isFocused={isFocused} />;
  };
}

export default function TabLayout() {
  const { onboardingComplete } = useApp();

  // Cổng bảo vệ: chưa hoàn tất luồng mở app (splash → nhu cầu → quyền) thì đẩy về Splash
  if (!onboardingComplete) {
    return <Redirect href="/splash" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.warmGold,
        tabBarInactiveTintColor: COLORS.grayMedium,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Khám Phá', tabBarIcon: tabIcon('compass', 'compass-outline') }}
      />
      <Tabs.Screen
        name="post"
        options={{ title: 'Đăng Tin', tabBarIcon: tabIcon('add-circle', 'add-circle-outline') }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: 'Lưu Tin', tabBarIcon: tabIcon('heart', 'heart-outline') }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Tài Khoản', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
