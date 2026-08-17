import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { BORDER_RADIUS, COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { PROPERTY_TYPES, type PropertyType } from '@/types';

const BUDGETS = [
  { label: 'Dưới 3 triệu', min: null, max: 3_000_000 },
  { label: '3 - 5 triệu', min: 3_000_000, max: 5_000_000 },
  { label: '5 - 8 triệu', min: 5_000_000, max: 8_000_000 },
  { label: '8 - 15 triệu', min: 8_000_000, max: 15_000_000 },
  { label: 'Trên 15 triệu', min: 15_000_000, max: null },
];

export default function NeedsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateFilters } = useApp();

  const [types, setTypes] = useState<PropertyType[]>([]);
  const [budget, setBudget] = useState<string | null>(null);

  const toggleType = (t: PropertyType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const continueFlow = () => {
    const preset = BUDGETS.find((b) => b.label === budget);
    updateFilters({
      types,
      priceMin: preset?.min ?? null,
      priceMax: preset?.max ?? null,
    });
    router.replace('/permissions');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Ionicons name="home" size={16} color={COLORS.white} />
          </View>
          <Text style={styles.brandName}>VoNo</Text>
        </View>
        <TouchableOpacity onPress={continueFlow} hitSlop={8}>
          <Text style={styles.skip}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>VoNo có thể giúp gì cho bạn?</Text>
        <Text style={styles.subtitle}>
          Chọn nhu cầu để chúng tôi gợi ý những tin phù hợp nhất. Bạn có thể bỏ qua bước này.
        </Text>

        {/* Property types */}
        <Text style={styles.blockLabel}>Bạn đang tìm loại hình nào?</Text>
        <View style={styles.typeGrid}>
          {PROPERTY_TYPES.map((t) => {
            const active = types.includes(t.value);
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => toggleType(t.value)}
              >
                <Ionicons
                  name={t.icon as never}
                  size={30}
                  color={active ? COLORS.warmGold : COLORS.grayMedium}
                />
                <Text style={[styles.typeText, active && styles.typeTextActive]}>{t.label}</Text>
                {active && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={12} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Budget */}
        <Text style={styles.blockLabel}>Mức giá mong muốn (tuỳ chọn)</Text>
        <View style={styles.budgetWrap}>
          {BUDGETS.map((b) => {
            const active = budget === b.label;
            return (
              <TouchableOpacity
                key={b.label}
                style={[styles.budgetChip, active && styles.budgetChipActive]}
                onPress={() => setBudget(active ? null : b.label)}
              >
                <Text style={[styles.budgetText, active && styles.budgetTextActive]}>{b.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.note}>
          💡 Bạn luôn có thể thay đổi bộ lọc này trong màn hình Khám Phá sau này.
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <ActionButton
          label="Tiếp tục"
          icon="arrow-forward"
          onPress={continueFlow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.warmGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  skip: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.darkBrown,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 22,
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  typeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  typeCardActive: {
    borderColor: COLORS.warmGold,
    backgroundColor: 'rgba(14, 143, 142, 0.08)',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeTextActive: {
    color: COLORS.darkBrown,
    fontWeight: '800',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.warmGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  budgetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  budgetChipActive: {
    backgroundColor: COLORS.warmGold,
    borderColor: COLORS.warmGold,
  },
  budgetText: {
    fontSize: 12.5,
    color: COLORS.text,
  },
  budgetTextActive: {
    color: COLORS.darkBrown,
    fontWeight: '700',
  },
  note: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
});
