import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface AvatarProps {
  name: string;
  size?: number;
  uri?: string | null;
}

export function Avatar({ name, size = 40, uri }: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warmGold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGold,
  },
  initials: {
    color: COLORS.white,
    fontWeight: '800',
  },
});
