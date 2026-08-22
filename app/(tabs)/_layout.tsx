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
  const { onboardingComplete, user } = useApp();

  // Cổng bảo vệ: chưa hoàn tất luồng mở app (splash → nhu cầu → quyền) thì đẩy về Splash
  if (!onboardingComplete) {
    return <Redirect href="/splash" />;
  }

  // Chế độ đăng tin: tab Đăng Tin nổi bật, tab Lưu Tin ẩn đi; tab mặc định là quản lý tin (account)
  const isOwner = user?.role === 'owner';
  const initialTab = isOwner ? 'account' : 'index';

  return (
    <Tabs
      initialRouteName={initialTab}
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
      {/* Chỉ hiển thị tab Đăng Tin khi ở chế độ đăng tin */}
      <Tabs.Screen
        name="post"
        options={{
          title: 'Đăng Tin',
          href: isOwner ? undefined : null,
          tabBarIcon: tabIcon('add-circle', 'add-circle-outline'),
        }}
      />
      {/* Chỉ hiển thị tab Lưu Tin khi ở chế độ tìm nhà */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Lưu Tin',
          href: isOwner ? null : undefined,
          tabBarIcon: tabIcon('heart', 'heart-outline'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Tin Nhắn',
          tabBarIcon: tabIcon('chatbubbles', 'chatbubbles-outline'),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: isOwner ? 'Của Tôi' : 'Tài Khoản',
          tabBarIcon: tabIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
  );
}
