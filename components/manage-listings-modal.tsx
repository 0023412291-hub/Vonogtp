import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { EmptyState } from '@/components/empty-state';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';
import type { Listing } from '@/types';
import { formatPriceShort } from '@/utils/formatters';

interface ManageListingsModalProps {
  visible: boolean;
  listings: Listing[];
  onClose: () => void;
  /** Bấm "Sửa" — mở wizard chỉnh sửa tin (các bước như lúc đăng) */
  onEdit: (listing: Listing) => void;
  /** Xoá tin (được gọi sau khi đã xác nhận) */
  onDelete: (id: string) => void;
  /** Đánh dấu tin đã cho thuê (được gọi sau khi đã xác nhận) */
  onMarkRented: (id: string) => void;
  /** Đăng tin mới (khi danh sách trống) */
  onAdd: () => void;
}

/** Modal danh sách tin đã đăng: xem, sửa (mở wizard), xoá hoặc đánh dấu đã cho thuê */
export function ManageListingsModal({ visible, listings, onClose, onEdit, onDelete, onMarkRented, onAdd }: ManageListingsModalProps) {
  const insets = useSafeAreaInsets();

  const confirmDelete = (id: string) => {
    Alert.alert('Xoá tin', 'Bạn có chắc muốn xoá tin này? Hành động không thể hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  };

  const confirmMarkRented = (id: string) => {
    Alert.alert('Đánh dấu đã cho thuê', 'Tin sẽ chuyển sang trạng thái "Đã cho thuê" và ngừng tìm khách. Tiếp tục?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', onPress: () => onMarkRented(id) },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Quản lý tin đã đăng</Text>
            <Text style={styles.count}>{listings.length} tin</Text>
          </View>
          {listings.length === 0 ? (
            <EmptyState
              icon="megaphone-outline"
              title="Bạn chưa đăng tin nào"
              message="Đăng tin đầu tiên để bắt đầu tiếp cận người thuê."
              actionLabel="Đăng tin mới"
              onAction={onAdd}
            />
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {listings.map((l) => (
                <View key={l.id} style={styles.card}>
                  <Image source={{ uri: l.images[0] }} style={styles.thumb} contentFit="cover" />
                  <View style={styles.info}>
                    <Text style={styles.titleText} numberOfLines={2}>
                      {l.title}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {formatPriceShort(l.price)}/tháng • {l.area}m² •{' '}
                      {l.status === 'rented' ? 'Đã cho thuê' : 'Đang hiển thị'}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    {l.status === 'active' && (
                      <TouchableOpacity style={styles.rentedBtn} onPress={() => confirmMarkRented(l.id)} hitSlop={4}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.successGreen} />
                        <Text style={styles.rentedText}>Đã cho thuê</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(l)} hitSlop={4}>
                      <Ionicons name="create-outline" size={14} color={COLORS.darkBrown} />
                      <Text style={styles.editText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.delBtn} onPress={() => confirmDelete(l.id)} hitSlop={4}>
                      <Ionicons name="trash-outline" size={14} color={COLORS.errorRed} />
                      <Text style={styles.delText}>Xoá</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.actionsRow}>
            <ActionButton label="Đóng" variant="soft" onPress={onClose} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,32,51,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayLight,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginBottom: 14,
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bronze,
    marginBottom: 14,
  },
  list: {
    maxHeight: 420,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    marginBottom: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 16,
  },
  meta: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  actions: {
    gap: 6,
  },
  rentedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(42, 157, 143, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(42, 157, 143, 0.35)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  rentedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.successGreen,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  delBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(230, 57, 70, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.35)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  delText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.errorRed,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
});
