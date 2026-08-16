import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { COLORS } from '@/constants/colors';

interface LogoProps {
  size?: number;
  showText?: boolean;
  tagline?: boolean;
  style?: ViewStyle;
}

/** Logo VoNo: ngôi nhà stylized trên nền gradient vàng-đồng */
export function Logo({ size = 44, showText = true, tagline = false, style }: LogoProps) {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[COLORS.lightGold, COLORS.warmGold, COLORS.darkGold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Ionicons name="home" size={size * 0.52} color={COLORS.white} />
      </LinearGradient>
      {showText && (
        <View>
          <Text style={styles.name}>VoNo</Text>
          {tagline && <Text style={styles.tagline}>Tìm Nhà Nhanh</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.darkGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.darkBrown,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 11,
    color: COLORS.bronze,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
