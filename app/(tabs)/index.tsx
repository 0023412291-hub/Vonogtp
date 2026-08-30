import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  PanResponder,
  RefreshControl,
  Share,
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
import { ManageListingsModal } from '@/components/manage-listings-modal';
import { PickerModal, type PickerOption } from '@/components/picker-modal';
import { SearchBar } from '@/components/search-bar';
import { SectionHeader } from '@/components/section-header';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { DISTRICTS } from '@/data/constants';
import { PROPERTY_TYPES, type Listing, type PropertyType } from '@/types';
import { activeFiltersCount, filterListings } from '@/utils/filters';
import { PRICE_PRESETS } from '@/utils/formatters';

const PAGE_SIZE = 8;

/** Chiều rộng drawer điều hướng: khoảng 2/3 màn hình, tối đa 420px */
const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.65, 420);

type ChipKey = 'price' | 'district' | 'type' | null;
type ViewMode = 'grid' | 'list';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    listings,
    myListings,
    favorites,
    filters,
    updateFilters,
    resetFilters,
    toggleFavorite,
    favoriteCount,
    deleteListing,
    markRented,
    user,
    activeRole,
    signOut,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [picker, setPicker] = useState<{ key: ChipKey; visible: boolean }>({ key: null, visible: false });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const drawerAnim = useRef(new Animated.Value(0)).current;
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

  // Thống kê cho dashboard chế độ đăng tin
  const activeCount = myListings.filter((l) => l.status === 'active').length;
  const rentedCount = myListings.filter((l) => l.status === 'rented').length;
  const firstName = user?.name?.split(' ').pop();

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

  // ---- Quản lý tin đã đăng ----
  const openManage = () => setManageOpen(true);
  const closeManage = () => setManageOpen(false);
  /** Mở wizard chỉnh sửa tin (các bước & giao diện như lúc đăng) */
  const handleEditListing = (l: Listing) => {
    setManageOpen(false);
    router.push({ pathname: '/(tabs)/post', params: { editId: l.id } });
  };
  const handleDeleteListing = (id: string) => deleteListing(id);
  /** Đánh dấu tin đã cho thuê — ngừng hiển thị tìm khách nhưng giữ lại tin */
  const handleMarkRented = (id: string) => markRented(id);
  const handleAddFromManage = () => {
    setManageOpen(false);
    router.push('/(tabs)/post');
  };

  const applyPrice = (value: string) => {
    const preset = PRICE_PRESETS.find((p) => `${p.min ?? ''}-${p.max ?? ''}` === value);
    if (preset) updateFilters({ priceMin: preset.min, priceMax: preset.max });
    closePicker();
  };

  /** Header cho phần danh sách card bên dưới */
  const renderGridHeader = () => (
    <View style={styles.gridHeader}>
      <SectionHeader title="Tin đăng mới nhất" />
    </View>
  );

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
        key={viewMode}
        data={shown}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'list' ? 1 : 2}
        columnWrapperStyle={viewMode === 'list' ? undefined : styles.gridRow}
        contentContainerStyle={viewMode === 'list' ? styles.listContentList : styles.listContent}
        renderItem={({ item }) => (
          <ListingCard
            variant={viewMode === 'list' ? 'list' : 'grid'}
            listing={item}
            onPress={() => router.push(`/listing/${item.id}`)}
            onFavoritePress={() => toggleFavorite(item.id)}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        extraData={favorites}
        ListHeaderComponent={renderGridHeader}
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

  /** Menu điều hướng: cài đặt, hỗ trợ, điều khoản và các chức năng khác */
  const menuItems = [
    { icon: 'settings-outline' as const, label: 'Cài đặt', action: () => router.push('/settings') },
    { icon: 'headset-outline' as const, label: 'Liên hệ hỗ trợ', action: () => router.push('/support') },
    { icon: 'document-text-outline' as const, label: 'Điều khoản & Chính sách', action: () => router.push('/terms') },
    {
      icon: 'share-social-outline' as const,
      label: 'Chia sẻ ứng dụng',
      action: () =>
        Share.share({
          message: 'VoNo - Tìm Nhà Nhanh: tìm phòng trọ, căn hộ, nhà nguyên căn nhanh chóng. Tải ngay!',
        }).catch(() => {}),
    },
  ];

  /** Mở drawer điều hướng */
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  /** Đóng drawer điều hướng: trượt ra kèm vùng tối mờ dần */
  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setDrawerOpen(false);
    });
  };

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  /** Vùng tối mờ dần theo độ mở drawer — đóng/mở mượt, không bị "tắt bụp" */
  const drawerBackdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  /** Vuốt từ mép trái màn hình sang phải → mở drawer */
  const edgePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => {
        setDrawerOpen(true);
        drawerAnim.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        drawerAnim.setValue(Math.max(0, Math.min(g.dx / DRAWER_WIDTH, 1)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > DRAWER_WIDTH * 0.3 || g.vx > 0.6) {
          Animated.spring(drawerAnim, { toValue: 1, bounciness: 0, useNativeDriver: true }).start();
        } else {
          Animated.timing(drawerAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(({ finished }) => {
            if (finished) setDrawerOpen(false);
          });
        }
      },
      onPanResponderTerminate: () => {
        drawerAnim.setValue(0);
        setDrawerOpen(false);
      },
    }),
  ).current;

  /** Vuốt drawer sang trái → đóng */
  const drawerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        drawerAnim.setValue(Math.max(0, Math.min(1 + g.dx / DRAWER_WIDTH, 1)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -DRAWER_WIDTH * 0.3 || g.vx < -0.6) {
          closeDrawer();
        } else {
          Animated.spring(drawerAnim, { toValue: 1, bounciness: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drawerAnim, { toValue: 1, bounciness: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  /** Nội dung drawer điều hướng — trượt từ mép trái, phủ khoảng 2/3 màn hình */
  const renderMenuDrawer = () => (
    <View style={[styles.drawer, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 14 }]}>
      <View style={styles.drawerHeader}>
        <View style={styles.brand}>
          <Ionicons name="home" size={16} color={COLORS.white} />
          <Text style={styles.brandName}>VoNo</Text>
        </View>
        <TouchableOpacity
          style={styles.drawerClose}
          onPress={closeDrawer}
          hitSlop={8}
        >
          <Ionicons name="close" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>
      </View>

      <Text style={styles.menuTitle}>Trình đơn</Text>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.menuItem}
          onPress={() => {
            closeDrawer();
            item.action();
          }}
        >
          <Ionicons name={item.icon} size={20} color={COLORS.bronze} />
          <Text style={styles.menuLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.drawerFooter}>
        <View style={styles.menuDivider} />
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            closeDrawer();
            signOut();
            router.replace('/auth');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.errorRed} />
          <Text style={[styles.menuLabel, { color: COLORS.errorRed }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.iconBtn} hitSlop={6}>
          <Ionicons name="menu" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>

        <View style={styles.brand}>
          <Ionicons name="home" size={18} color={COLORS.white} />
          <Text style={styles.brandName}>VoNo</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.viewToggle}>
            {(['grid', 'list'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.viewToggleBtn, viewMode === m && styles.viewToggleBtnActive]}
                onPress={() => setViewMode(m)}
                hitSlop={4}
              >
                <Ionicons
                  name={m === 'grid' ? 'grid-outline' : 'list-outline'}
                  size={17}
                  color={viewMode === m ? COLORS.white : COLORS.darkBrown}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/favorites')}
            style={styles.iconBtn}
            hitSlop={6}
          >
            <Ionicons name="heart-outline" size={22} color={COLORS.darkBrown} />
            {favoriteCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{favoriteCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/account')} hitSlop={6}>
            <Avatar name={user?.name ?? 'Khách'} size={34} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner theo chế độ: chủ nhà đăng tin → dashboard quản lý; người tìm nhà → lời chào */}
      {activeRole === 'owner' ? (
        <View style={styles.ownerBanner}>
          <View style={styles.ownerTop}>
            <View style={styles.ownerGreetWrap}>
              <Text style={styles.ownerGreeting}>Xin chào{firstName ? `, ${firstName}` : ''} 👋</Text>
              <Text style={styles.ownerSub}>
                Quản lý tin đăng và tiếp cận người thuê/mua dễ dàng
              </Text>
            </View>
            <View style={styles.ownerIconWrap}>
              <Ionicons name="megaphone" size={18} color={COLORS.warmGold} />
            </View>
          </View>
          <View style={styles.ownerStats}>
            <View style={styles.ownerStat}>
              <Text style={styles.ownerStatNum}>{activeCount}</Text>
              <Text style={styles.ownerStatLabel}>Tin đang hiển thị</Text>
            </View>
            <View style={styles.ownerStatDivider} />
            <View style={styles.ownerStat}>
              <Text style={styles.ownerStatNum}>{rentedCount}</Text>
              <Text style={styles.ownerStatLabel}>Đã cho thuê</Text>
            </View>
          </View>
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={styles.ownerPostBtn}
              onPress={() => router.push('/(tabs)/post')}
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.ownerPostText}>Đăng tin mới</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ownerManageBtn} onPress={openManage}>
              <Ionicons name="folder-open-outline" size={16} color={COLORS.darkBrown} />
              <Text style={styles.ownerManageText}>Quản lý tin</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.renterBanner}>
          <Ionicons name="home" size={16} color={COLORS.warmGold} />
          <Text style={styles.renterBannerText}>
            {firstName
              ? `Chào ${firstName}, hôm nay bạn muốn tìm nhà ở đâu?`
              : 'Bạn đang tìm nhà? Khám phá ngay bên dưới.'}
          </Text>
        </View>
      )}

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
          icon="chevron-down"
          onPress={() => setPicker({ key: 'price', visible: true })}
        />
        <FilterChip
          label="Khu vực"
          active={filters.districts.length > 0}
          icon="chevron-down"
          onPress={() => setPicker({ key: 'district', visible: true })}
        />
        <FilterChip
          label="Loại hình"
          active={filters.types.length > 0}
          icon="chevron-down"
          onPress={() => setPicker({ key: 'type', visible: true })}
        />
        <FilterChip
          label={filterCount > 0 ? `Lọc (${filterCount})` : 'Thêm'}
          active={filterCount > 0}
          icon={filterCount === 0 ? 'chevron-down' : undefined}
          onPress={() => router.push('/search')}
        />
        {filterCount > 0 && (
          <FilterChip label="Xoá lọc" active icon="close-circle" onPress={resetFilters} />
        )}
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

      {/* Vùng vuốt mép trái để mở drawer */}
      <View style={styles.edgeStrip} {...edgePan.panHandlers} />

      {/* Drawer điều hướng */}
      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.drawerOverlay}>
          <Animated.View
            style={[styles.drawerSheet, { width: DRAWER_WIDTH, transform: [{ translateX: drawerTranslateX }] }]}
            {...drawerPan.panHandlers}
          >
            {renderMenuDrawer()}
          </Animated.View>
          <Animated.View style={[styles.drawerBackdrop, { opacity: drawerBackdropOpacity }]}>
            <TouchableOpacity style={styles.drawerBackdropTouch} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
        </View>
      </Modal>

      {/* Quản lý tin đã đăng */}
      <ManageListingsModal
        visible={manageOpen}
        listings={myListings}
        onClose={closeManage}
        onEdit={handleEditListing}
        onDelete={handleDeleteListing}
        onMarkRented={handleMarkRented}
        onAdd={handleAddFromManage}
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
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 2,
    marginRight: 2,
  },
  viewToggleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.warmGold,
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
  // Banner chế độ tìm nhà
  renterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(14, 143, 142, 0.1)',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  renterBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  // Banner dashboard chế độ đăng tin
  ownerBanner: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: COLORS.darkBrown,
    padding: 14,
    gap: 12,
  },
  ownerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerGreetWrap: {
    flex: 1,
  },
  ownerGreeting: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  ownerSub: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    lineHeight: 16,
  },
  ownerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  ownerStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  ownerStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.warmGold,
  },
  ownerStatLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.7)',
  },
  ownerStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerPostBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.warmGold,
    borderRadius: 9,
    paddingVertical: 10,
  },
  ownerPostText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.white,
  },
  ownerManageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    borderRadius: 9,
    paddingVertical: 10,
  },
  ownerManageText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 24,
  },
  listContentList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  gridHeader: {
    paddingHorizontal: 8,
    marginTop: 10,
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
  drawer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  edgeStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 10,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,32,51,0.45)',
  },
  drawerBackdropTouch: {
    flex: 1,
  },
  drawerSheet: {
    height: '100%',
    backgroundColor: COLORS.white,
    ...SHADOWS.dark,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  drawerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerFooter: {
    marginTop: 'auto',
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
