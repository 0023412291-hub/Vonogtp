import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface StepProgressProps {
  step: number; // 0-based
  total: number;
  labels?: string[];
}

export function StepProgress({ step, total, labels }: StepProgressProps) {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.row}>
        <Text style={styles.stepText}>
          Bước {step + 1}/{total}
          {labels?.[step] ? ` • ${labels[step]}` : ''}
        </Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.grayLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.warmGold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.bronze,
  },
  pct: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
