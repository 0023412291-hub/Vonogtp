import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { BORDER_RADIUS, COLORS } from '@/constants/colors';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  secure?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  hint?: string;
  counter?: { current: number; max: number };
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  prefix?: string;
}

export function FormField({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  maxLength,
  secure,
  multiline,
  numberOfLines = 4,
  hint,
  counter,
  autoCapitalize = 'sentences',
  prefix,
}: FormFieldProps) {
  const [show, setShow] = useState(!secure);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <View style={[styles.inputWrap, error && styles.inputError, multiline && styles.inputMultiline]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, multiline && styles.textarea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={!show}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          autoCapitalize={autoCapitalize}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={COLORS.grayMedium}
            />
          </TouchableOpacity>
        )}
      </View>
      {counter && (
        <Text style={[styles.counter, counter.current > counter.max && styles.counterError]}>
          {counter.current}/{counter.max} ký tự
        </Text>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
    marginBottom: 6,
  },
  required: {
    color: COLORS.errorRed,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
  },
  inputMultiline: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  inputError: {
    borderColor: COLORS.errorRed,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  prefix: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  error: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.errorRed,
  },
  hint: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  counter: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  counterError: {
    color: COLORS.errorRed,
  },
});
