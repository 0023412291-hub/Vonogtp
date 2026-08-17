import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
}

export function RatingStars({ rating, count, size = 13 }: RatingStarsProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="star" size={size} color={COLORS.priceAccent} />
      <Text style={styles.rating}>{rating.toFixed(1)}</Text>
      {count != null && <Text style={styles.count}>({count} đánh giá)</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  count: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
