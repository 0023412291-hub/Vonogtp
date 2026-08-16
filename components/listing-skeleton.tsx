import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';

export function ListingSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.image} />
          <View style={styles.content}>
            <View style={[styles.line, { width: '90%' }]} />
            <View style={[styles.line, { width: '60%' }]} />
            <View style={[styles.line, { width: '40%', height: 12 }]} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 0.48,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  image: {
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.grayLight,
  },
  content: {
    padding: 10,
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.grayLight,
  },
});
