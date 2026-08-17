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
            <View style={[styles.line, { width: '55%', height: 14 }]} />
            <View style={[styles.line, { width: '95%' }]} />
            <View style={[styles.line, { width: '80%' }]} />
            <View style={[styles.line, { width: '65%', height: 10 }]} />
            <View style={[styles.line, { width: '45%', height: 10 }]} />
            <View style={styles.footerLine} />
            <View style={[styles.line, { width: '50%', height: 9 }]} />
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
    gap: 7,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.grayLight,
  },
  footerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
});
