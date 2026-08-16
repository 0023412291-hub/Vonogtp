import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
}

/** Tiêu đề section: uppercase màu bronze + underline vàng nhạt */
export function SectionHeader({ title, right }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.bar} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: COLORS.warmGold,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.bronze,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
