import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';

export interface PickerOption {
  label: string;
  value: string;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string[] | string;
  multiple?: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
  onConfirm?: () => void;
}

/** Bottom sheet chọn option (single/multi) */
export function PickerModal({
  visible,
  title,
  options,
  selected,
  multiple = false,
  onSelect,
  onClose,
  onConfirm,
}: PickerModalProps) {
  const selectedArr = Array.isArray(selected) ? selected : [selected];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.list} bounces={false}>
            {options.map((opt) => {
              const isSelected = selectedArr.includes(opt.value);
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.option}
                  onPress={() => onSelect(opt.value)}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name={multiple ? 'checkbox' : 'radio-button-on'}
                      size={20}
                      color={COLORS.warmGold}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {multiple && onConfirm && (
            <View style={styles.footer}>
              <ActionButton label="Áp dụng" onPress={onConfirm} />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,32,51,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: 28,
    maxHeight: '72%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.grayLight,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  list: {
    paddingHorizontal: 18,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.darkBrown,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
});
