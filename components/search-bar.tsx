import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';

import { BORDER_RADIUS, COLORS } from '@/constants/colors';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  onPress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
}

/** Thanh tìm kiếm: nút bấm (trang chủ) hoặc TextInput thật (trang lưu tin) */
export function SearchBar({
  placeholder = 'Tìm phòng, căn hộ...',
  value,
  onChangeText,
  onPress,
  editable = true,
  autoFocus,
}: SearchBarProps) {
  const inputProps: TextInputProps = {
    value,
    onChangeText,
    placeholder,
    placeholderTextColor: COLORS.placeholder,
    style: styles.input,
    editable,
    autoFocus,
    returnKeyType: 'search',
  };

  if (!editable) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.container}>
        <Ionicons name="search" size={18} color={COLORS.grayMedium} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={COLORS.grayMedium} />
      <TextInput {...inputProps} />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText?.('')} hitSlop={8}>
          <Ionicons name="close-circle" size={17} color={COLORS.grayMedium} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.placeholder,
  },
});
