import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { ImageGallery } from '@/components/image-gallery';
import { RatingStars } from '@/components/rating-stars';
import { SectionHeader } from '@/components/section-header';
import { BORDER_RADIUS, COLORS, SHADOWS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import type { PropertyType } from '@/types';
import { formatDate, formatPriceShort } from '@/utils/formatters';

const TYPE_LABELS: Record<PropertyType, string> = {
  phong_tro: 'Phòng trọ',
  can_ho: 'Căn hộ',
  nha_nguyen_can: 'Nhà nguyên căn',
  dat_nen: 'Đất nền',
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getListing, toggleFavorite, isFavorite, trackView, contactListing } = useApp();

  const [showFullDesc, setShowFullDesc] = useState(false);

  const listing = getListing(id ?? '');

  // Ghi nhận lượt xem để hiện trong "Tin đã xem gần đây" trên trang profile
  useEffect(() => {
    if (listing) trackView(listing.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (!listing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>
        <EmptyState
          icon="alert-circle-outline"
          title="Không tìm thấy tin"
          message="Tin đăng có thể đã bị xoá hoặc hết hạn."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const fav = isFavorite(listing.id);

  const handleCall = () => {
    // Ghi nhận lượt liên hệ + tạo lead cho chủ tin (nếu đủ điều kiện)
    contactListing(listing);
    if (listing.showPhone) {
      Linking.openURL(`tel:${listing.contact.phone}`).catch(() =>
        Alert.alert('Lỗi', 'Không thể gọi điện trên thiết bị này.'),
      );
    } else {
      Alert.alert('Liên hệ', 'Chủ nhà chỉ nhận liên hệ qua tin nhắn.');
    }
  };

  const handleShare = () => {
    Share.share({
      message: `${listing.title}\n${formatPriceShort(listing.price)}/tháng • ${listing.area}m² • ${listing.district}\nXem trên VoNo - Tìm Nhà Nhanh`,
    }).catch(() => {});
  };

  const detailItems = [
    { icon: 'bed-outline', label: 'Phòng ngủ', value: String(listing.bedrooms) },
    { icon: 'water-outline', label: 'Toilet', value: String(listing.bathrooms) },
    { icon: 'expand-outline', label: 'Diện tích', value: `${listing.area}m²` },
    { icon: 'layers-outline', label: 'Tầng', value: listing.floor != null ? String(listing.floor) : '—' },
    { icon: 'calendar-outline', label: 'Năm xây', value: listing.yearBuilt != null ? String(listing.yearBuilt) : '—' },
    { icon: 'pricetag-outline', label: 'Loại hình', value: TYPE_LABELS[listing.type] },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={6}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết tin</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn} hitSlop={6}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.darkBrown} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <ImageGallery images={listing.images} height={300} />

        {/* Title & price */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{listing.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPriceShort(listing.price)}/tháng</Text>
            {listing.rating != null && <RatingStars rating={listing.rating} count={listing.reviewCount} />}
          </View>
          <Text style={styles.meta}>
            {listing.area}m² • {listing.ward}, {listing.district}
          </Text>
        </View>

        {/* Details grid */}
        <View style={styles.detailsGrid}>
          {detailItems.map((item) => (
            <View key={item.label} style={styles.detailItem}>
              <Ionicons name={item.icon as never} size={17} color={COLORS.bronze} />
              <View>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <SectionHeader title="Mô tả" />
          <Text style={styles.description} numberOfLines={showFullDesc ? undefined : 4}>
            {listing.description}
          </Text>
          <TouchableOpacity onPress={() => setShowFullDesc((s) => !s)} hitSlop={6}>
            <Text style={styles.expandLink}>{showFullDesc ? 'Ẩn bớt ▲' : 'Xem thêm ▼'}</Text>
          </TouchableOpacity>
        </View>

        {/* Amenities */}
        <View style={styles.section}>
          <SectionHeader title="Tiện nghi" />
          <View style={styles.amenities}>
            {listing.amenities.map((a, i) => (
              <View key={i} style={styles.amenityChip}>
                <Ionicons name="checkmark-circle" size={15} color={COLORS.successGreen} />
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <SectionHeader title="Thông tin liên hệ" />
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Avatar name={listing.contact.name} size={44} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{listing.contact.name}</Text>
                <Text style={styles.contactSub}>Phản hồi nhanh trong vòng 1 giờ</Text>
              </View>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity style={[styles.contactBtn, styles.callBtn]} onPress={handleCall}>
                <Ionicons name="call" size={16} color={COLORS.darkBrown} />
                <Text style={styles.callBtnText}>
                  {listing.showPhone ? listing.contact.phone : 'Gọi qua VoNo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, styles.chatBtn]}
                onPress={() =>
                  Alert.alert('Chat', 'Tính năng chat sẽ được mở ở phiên bản sau.')
                }
              >
                <Ionicons name="chatbubble" size={16} color={COLORS.darkBrown} />
                <Text style={styles.chatBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <SectionHeader title="Vị trí" />
          <View style={styles.locationRow}>
            <Ionicons name="location" size={17} color={COLORS.bronze} />
            <Text style={styles.locationText}>{listing.address}</Text>
          </View>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() =>
              router.push({ pathname: '/search', params: { tab: 'map', focus: listing.id } })
            }
          >
            <Ionicons name="map-outline" size={16} color={COLORS.darkBrown} />
            <Text style={styles.mapBtnText}>Xem trên bản đồ</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.postedAt}>Đăng {formatDate(listing.createdAt)} • ID: {listing.id}</Text>
      </ScrollView>

      {/* Sticky actions */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.actionBtn, fav && styles.actionBtnActive]}
          onPress={() => toggleFavorite(listing.id)}
        >
          <Ionicons
            name={fav ? 'heart' : 'heart-outline'}
            size={18}
            color={fav ? COLORS.white : COLORS.warmGold}
          />
          <Text style={[styles.actionText, fav && styles.actionTextActive]}>
            {fav ? 'ĐÃ LƯU' : 'LƯU TIN'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.warmGold} />
          <Text style={styles.actionText}>CHIA SẺ</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  backBtn: {
    margin: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 23,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.priceAccent,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '31%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
  },
  detailLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
    marginBottom: 6,
  },
  expandLink: {
    fontSize: 13,
    color: COLORS.warmGold,
    fontWeight: '700',
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(42, 157, 143, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  amenityText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  contactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    gap: 12,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  contactSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  callBtn: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  chatBtn: {
    backgroundColor: COLORS.warmGold,
    borderColor: COLORS.warmGold,
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    marginBottom: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.surface,
    paddingVertical: 11,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  postedAt: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingVertical: 14,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.warmGold,
  },
  actionBtnActive: {
    backgroundColor: COLORS.warmGold,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warmGold,
    letterSpacing: 0.5,
  },
  actionTextActive: {
    color: COLORS.darkBrown,
  },
});
