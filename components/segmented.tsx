import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface SegmentedProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  style?: object;
}

/** Segmented control kiểu tab với underline vàng */
export function Segmented({ options, value, onChange, style }: SegmentedProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={styles.item}
            hitSlop={6}
          >
            <Text style={[styles.text, active && styles.textActive]}>{opt}</Text>
            <View style={[styles.underline, active && styles.underlineActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  textActive: {
    color: COLORS.darkBrown,
    fontWeight: '700',
  },
  underline: {
    position: 'absolute',
    bottom: -1,
    height: 2.5,
    width: 0,
    backgroundColor: COLORS.warmGold,
  },
  underlineActive: {
    width: '60%',
  },
});
