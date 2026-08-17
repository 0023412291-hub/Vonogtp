import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ListingCard } from '@/components/listing-card';
import { PickerModal } from '@/components/picker-modal';
import { SearchBar } from '@/components/search-bar';
import { COLORS } from '@/constants/colors';
import { useApp } from '@/context/app-context';

type SortKey = 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listings, favorites, toggleFavorite } = useApp();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);

  const favListings = useMemo(() => {
    let list = listings.filter((l) => favorites.includes(l.id));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => `${l.title} ${l.district} ${l.ward}`.toLowerCase().includes(q));
    }
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'newest')
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [listings, favorites, query, sort]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="heart" size={20} color={COLORS.warmGold} />
          <Text style={styles.title}>Tin Yêu Thích</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{favorites.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tools}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Tìm trong yêu thích..." />
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sắp xếp:</Text>
          <Text
            style={styles.sortValue}
            onPress={() => setSortOpen(true)}
          >
            {SORT_OPTIONS.find((o) => o.value === sort)?.label}{' '}
            <Ionicons name="chevron-down" size={12} color={COLORS.warmGold} />
          </Text>
        </View>
      </View>

      {favListings.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={favorites.length === 0 ? 'Bạn chưa lưu tin nào' : 'Không tìm thấy tin'}
          message={
            favorites.length === 0
              ? 'Bắt đầu lưu những tin yêu thích để xem lại nhanh chóng!'
              : 'Thử tìm kiếm với từ khoá khác.'
          }
          actionLabel={favorites.length === 0 ? 'Khám phá tin mới' : undefined}
          onAction={favorites.length === 0 ? () => router.push('/(tabs)') : undefined}
        />
      ) : (
        <FlatList
          data={favListings}
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
        />
      )}

      <PickerModal
        visible={sortOpen}
        title="Sắp xếp theo"
        options={SORT_OPTIONS}
        selected={sort}
        onSelect={(v) => {
          setSort(v as SortKey);
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  countBadge: {
    backgroundColor: 'rgba(14, 143, 142, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.warmGold,
  },
  tools: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  sortLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sortValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
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
});
