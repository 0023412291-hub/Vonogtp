import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BORDER_RADIUS, COLORS, SHADOWS } from '@/constants/colors';
import type { Listing } from '@/types';
import { formatPriceShort } from '@/utils/formatters';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
  onFavoritePress?: () => void;
  variant?: 'grid' | 'list' | 'preview';
}

export function ListingCard({ listing, onPress, onFavoritePress, variant = 'grid' }: ListingCardProps) {
  if (variant === 'list') {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.listCard}>
        <Image source={{ uri: listing.images[0] }} style={styles.listImage} contentFit="cover" />
        <View style={styles.listBody}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.listMeta} numberOfLines={1}>
            {listing.area}m² • {listing.district}
          </Text>
          <Text style={styles.listPrice}>{formatPriceShort(listing.price)}/tháng</Text>
        </View>
        {onFavoritePress && (
          <TouchableOpacity onPress={onFavoritePress} style={styles.listHeart} hitSlop={8}>
            <Ionicons
              name={listing.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
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
          <Text style={styles.previewPrice}>{formatPriceShort(listing.price)}/tháng</Text>
          <Text style={styles.previewMeta} numberOfLines={1}>
            {listing.area}m² • {listing.ward}, {listing.district}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: listing.images[0] }} style={styles.image} contentFit="cover" transition={150} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.gradient}
        />
        <View style={styles.infoOverlay}>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {listing.area}m² • {listing.district}
          </Text>
        </View>
        {onFavoritePress && (
          <TouchableOpacity
            onPress={onFavoritePress}
            style={[styles.heart, listing.isFavorite && styles.heartActive]}
            hitSlop={6}
          >
            <Ionicons
              name={listing.isFavorite ? 'heart' : 'heart-outline'}
              size={17}
              color={listing.isFavorite ? COLORS.warmGold : COLORS.darkBrown}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.priceBar}>
        <Text style={styles.price}>{formatPriceShort(listing.price)}/tháng</Text>
        {listing.status === 'rented' && (
          <Text style={styles.rentedTag}>Đã cho thuê</Text>
        )}
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
    height: '70%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 17,
    marginBottom: 3,
  },
  meta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.whiteOverlay,
    borderRadius: 18,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartActive: {
    backgroundColor: COLORS.white,
  },
  priceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.warmGold,
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
  listImage: {
    width: 104,
    height: 96,
  },
  listBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 17,
  },
  listMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  listPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.warmGold,
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
    color: COLORS.warmGold,
  },
  previewMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
