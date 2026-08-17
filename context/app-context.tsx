import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { MOCK_LISTINGS } from '@/data/mock';
import { DEFAULT_FILTERS, type Filters, type Listing, type User, type UserRole } from '@/types';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface AppContextValue {
  listings: Listing[];
  myListings: Listing[];
  favorites: string[];
  user: User | null;
  /** Chế độ đang dùng: mặc định renter khi chưa đăng nhập hoặc chưa chọn */
  activeRole: UserRole;
  filters: Filters;
  signIn: (user: User) => void;
  signOut: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  /** Các tin vừa xem gần đây (mới nhất trước) */
  recentListings: Listing[];
  /** Ghi nhận lượt xem một tin — thêm vào danh sách gần đây */
  trackView: (id: string) => void;
  updateFilters: (partial: Partial<Filters>) => void;
  resetFilters: () => void;
  addListing: (data: Omit<Listing, 'id' | 'createdAt' | 'isFavorite' | 'status'>) => Listing;
  deleteListing: (id: string) => void;
  /** Cập nhật một phần dữ liệu tin đã đăng (dùng trong chỉnh sửa tin) */
  updateListing: (id: string, partial: Partial<Listing>) => void;
  markRented: (id: string) => void;
  updateUser: (user: Partial<User>) => void;
  getListing: (id: string) => Listing | undefined;
  userLocation: GeoPoint | null;
  setUserLocation: (loc: GeoPoint | null) => void;
  /** Đã hoàn tất luồng mở app (splash → nhu cầu → quyền) chưa */
  onboardingComplete: boolean;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const signIn = useCallback((u: User) => setUser(u), []);
  const signOut = useCallback(() => setUser(null), []);

  const activeRole: UserRole = user?.role ?? 'renter';

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l)),
    );
    setMyListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isFavorite: !l.isFavorite } : l)),
    );
  }, []);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const trackView = useCallback((id: string) => {
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 10));
  }, []);

  const recentListings = recentIds
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is Listing => Boolean(l));

  const updateFilters = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const addListing = useCallback(
    (data: Omit<Listing, 'id' | 'createdAt' | 'isFavorite' | 'status'>): Listing => {
      const id = `bds${Date.now().toString().slice(-7)}`;
      const listing: Listing = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        status: 'active',
      };
      setMyListings((prev) => [listing, ...prev]);
      setListings((prev) => [listing, ...prev]);
      return listing;
    },
    [],
  );

  const deleteListing = useCallback((id: string) => {
    setMyListings((prev) => prev.filter((l) => l.id !== id));
    setListings((prev) => prev.filter((l) => l.id !== id));
    setFavorites((prev) => prev.filter((f) => f !== id));
  }, []);

  const updateListing = useCallback((id: string, partial: Partial<Listing>) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...partial } : l)));
    setMyListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...partial } : l)));
  }, []);

  const markRented = useCallback((id: string) => {
    setMyListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'rented' } : l)),
    );
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'rented' } : l)),
    );
  }, []);

  const updateUser = useCallback(
    (partial: Partial<User>) => setUser((prev) => (prev ? { ...prev, ...partial } : prev)),
    [],
  );

  const getListing = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings],
  );

  const handleSetUserLocation = useCallback((loc: GeoPoint | null) => setUserLocation(loc), []);

  const handleCompleteOnboarding = useCallback(() => setOnboardingComplete(true), []);

  const value = useMemo<AppContextValue>(
    () => ({
      listings,
      myListings,
      favorites,
      user,
      activeRole,
      filters,
      signIn,
      signOut,
      toggleFavorite,
      isFavorite,
      recentListings,
      trackView,
      updateFilters,
      resetFilters,
      addListing,
      deleteListing,
      updateListing,
      markRented,
      updateUser,
      getListing,
      userLocation,
      setUserLocation: handleSetUserLocation,
      onboardingComplete,
      completeOnboarding: handleCompleteOnboarding,
    }),
    [
      listings,
      myListings,
      favorites,
      user,
      activeRole,
      filters,
      signIn,
      signOut,
      toggleFavorite,
      isFavorite,
      recentListings,
      trackView,
      updateFilters,
      resetFilters,
      addListing,
      deleteListing,
      updateListing,
      markRented,
      updateUser,
      getListing,
      userLocation,
      handleSetUserLocation,
      onboardingComplete,
      handleCompleteOnboarding,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
