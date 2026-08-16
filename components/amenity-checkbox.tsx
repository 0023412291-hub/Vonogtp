import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { COLORS } from '@/constants/colors';

interface AmenityCheckboxProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function AmenityCheckbox({ label, selected, onToggle }: AmenityCheckboxProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={selected ? COLORS.successGreen : COLORS.grayMedium}
      />
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    borderColor: COLORS.successGreen,
    backgroundColor: 'rgba(42, 157, 143, 0.08)',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  textSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
