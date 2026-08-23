import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Avatar } from '@/components/avatar';
import { SectionHeader } from '@/components/section-header';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';

/** Một dòng cài đặt có icon + tiêu đề + mô tả + phần bên phải */
function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.6 : 1}>
      <View style={[styles.rowIconWrap, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? COLORS.errorRed : COLORS.bronze} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, resetFilters } = useApp();

  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);
  const [clearing, setClearing] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  // Đọc trạng thái quyền thông báo khi mở màn hình
  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then((p) => setNotifGranted(p.granted || p.status === 'granted'))
      .catch(() => setNotifGranted(false));
  }, []);

  const requestNotifications = useCallback(async () => {
    try {
      const p = await Notifications.requestPermissionsAsync();
      if (p.granted) {
        setNotifGranted(true);
        Alert.alert('Thành công', 'Đã bật thông báo cho VoNo.');
        return;
      }
      // Bị từ chối vĩnh viễn → hướng dẫn mở cài đặt hệ thống để cấp lại
      Alert.alert('Chưa bật thông báo', 'Hãy cấp quyền trong Cài đặt hệ thống của thiết bị.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể xin quyền thông báo trên thiết bị này.');
    }
  }, []);

  const handleClearCache = useCallback(async () => {
    setClearing(true);
    try {
      await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
      Alert.alert('Hoàn tất', 'Đã xoá bộ nhớ đệm ảnh của ứng dụng.');
    } catch {
      Alert.alert('Lỗi', 'Không thể xoá bộ nhớ đệm lúc này.');
    } finally {
      setClearing(false);
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    Alert.alert('Đặt lại bộ lọc', 'Toàn bộ điều kiện lọc tin đăng sẽ về mặc định.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đặt lại', onPress: () => resetFilters() },
    ]);
  }, [resetFilters]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất khỏi tài khoản này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---- Tài khoản ---- */}
        <SectionHeader title="Tài khoản" />
        <SectionCard>
          {user ? (
            <>
              <View style={styles.userRow}>
                <Avatar name={user.name} size={44} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userMeta}>{user.phone}</Text>
                </View>
              </View>
              <SettingsRow
                icon="log-out-outline"
                title="Đăng xuất"
                subtitle="Thoát tài khoản trên thiết bị này"
                danger
                right={<Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />}
                onPress={handleSignOut}
              />
            </>
          ) : (
            <>
              <View style={styles.userRow}>
                <Avatar name="Khách" size={44} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>Khách vãng lai</Text>
                  <Text style={styles.userMeta}>Đăng nhập để lưu tin & quản lý tin đăng</Text>
                </View>
              </View>
              <ActionButton label="Đăng nhập" icon="log-in-outline" onPress={() => router.push('/auth')} />
            </>
          )}
        </SectionCard>

        {/* ---- Thông báo ---- */}
        <SectionHeader title="Thông báo" />
        <SectionCard>
          <SettingsRow
            icon="notifications-outline"
            title="Nhận thông báo"
            subtitle={
              notifGranted == null
                ? 'Đang kiểm tra...'
                : notifGranted
                  ? 'Đã bật — nhận thông báo khách quan tâm tin'
                  : 'Đang tắt — bấm để cấp quyền'
            }
            right={
              notifGranted === null ? (
                <ActivityIndicator size="small" color={COLORS.bronze} />
              ) : (
                <View style={[styles.badge, notifGranted ? styles.badgeOn : styles.badgeOff]}>
                  <Text style={[styles.badgeText, notifGranted ? styles.badgeTextOn : styles.badgeTextOff]}>
                    {notifGranted ? 'Bật' : 'Tắt'}
                  </Text>
                </View>
              )
            }
            onPress={notifGranted ? undefined : requestNotifications}
          />
          {notifGranted !== null && (
            <SettingsRow
              icon="open-outline"
              title="Mở cài đặt hệ thống"
              subtitle="Quản lý quyền thông báo trong Cài đặt máy"
              right={<Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />}
              onPress={() => Linking.openSettings()}
            />
          )}
        </SectionCard>

        {/* ---- Dữ liệu ---- */}
        <SectionHeader title="Dữ liệu" />
        <SectionCard>
          <SettingsRow
            icon="trash-outline"
            title="Xoá bộ nhớ đệm ảnh"
            subtitle="Giải phóng dung lượng ảnh đã tải tạm"
            right={
              clearing ? (
                <ActivityIndicator size="small" color={COLORS.bronze} />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />
              )
            }
            onPress={handleClearCache}
          />
          <SettingsRow
            icon="options-outline"
            title="Đặt lại bộ lọc tìm kiếm"
            subtitle="Về trạng thái mặc định ban đầu"
            right={<Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />}
            onPress={handleResetFilters}
          />
        </SectionCard>

        {/* ---- Về ứng dụng ---- */}
        <SectionHeader title="Về ứng dụng" />
        <SectionCard>
          <SettingsRow
            icon="document-text-outline"
            title="Điều khoản & Chính sách"
            right={<Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />}
            onPress={() => router.push('/terms')}
          />
          <SettingsRow
            icon="headset-outline"
            title="Liên hệ hỗ trợ"
            right={<Ionicons name="chevron-forward" size={16} color={COLORS.grayLight} />}
            onPress={() => router.push('/support')}
          />
          <SettingsRow icon="information-circle-outline" title="Phiên bản" right={<Text style={styles.version}>{version}</Text>} />
        </SectionCard>

        <Text style={styles.footer}>VoNo - Tìm Nhà Nhanh © 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: {
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  rowTitleDanger: {
    color: COLORS.errorRed,
  },
  rowSubtitle: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeOn: {
    backgroundColor: 'rgba(42, 157, 143, 0.12)',
  },
  badgeOff: {
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextOn: {
    color: COLORS.successGreen,
  },
  badgeTextOff: {
    color: COLORS.errorRed,
  },
  version: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
