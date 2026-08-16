import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { COLORS } from '@/constants/colors';

interface FilterChipProps {
  label: string;
  active?: boolean;
  chevron?: boolean;
  onPress?: () => void;
}

export function FilterChip({ label, active = false, chevron = false, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
      {chevron && (
        <Ionicons
          name="chevron-down"
          size={12}
          color={active ? COLORS.darkBrown : COLORS.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: {
    backgroundColor: COLORS.warmGold,
    borderColor: COLORS.warmGold,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  textActive: {
    color: COLORS.darkBrown,
    fontWeight: '600',
  },
});
