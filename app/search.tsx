import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { SearchBar } from '@/components/search-bar';
import { Segmented } from '@/components/segmented';
import { Stepper } from '@/components/stepper';
import { BORDER_RADIUS, COLORS, SHADOWS } from '@/constants/colors';
import { useApp } from '@/context/app-context';
import { HCMC_CENTER, SCHOOLS } from '@/data/constants';
import { PROPERTY_TYPES, type Condition, type PropertyType } from '@/types';
import { filterListings } from '@/utils/filters';
import { distanceKm, formatDistanceKm, formatPriceShort, PRICE_PRESETS } from '@/utils/formatters';

type SearchTab = 'school' | 'type' | 'map';

// Lazy import để tránh lỗi trên web
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string; focus?: string }>();
  const { listings, filters, updateFilters, userLocation, setUserLocation } = useApp();

  const [tab, setTab] = useState<SearchTab>(
    params.tab === 'map' ? 'map' : params.tab === 'type' ? 'type' : 'school',
  );
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolId, setSchoolId] = useState(filters.schoolId ?? '');
  const [maxDistance, setMaxDistance] = useState(filters.maxDistanceKm ?? 3);
  const [priceMin, setPriceMin] = useState<number | null>(filters.priceMin);
  const [priceMax, setPriceMax] = useState<number | null>(filters.priceMax);
  const [types, setTypes] = useState<PropertyType[]>(filters.types);
  const [bedrooms, setBedrooms] = useState<number | null>(filters.bedrooms);
  const [bathrooms, setBathrooms] = useState<number | null>(filters.bathrooms);
  const [condition, setCondition] = useState<Condition | null>(filters.condition);
  const [focusId, setFocusId] = useState<string | null>(params.focus ?? null);
  const mapRef = useRef<any>(null);

  // Chưa có vị trí (bỏ qua màn hình cấp quyền / mở lại app) → xin vị trí ngay tại đây
  useEffect(() => {
    if (userLocation) return;
    let active = true;
    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted && perm.canAskAgain) {
          perm = await Location.requestForegroundPermissionsAsync();
        }
        if (!perm.granted || !active) return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (active) {
          setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch {
        // Không lấy được vị trí — bản đồ vẫn dùng tâm mặc định
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const school = SCHOOLS.find((s) => s.id === schoolId);
  const schoolMatches = useMemo(() => {
    const q = schoolQuery.trim().toLowerCase();
    if (!q) return [];
    return SCHOOLS.filter((s) => s.name.toLowerCase().includes(q) || s.shortName.toLowerCase().includes(q)).slice(0, 5);
  }, [schoolQuery]);

  // Lọc preview theo bộ lọc cục bộ
  const localFilters = {
    ...filters,
    priceMin,
    priceMax,
    types,
    bedrooms,
    bathrooms,
    condition,
    schoolId: tab === 'school' ? schoolId : null,
    maxDistanceKm: tab === 'school' ? maxDistance : null,
  };
  const resultCount = filterListings(listings, localFilters).length;
  const mapListings = filterListings(listings, localFilters);

  useEffect(() => {
    if (focusId && MapView && mapRef.current) {
      const l = listings.find((x) => x.id === focusId);
      if (l) {
        mapRef.current.animateToRegion(
          { latitude: l.latitude, longitude: l.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
          600,
        );
      }
    }
  }, [focusId, listings]);

  const apply = () => {
    updateFilters({
      priceMin,
      priceMax,
      types,
      bedrooms,
      bathrooms,
      condition,
      schoolId: tab === 'school' ? schoolId : null,
      maxDistanceKm: tab === 'school' ? maxDistance : null,
    });
    router.back();
  };

  const selectSchool = (id: string) => {
    setSchoolId(id);
    setSchoolQuery('');
    const s = SCHOOLS.find((x) => x.id === id);
    if (s && MapView && mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: s.latitude, longitude: s.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        500,
      );
    }
  };

  const renderSchoolTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.blockLabel}>Tìm theo trường học (Hướng A)</Text>

      <View style={styles.schoolSearchWrap}>
        <SearchBar
          value={schoolQuery}
          onChangeText={setSchoolQuery}
          placeholder="Tìm trường: ĐH Bách Khoa, RMIT..."
        />
        {schoolMatches.length > 0 && (
          <View style={styles.suggestions}>
            {schoolMatches.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.suggestion}
                onPress={() => selectSchool(s.id)}
              >
                <Ionicons name="school-outline" size={16} color={COLORS.bronze} />
                <Text style={styles.suggestionText}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {school && (
        <View style={styles.schoolSelected}>
          <Ionicons name="school" size={16} color={COLORS.warmGold} />
          <Text style={styles.schoolSelectedText}>
            {school.name}{' '}
            <TouchableOpacity onPress={() => setSchoolId('')}>
              <Text style={styles.schoolClear}> ✕ Bỏ chọn</Text>
            </TouchableOpacity>
          </Text>
        </View>
      )}

      <Text style={styles.blockLabel}>
        Khoảng cách tối đa: <Text style={styles.highlight}>{formatDistanceKm(maxDistance)}</Text>
      </Text>
      <Slider
        minimumValue={0.5}
        maximumValue={10}
        step={0.5}
        value={maxDistance}
        onValueChange={setMaxDistance}
        minimumTrackTintColor={COLORS.warmGold}
        maximumTrackTintColor={COLORS.grayLight}
        thumbTintColor={COLORS.warmGold}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>500m</Text>
        <Text style={styles.sliderLabel}>10km+</Text>
      </View>

      <Text style={styles.blockLabel}>Mức giá</Text>
      <View style={styles.chipWrap}>
        {PRICE_PRESETS.map((p) => {
          const active = priceMin === p.min && priceMax === p.max;
          return (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => {
                setPriceMin(p.min);
                setPriceMax(p.max);
              }}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTypeTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.blockLabel}>Loại hình (Hướng B)</Text>
      <View style={styles.typeGrid}>
        {PROPERTY_TYPES.map((t) => {
          const active = types.includes(t.value);
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeCard, active && styles.typeCardActive]}
              onPress={() =>
                setTypes(
                  active ? types.filter((x) => x !== t.value) : [...types, t.value],
                )
              }
            >
              <Ionicons
                name={t.icon as never}
                size={22}
                color={active ? COLORS.warmGold : COLORS.grayMedium}
              />
              <Text style={[styles.typeCardText, active && styles.typeCardTextActive]}>
                {t.label}
              </Text>
              {active && <Ionicons name="checkmark-circle" size={16} color={COLORS.successGreen} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.stepperCard}>
        <View style={styles.stepperRow}>
          <View>
            <Text style={styles.stepperLabel}>Số phòng ngủ</Text>
            <Text style={styles.stepperHint}>{bedrooms == null ? 'Không yêu cầu' : `Tối thiểu ${bedrooms} phòng`}</Text>
          </View>
          <View style={styles.stepperRight}>
            {bedrooms != null && (
              <TouchableOpacity onPress={() => setBedrooms(null)} hitSlop={8}>
                <Text style={styles.clearText}>Xoá</Text>
              </TouchableOpacity>
            )}
            <Stepper
              value={bedrooms ?? 0}
              onChange={(v) => setBedrooms(v === 0 ? null : v)}
              min={0}
              max={6}
            />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.stepperRow}>
          <View>
            <Text style={styles.stepperLabel}>Số toilet</Text>
            <Text style={styles.stepperHint}>{bathrooms == null ? 'Không yêu cầu' : `Tối thiểu ${bathrooms} toilet`}</Text>
          </View>
          <View style={styles.stepperRight}>
            {bathrooms != null && (
              <TouchableOpacity onPress={() => setBathrooms(null)} hitSlop={8}>
                <Text style={styles.clearText}>Xoá</Text>
              </TouchableOpacity>
            )}
            <Stepper
              value={bathrooms ?? 0}
              onChange={(v) => setBathrooms(v === 0 ? null : v)}
              min={0}
              max={6}
            />
          </View>
        </View>
      </View>

      <Text style={styles.blockLabel}>Tình trạng</Text>
      <View style={styles.chipWrap}>
        {(
          [
            { value: 'new', label: 'Mới' },
            { value: 'needs_repair', label: 'Cần sửa chữa' },
          ] as { value: Condition; label: string }[]
        ).map((c) => {
          const active = condition === c.value;
          return (
            <TouchableOpacity
              key={c.value}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => setCondition(active ? null : c.value)}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.blockLabel}>Mức giá</Text>
      <View style={styles.chipWrap}>
        {PRICE_PRESETS.map((p) => {
          const active = priceMin === p.min && priceMax === p.max;
          return (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, active && styles.presetChipActive]}
              onPress={() => {
                setPriceMin(p.min);
                setPriceMax(p.max);
              }}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderMapTab = () => {
    if (!MapView || Platform.OS === 'web') {
      return (
        <View style={styles.mapFallback}>
          <Ionicons name="map-outline" size={44} color={COLORS.grayMedium} />
          <Text style={styles.mapFallbackTitle}>Bản đồ chỉ khả dụng trên thiết bị di động</Text>
          <Text style={styles.mapFallbackMsg}>Mở app bằng Expo Go trên iOS/Android để xem bản đồ trực quan (Hướng C).</Text>
        </View>
      );
    }

    const focused = focusId ? mapListings.find((l) => l.id === focusId) : null;
    const hasUserLocation = userLocation != null;
    const homeRegion = userLocation ?? HCMC_CENTER;

    return (
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={{
            latitude: focused?.latitude ?? homeRegion.latitude,
            longitude: focused?.longitude ?? homeRegion.longitude,
            latitudeDelta: focused ? 0.02 : hasUserLocation ? 0.045 : 0.09,
            longitudeDelta: focused ? 0.02 : hasUserLocation ? 0.045 : 0.09,
          }}
        >
          {mapListings.map((l) => (
            <Marker
              key={l.id}
              coordinate={{ latitude: l.latitude, longitude: l.longitude }}
              title={l.title}
              description={`${formatPriceShort(l.price)}/tháng`}
              onPress={() => setFocusId(l.id)}
            >
              <View style={[styles.markerPin, focusId === l.id && styles.markerPinActive]}>
                <Ionicons name="home" size={13} color={COLORS.white} />
              </View>
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity
          style={styles.locateBtn}
          onPress={() =>
            mapRef.current?.animateToRegion(
              { ...homeRegion, latitudeDelta: 0.045, longitudeDelta: 0.045 },
              500,
            )
          }
        >
          <Ionicons name="locate" size={18} color={COLORS.darkBrown} />
        </TouchableOpacity>

        {hasUserLocation && (
          <View style={styles.userLocationBadge}>
            <Ionicons name="navigate" size={12} color={COLORS.warmGold} />
            <Text style={styles.userLocationText}>Bạn ở đây</Text>
          </View>
        )}

        <View style={styles.mapResultBadge}>
          <Text style={styles.mapResultText}>
            {mapListings.length} tin trong khu vực hiển thị
          </Text>
        </View>

        {focused && (
          <TouchableOpacity
            style={styles.mapCard}
            activeOpacity={0.9}
            onPress={() => {
              updateFilters(localFilters);
              router.push(`/listing/${focused.id}`);
            }}
          >
            <Image source={{ uri: focused.images[0] }} style={styles.mapCardImg} contentFit="cover" />
            <View style={styles.mapCardBody}>
              <Text style={styles.mapCardTitle} numberOfLines={2}>
                {focused.title}
              </Text>
              <Text style={styles.mapCardPrice}>
                {formatPriceShort(focused.price)}/tháng
              </Text>
              <Text style={styles.mapCardMeta} numberOfLines={1}>
                {focused.area}m² • {focused.district}
                {school ? ` • Cách trường ${formatDistanceKm(distanceKm(focused, school))}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.grayMedium} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={6}>
          <Ionicons name="arrow-back" size={22} color={COLORS.darkBrown} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm nâng cao</Text>
        <TouchableOpacity onPress={apply} hitSlop={6}>
          <Text style={styles.applyText}>Áp dụng</Text>
        </TouchableOpacity>
      </View>

      <Segmented
        options={['Trường học', 'Loại hình', 'Bản đồ']}
        value={tab === 'school' ? 'Trường học' : tab === 'type' ? 'Loại hình' : 'Bản đồ'}
        onChange={(v) => setTab(v === 'Trường học' ? 'school' : v === 'Loại hình' ? 'type' : 'map')}
      />

      {tab !== 'map' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {tab === 'school' ? renderSchoolTab() : renderTypeTab()}
          <View style={styles.resultSummary}>
            <Text style={styles.resultText}>
              Tìm thấy <Text style={styles.resultStrong}>{resultCount}</Text> tin phù hợp
            </Text>
            <ActionButton label="Áp dụng bộ lọc" icon="checkmark" onPress={apply} style={styles.applyBtn} />
          </View>
        </ScrollView>
      )}

      {tab === 'map' && renderMapTab()}
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.darkBrown,
  },
  applyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warmGold,
  },
  tabContent: {
    padding: 16,
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBrown,
    marginTop: 14,
    marginBottom: 10,
  },
  highlight: {
    color: COLORS.warmGold,
  },
  schoolSearchWrap: {
    position: 'relative',
    zIndex: 10,
  },
  suggestions: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  schoolSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(14, 143, 142, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginTop: 10,
  },
  schoolSelectedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  schoolClear: {
    color: COLORS.errorRed,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  presetChipActive: {
    backgroundColor: COLORS.warmGold,
    borderColor: COLORS.warmGold,
  },
  presetText: {
    fontSize: 12,
    color: COLORS.text,
  },
  presetTextActive: {
    color: COLORS.darkBrown,
    fontWeight: '700',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
  },
  typeCardActive: {
    borderColor: COLORS.warmGold,
    backgroundColor: 'rgba(14, 143, 142, 0.08)',
  },
  typeCardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  typeCardTextActive: {
    fontWeight: '700',
    color: COLORS.darkBrown,
  },
  stepperCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  stepperHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  stepperRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.errorRed,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  resultSummary: {
    padding: 16,
    paddingTop: 8,
    gap: 10,
  },
  resultText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resultStrong: {
    color: COLORS.warmGold,
    fontWeight: '800',
    fontSize: 15,
  },
  applyBtn: {
    marginTop: 4,
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  mapFallbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.darkBrown,
    textAlign: 'center',
  },
  mapFallbackMsg: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  markerPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.warmGold,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  markerPinActive: {
    backgroundColor: COLORS.darkGold,
    transform: [{ scale: 1.15 }],
  },
  locateBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  mapResultBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(23,32,51,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  userLocationBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    ...SHADOWS.light,
  },
  userLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.darkBrown,
  },
  mapResultText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  mapCard: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 10,
    gap: 10,
    ...SHADOWS.dark,
  },
  mapCardImg: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
  },
  mapCardBody: {
    flex: 1,
    gap: 2,
  },
  mapCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkBrown,
    lineHeight: 17,
  },
  mapCardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.warmGold,
  },
  mapCardMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
