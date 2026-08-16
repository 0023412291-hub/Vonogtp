import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { Segmented } from '@/components/segmented';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { formatDate, formatPriceShort } from '@/utils/formatters';

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, myListings, deleteListing, markRented, signOut, updateUser } = useApp();

  const [tab, setTab] = useState('active');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editPhone, setEditPhone] = useState(user?.phone ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');

  const activeList = myListings.filter((l) => l.status === 'active');
  const rentedList = myListings.filter((l) => l.status === 'rented');
  const shown = tab === 'active' ? activeList : rentedList;

  const showActions = (id: string) => {
    Alert.alert('Quản lý tin', 'Chọn thao tác', [
      { text: 'Sửa tin', onPress: () => Alert.alert('Sửa tin', 'Tính năng sửa tin sẽ sớm ra mắt.') },
      { text: 'Đánh dấu đã cho thuê', onPress: () => markRented(id) },
      { text: 'Xoá tin', style: 'destructive', onPress: () => deleteListing(id) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const saveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống.');
      return;
    }
    updateUser({ name: editName.trim(), phone: editPhone.trim(), email: editEmail.trim() });
    setEditOpen(false);
  };

  const settingsRows = [
    { icon: 'settings-outline', label: 'Cài đặt', action: () => Alert.alert('Cài đặt', 'Sắp ra mắt.') },
    { icon: 'headset-outline', label: 'Liên hệ hỗ trợ', action: () => Alert.alert('Hỗ trợ', 'hotro@vono.app • 1900 1234') },
    { icon: 'document-text-outline', label: 'Điều khoản & Chính sách', action: () => Alert.alert('Điều khoản', 'Xem đầy đủ tại vono.app/terms') },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài Khoản</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={user?.name ?? 'Khách'} size={76} />
          <Text style={styles.profileName}>{user?.name ?? 'Khách'}</Text>
          <Text style={styles.profileMeta}>{user?.phone ?? 'Chưa có SĐT'}</Text>
          <Text style={styles.profileMeta}>{user?.email ?? 'Chưa có email'}</Text>
          {user ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => {
                setEditName(user?.name ?? '');
                setEditPhone(user?.phone ?? '');
                setEditEmail(user?.email ?? '');
                setEditOpen(true);
              }}
            >
              <Ionicons name="create-outline" size={14} color={COLORS.darkBrown} />
              <Text style={styles.editBtnText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push('/auth')}
            >
              <Ionicons name="log-in-outline" size={14} color={COLORS.darkBrown} />
              <Text style={styles.editBtnText}>Đăng nhập / Đăng ký</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* My listings */}
        <Text style={styles.sectionLabel}>TIN ĐÃ ĐĂNG</Text>
        <Segmented
          options={[`Đang hiển thị (${activeList.length})`, `Đã cho thuê (${rentedList.length})`]}
          value={tab === 'active' ? `Đang hiển thị (${activeList.length})` : `Đã cho thuê (${rentedList.length})`}
          onChange={(v) => setTab(v.startsWith('Đang') ? 'active' : 'rented')}
        />

        {shown.length === 0 ? (
          <EmptyState
            icon={tab === 'active' ? 'megaphone-outline' : 'checkmark-done-outline'}
            title={tab === 'active' ? 'Bạn chưa đăng tin nào' : 'Chưa có tin đã cho thuê'}
            message={
              tab === 'active'
                ? 'Đăng tin đầu tiên của bạn để tiếp cận hàng nghìn người thuê.'
                : 'Khi tin được cho thuê, hãy đánh dấu để quản lý dễ dàng.'
            }
            actionLabel={tab === 'active' ? 'Đăng tin mới' : undefined}
            onAction={tab === 'active' ? () => router.push('/(tabs)/post') : undefined}
          />
        ) : (
          <View style={styles.myList}>
            {shown.map((l) => (
              <View key={l.id} style={styles.myCard}>
                <TouchableOpacity
                  style={styles.myCardMain}
                  onPress={() => router.push(`/listing/${l.id}`)}
                >
                  <Image source={{ uri: l.images[0] }} style={styles.myThumb} contentFit="cover" />
                  <View style={styles.myInfo}>
                    <Text style={styles.myTitle} numberOfLines={2}>
                      {l.title}
                    </Text>
                    <Text style={styles.myMeta}>
                      {formatPriceShort(l.price)}/tháng • {l.area}m²
                    </Text>
                    <Text style={styles.myDate}>📅 Đăng {formatDate(l.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.myMenu} onPress={() => showActions(l.id)} hitSlop={8}>
                  <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                {l.status === 'rented' && <Text style={styles.rentedBadge}>Đã cho thuê</Text>}
              </View>
            ))}
          </View>
        )}

        <ActionButton
          label="+ Đăng tin mới"
          icon="add"
          onPress={() => router.push('/(tabs)/post')}
          style={styles.newPostBtn}
        />

        {/* Settings */}
        <View style={styles.settings}>
          {settingsRows.map((row) => (
            <TouchableOpacity key={row.label} style={styles.settingsRow} onPress={row.action}>
              <Ionicons name={row.icon as never} size={19} color={COLORS.bronze} />
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.grayMedium} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            signOut();
            router.replace('/auth');
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.errorRed} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.version}>VoNo - Tìm Nhà Nhanh • v1.0.0</Text>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            <FormField label="Họ và tên" value={editName} onChangeText={setEditName} placeholder="Nguyễn Văn A" />
            <FormField label="Số điện thoại" value={editPhone} onChangeText={setEditPhone} placeholder="0912345678" keyboardType="phone-pad" />
            <FormField label="Email" value={editEmail} onChangeText={setEditEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.modalActions}>
              <ActionButton label="Hủy" variant="soft" onPress={() => setEditOpen(false)} style={{ flex: 0.45 }} />
              <ActionButton label="Lưu" onPress={saveProfile} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    gap: 4,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginTop: 6,
  },
  profileMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.warmGold,
    backgroundColor: COLORS.white,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.bronze,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  myList: {
    marginTop: 14,
  },
  myCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  myCardMain: {
    flex: 1,
    flexDirection: 'row',
  },
  myThumb: {
    width: 92,
    height: 92,
  },
  myInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  myTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 17,
  },
  myMeta: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.warmGold,
  },
  myDate: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  myMenu: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.errorRed,
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  newPostBtn: {
    marginTop: 6,
  },
  settings: {
    marginTop: 24,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.errorRed,
    backgroundColor: 'rgba(230, 57, 70, 0.05)',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.errorRed,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,32,51,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayLight,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
