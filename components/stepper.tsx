import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

export function Stepper({ value, onChange, min = 0, max = 20, suffix }: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, !canDecrease && styles.btnDisabled]}
        disabled={!canDecrease}
        onPress={() => onChange(value - 1)}
        hitSlop={6}
      >
        <Ionicons name="remove" size={18} color={canDecrease ? COLORS.darkBrown : COLORS.grayMedium} />
      </TouchableOpacity>
      <Text style={styles.value}>
        {value}
        {suffix ? <Text style={styles.suffix}> {suffix}</Text> : null}
      </Text>
      <TouchableOpacity
        style={[styles.btn, !canIncrease && styles.btnDisabled]}
        disabled={!canIncrease}
        onPress={() => onChange(value + 1)}
        hitSlop={6}
      >
        <Ionicons name="add" size={18} color={canIncrease ? COLORS.darkBrown : COLORS.grayMedium} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  value: {
    minWidth: 42,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  suffix: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
