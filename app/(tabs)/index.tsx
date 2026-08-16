import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { FilterChip } from '@/components/filter-chip';
import { ListingCard } from '@/components/listing-card';
import { ListingSkeleton } from '@/components/listing-skeleton';
import { PickerModal, type PickerOption } from '@/components/picker-modal';
import { SearchBar } from '@/components/search-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { DISTRICTS } from '@/data/mock';
import { PROPERTY_TYPES, type PropertyType } from '@/types';
import { activeFiltersCount, filterListings } from '@/utils/filters';
import { PRICE_PRESETS } from '@/utils/formatters';

const PAGE_SIZE = 8;

type ChipKey = 'price' | 'district' | 'type' | null;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    listings,
    favorites,
    filters,
    updateFilters,
    toggleFavorite,
    user,
    signOut,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [picker, setPicker] = useState<{ key: ChipKey; visible: boolean }>({ key: null, visible: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const t = setTimeout(() => {
      if (mounted.current) setLoading(false);
    }, 650);
    return () => {
      mounted.current = false;
      clearTimeout(t);
    };
  }, []);

  const filtered = useMemo(() => filterListings(listings, filters), [listings, filters]);
  const shown = filtered.slice(0, visibleCount);
  const filterCount = activeFiltersCount(filters);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setVisibleCount(PAGE_SIZE);
      setRefreshing(false);
    }, 700);
  };

  const loadMore = () => {
    if (visibleCount < filtered.length) {
      setTimeout(() => setVisibleCount((c) => c + 4), 400);
    }
  };

  // ---- Pickers ----
  const priceOptions: PickerOption[] = PRICE_PRESETS.map((p) => ({
    label: p.label,
    value: `${p.min ?? ''}-${p.max ?? ''}`,
  }));
  const selectedPrice =
    filters.priceMin != null || filters.priceMax != null
      ? `${filters.priceMin ?? ''}-${filters.priceMax ?? ''}`
      : '';

  const districtOptions: PickerOption[] = DISTRICTS.map((d) => ({ label: d.name, value: d.name }));
  const typeOptions: PickerOption[] = PROPERTY_TYPES.map((t) => ({ label: t.label, value: t.value }));

  const closePicker = () => setPicker({ key: null, visible: false });

  const applyPrice = (value: string) => {
    const preset = PRICE_PRESETS.find((p) => `${p.min ?? ''}-${p.max ?? ''}` === value);
    if (preset) updateFilters({ priceMin: preset.min, priceMax: preset.max });
    closePicker();
  };

  const renderGrid = () => {
    if (loading) {
      return (
        <View style={styles.gridRow}>
          <ListingSkeleton />
        </View>
      );
    }
    if (shown.length === 0) {
      return (
        <EmptyState
          icon="search-outline"
          title="Không tìm thấy tin phù hợp"
          message="Thử điều chỉnh bộ lọc hoặc xoá bớt điều kiện tìm kiếm."
          actionLabel="Xoá bộ lọc"
          onAction={() => {
            updateFilters({ priceMin: null, priceMax: null, districts: [], types: [], bedrooms: null, bathrooms: null, condition: null, schoolId: null, maxDistanceKm: null });
          }}
        />
      );
    }
    return (
      <FlatList
        data={shown}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => router.push(`/listing/${item.id}`)}
            onFavoritePress={() => toggleFavorite(item.id)}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.warmGold} />}
        ListFooterComponent={
          visibleCount < filtered.length ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Đang tải thêm...</Text>
            </View>
          ) : null
        }
      />
    );
  };

  const menuItems = [
    { icon: 'compass-outline' as const, label: 'Khám phá tin mới', route: '/(tabs)' as const },
    { icon: 'options-outline' as const, label: 'Tìm kiếm nâng cao', route: '/search' as const },
    { icon: 'heart-outline' as const, label: 'Tin đã lưu', route: '/(tabs)/favorites' as const },
    { icon: 'person-outline' as const, label: 'Tài khoản', route: '/(tabs)/account' as const },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.iconBtn} hitSlop={6}>
          <Ionicons name="menu" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>

        <View style={styles.brand}>
          <Ionicons name="home" size={18} color={COLORS.white} />
          <Text style={styles.brandName}>VoNo</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/favorites')}
            style={styles.iconBtn}
            hitSlop={6}
          >
            <Ionicons name="heart-outline" size={22} color={COLORS.darkBrown} />
            {favorites.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{favorites.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')} hitSlop={6}>
            <Avatar name={user?.name ?? 'Khách'} size={34} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="🔍 Tìm phòng, căn hộ..."
          editable={false}
          onPress={() => router.push('/search')}
        />
      </View>

      {/* Filter chips */}
      <View style={styles.chips}>
        <FilterChip
          label="Giá"
          active={filterCount > 0 && (filters.priceMin != null || filters.priceMax != null)}
          chevron
          onPress={() => setPicker({ key: 'price', visible: true })}
        />
        <FilterChip
          label="Khu vực"
          active={filters.districts.length > 0}
          chevron
          onPress={() => setPicker({ key: 'district', visible: true })}
        />
        <FilterChip
          label="Loại hình"
          active={filters.types.length > 0}
          chevron
          onPress={() => setPicker({ key: 'type', visible: true })}
        />
        <FilterChip
          label={filterCount > 0 ? `Lọc (${filterCount})` : 'Thêm'}
          active={filterCount > 0}
          chevron={filterCount === 0}
          onPress={() => router.push('/search')}
        />
      </View>

      {renderGrid()}

      {/* Picker: Giá */}
      <PickerModal
        visible={picker.key === 'price' && picker.visible}
        title="Chọn mức giá"
        options={priceOptions}
        selected={selectedPrice}
        onSelect={applyPrice}
        onClose={closePicker}
      />

      {/* Picker: Khu vực */}
      <PickerModal
        visible={picker.key === 'district' && picker.visible}
        title="Chọn khu vực"
        options={districtOptions}
        selected={filters.districts}
        multiple
        onSelect={(v) =>
          updateFilters({
            districts: filters.districts.includes(v)
              ? filters.districts.filter((d) => d !== v)
              : [...filters.districts, v],
          })
        }
        onConfirm={closePicker}
        onClose={closePicker}
      />

      {/* Picker: Loại hình */}
      <PickerModal
        visible={picker.key === 'type' && picker.visible}
        title="Chọn loại hình"
        options={typeOptions}
        selected={filters.types as string[]}
        multiple
        onSelect={(v) => {
          const t = v as PropertyType;
          updateFilters({
            types: filters.types.includes(t)
              ? filters.types.filter((x) => x !== t)
              : [...filters.types, t],
          });
        }}
        onConfirm={closePicker}
        onClose={closePicker}
      />

      {/* Menu modal */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuSheet, { top: insets.top + 52 }]}>
            <Text style={styles.menuTitle}>Trình đơn</Text>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(item.route);
                }}
              >
                <Ionicons name={item.icon} size={20} color={COLORS.bronze} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                signOut();
                router.replace('/auth');
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.errorRed} />
              <Text style={[styles.menuLabel, { color: COLORS.errorRed }]}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.warmGold,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: 0,
    backgroundColor: COLORS.errorRed,
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  searchWrap: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 24,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 12,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,32,51,0.35)',
  },
  menuSheet: {
    position: 'absolute',
    left: 12,
    width: 230,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    ...SHADOWS.medium,
  },
  menuTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
});
