import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';

import { BORDER_RADIUS, COLORS } from '@/constants/colors';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'soft';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  small,
  style,
}: ActionButtonProps) {
  const palette = {
    primary: { bg: COLORS.warmGold, text: COLORS.darkBrown, border: COLORS.warmGold },
    outline: { bg: 'transparent', text: COLORS.warmGold, border: COLORS.warmGold },
    ghost: { bg: 'transparent', text: COLORS.textSecondary, border: 'transparent' },
    danger: { bg: COLORS.errorRed, text: COLORS.white, border: COLORS.errorRed },
    soft: { bg: COLORS.surface, text: COLORS.darkBrown, border: COLORS.border },
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.base,
        small && styles.small,
        { backgroundColor: palette.bg, borderColor: palette.border },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 15 : 18} color={palette.text} />}
          <Text
            style={[styles.label, small && styles.labelSmall, { color: palette.text }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 12,
  },
  disabled: {
    opacity: 0.5,
  },
});
