import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BORDER_RADIUS, COLORS, SHADOWS } from '@/constants/colors';
import { PROPERTY_TYPES, type Listing } from '@/types';
import { formatDate, formatPriceShort } from '@/utils/formatters';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onFavoritePress?: () => void;
  variant?: 'grid' | 'list' | 'preview';
}

function typeLabel(type: Listing['type']): string {
  return PROPERTY_TYPES.find((t) => t.value === type)?.label ?? '';
}

/** Hàng thông số: diện tích • phòng ngủ • toilet */
function Specs({ listing, light }: { listing: Listing; light?: boolean }) {
  const color = light ? 'rgba(255,255,255,0.92)' : COLORS.grayMedium;
  const textColor = light ? COLORS.white : COLORS.text;
  return (
    <View style={styles.specsRow}>
      <View style={styles.spec}>
        <Ionicons name="resize-outline" size={12} color={color} />
        <Text style={[styles.specText, { color: textColor }]}>{listing.area}m²</Text>
      </View>
      <View style={styles.spec}>
        <Ionicons name="bed-outline" size={12} color={color} />
        <Text style={[styles.specText, { color: textColor }]}>{listing.bedrooms}</Text>
      </View>
      <View style={styles.spec}>
        <Ionicons name="water-outline" size={12} color={color} />
        <Text style={[styles.specText, { color: textColor }]}>{listing.bathrooms}</Text>
      </View>
    </View>
  );
}

/** Đánh giá gọn: ★ 4.8 (12) */
function Rating({ rating, count }: { rating: number; count?: number }) {
  return (
    <View style={styles.rating}>
      <Ionicons name="star" size={11} color={COLORS.priceAccent} />
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      {count != null && <Text style={styles.ratingCount}>({count})</Text>}
    </View>
  );
}

export function ListingCard({ listing, onPress, onFavoritePress, variant = 'grid' }: ListingCardProps) {
  if (variant === 'list') {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.listCard}>
        <View style={styles.listImageWrap}>
          <Image source={{ uri: listing.images[0] }} style={styles.listImage} contentFit="cover" />
          {listing.condition === 'needs_repair' && (
            <View style={styles.listCondition}>
              <Text style={styles.listConditionText}>Cần sửa</Text>
            </View>
          )}
        </View>
        <View style={styles.listBody}>
          <View style={styles.listTopRow}>
            <Text style={styles.listPrice} numberOfLines={1}>
              {formatPriceShort(listing.price)}
              <Text style={styles.listPriceUnit}>/tháng</Text>
            </Text>
            {listing.rating != null && <Rating rating={listing.rating} />}
          </View>
          <Text style={styles.listTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <Specs listing={listing} />
          <View style={styles.listLocationRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.grayMedium} />
            <Text style={styles.listLocationText} numberOfLines={1}>
              {listing.ward}, {listing.district}
            </Text>
          </View>
          <View style={styles.listTimeRow}>
            <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.listTimeText}>{formatDate(listing.createdAt)}</Text>
          </View>
        </View>
        {onFavoritePress && (
          <TouchableOpacity onPress={onFavoritePress} style={styles.listHeart} hitSlop={8}>
            <Ionicons
              name={listing.isFavorite ? 'heart' : 'heart-outline'}
              size={19}
              color={listing.isFavorite ? COLORS.warmGold : COLORS.grayMedium}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'preview') {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.previewCard}>
        <Image source={{ uri: listing.images[0] }} style={styles.previewImage} contentFit="cover" />
        <View style={styles.previewBody}>
          <Text style={styles.previewTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.previewPrice}>
            {formatPriceShort(listing.price)}
            <Text style={styles.previewPriceUnit}>/tháng</Text>
          </Text>
          <Specs listing={listing} />
          <Text style={styles.previewMeta} numberOfLines={1}>
            {listing.ward}, {listing.district}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      {/* Ảnh + huy hiệu */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: listing.images[0] }} style={styles.image} contentFit="cover" transition={150} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={styles.gradient} />
        <View style={styles.badgeCol}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel(listing.type)}</Text>
          </View>
          {listing.condition === 'needs_repair' && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionBadgeText}>Cần sửa</Text>
            </View>
          )}
        </View>
        <View style={styles.photoBadge}>
          <Ionicons name="images-outline" size={11} color={COLORS.white} />
          <Text style={styles.photoBadgeText}>{listing.images.length}</Text>
        </View>
        {onFavoritePress && (
          <TouchableOpacity
            onPress={onFavoritePress}
            style={[styles.heart, listing.isFavorite && styles.heartActive]}
            hitSlop={6}
          >
            <Ionicons
              name={listing.isFavorite ? 'heart' : 'heart-outline'}
              size={16}
              color={listing.isFavorite ? COLORS.warmGold : COLORS.darkBrown}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Thông tin */}
      <View style={styles.body}>
        <View style={styles.priceRow}>
          <Text style={styles.price} numberOfLines={1}>
            {formatPriceShort(listing.price)}
            <Text style={styles.priceUnit}>/tháng</Text>
          </Text>
          {listing.rating != null && <Rating rating={listing.rating} count={listing.reviewCount} />}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <Specs listing={listing} />

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.grayMedium} />
          <Text style={styles.locationText} numberOfLines={1}>
            {listing.ward}, {listing.district}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{formatDate(listing.createdAt)}</Text>
          </View>
          {listing.status === 'rented' ? (
            <Text style={styles.rentedTag}>Đã cho thuê</Text>
          ) : listing.amenities.length > 0 ? (
            <Text style={styles.amenityCount}>+{listing.amenities.length} tiện nghi</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 0.48,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.light,
    marginBottom: 12,
  },
  imageWrap: {
    aspectRatio: 4 / 3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  badgeCol: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 5,
    alignItems: 'flex-start',
  },
  typeBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  typeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  conditionBadge: {
    backgroundColor: 'rgba(245, 166, 35, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  conditionBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  photoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.whiteOverlay,
    borderRadius: 16,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartActive: {
    backgroundColor: COLORS.white,
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 9,
    gap: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.priceAccent,
    flexShrink: 1,
  },
  priceUnit: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(14, 143, 142, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  ratingCount: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 17,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    flex: 1,
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
    paddingTop: 6,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  amenityCount: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.bronze,
  },
  rentedTag: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.errorRed,
    backgroundColor: 'rgba(230, 57, 70, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // list variant
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  listImageWrap: {
    position: 'relative',
  },
  listImage: {
    width: 104,
    height: '100%',
    minHeight: 128,
  },
  listCondition: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(245, 166, 35, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listConditionText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },
  listBody: {
    flex: 1,
    padding: 10,
    gap: 3,
  },
  listTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  listPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.priceAccent,
    flexShrink: 1,
  },
  listPriceUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  listTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 17,
  },
  listLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  listLocationText: {
    flex: 1,
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  listTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  listTimeText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  listHeart: {
    position: 'absolute',
    right: 8,
    top: 8,
  },

  // preview variant
  previewCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: 104,
    height: 104,
  },
  previewBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 18,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.priceAccent,
  },
  previewPriceUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  previewMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
