import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { firebaseEnabled } from '@/firebase';
import { ensureSessionSignIn, fetchUserProfile, isAnonymousUser, onAuthStateChange, saveUserProfile, signOutFirebase } from '@/firebase/auth';
import { registerFcmToken } from '@/firebase/messaging';
import {
  addLeadRemote,
  addListingRemote,
  addNotificationRemote,
  deleteListingRemote,
  incrementListingContacts,
  incrementListingSaves,
  incrementListingViews,
  markRentedRemote,
  seedFirestoreDataIfEmpty,
  subscribeFavorites,
  subscribeListings,
  subscribeVideos,
  toggleFavoriteRemote,
  updateListingRemote,
} from '@/firebase/firestore';
import { MOCK_LISTINGS, MOCK_VIDEOS } from '@/data/mock';
import { DEFAULT_FILTERS, type Filters, type Listing, type User, type UserRole, type Video } from '@/types';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface AppContextValue {
  listings: Listing[];
  myListings: Listing[];
  favorites: string[];
  /** Video tour nhà — realtime từ Firestore (Expo Go dùng mock) */
  videos: Video[];
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
  /** Khách bấm Gọi/Liên hệ trên tin: tăng contactCount + tạo lead cho chủ tin (1 lead/tin/session) */
  contactListing: (listing: Listing) => void;
  updateFilters: (partial: Partial<Filters>) => void;
  resetFilters: () => void;
  addListing: (data: Omit<Listing, 'id' | 'createdAt' | 'isFavorite' | 'status'>) => Promise<Listing>;
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
  const [listings, setListings] = useState<Listing[]>(() =>
    firebaseEnabled ? [] : MOCK_LISTINGS,
  );
  const [videos, setVideos] = useState<Video[]>(() => (firebaseEnabled ? [] : MOCK_VIDEOS));
  const [myListingsState, setMyListingsState] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  /** Tin đã tạo lead trong session này — tránh spam lead khi bấm Gọi nhiều lần */
  const [contactedIds, setContactedIds] = useState<string[]>([]);

  // ---- Đồng bộ dữ liệu từ Firestore (chỉ khi chạy bằng dev/preview build) ----
  useEffect(() => {
    if (!firebaseEnabled) return;
    let active = true;

    // Có session trước (ẩn danh nếu khách) để seed/ghi dữ liệu qua được security rules
    ensureSessionSignIn()
      .then(() => seedFirestoreDataIfEmpty())
      .catch(() => {});

    const unsub = subscribeListings(
      (remote) => {
        if (active) setListings(remote);
      },
      (error) => {
        if (__DEV__) console.warn('Firestore listings error:', error);
      },
    );
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Video tour nhà — realtime từ Firestore
  useEffect(() => {
    if (!firebaseEnabled) return;
    let active = true;
    const unsub = subscribeVideos(
      (remote) => {
        if (active) setVideos(remote);
      },
      (error) => {
        if (__DEV__) console.warn('Firestore videos error:', error);
      },
    );
    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Theo dõi danh sách yêu thích theo user đang đăng nhập
  useEffect(() => {
    setFavorites([]);
    if (!firebaseEnabled || !user?.uid) return;
    let active = true;
    const unsub = subscribeFavorites(user.uid, (ids) => {
      if (active) setFavorites(ids);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [user?.uid]);

  // ---- Auth ----
  const signIn = useCallback((u: User) => {
    setUser(u);
    if (firebaseEnabled && u.uid) {
      saveUserProfile({ ...u, uid: u.uid }).catch(() => {});
      // Xin quyền thông báo + lưu FCM token để nhận push
      registerFcmToken(u.uid).catch(() => {});
    }
  }, []);
  const signOut = useCallback(() => {
    if (firebaseEnabled) {
      signOutFirebase().catch(() => {});
    }
    setUser(null);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;
    let active = true;
    const unsubscribe = onAuthStateChange(async (uid) => {
      if (!active) return;
      // Session ẩn danh (khách): giữ quyền ghi dữ liệu nhưng UI coi như chưa đăng nhập
      if (uid && isAnonymousUser()) {
        setUser(null);
        return;
      }
      if (uid) {
        const profile = await fetchUserProfile(uid);
        if (!active) return;
        setUser(
          profile
            ? { ...profile, uid }
            : { uid, name: 'Người dùng', phone: '', email: '', role: 'renter' },
        );
        // Khôi phục session bằng tài khoản thật → đăng ký nhận push
        registerFcmToken(uid).catch(() => {});
      } else {
        setUser(null);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const activeRole: UserRole = user?.role ?? 'renter';

  // ---- Derived: gắn trạng thái yêu thích vào tin, tách tin của user ----
  const listingsWithFav = useMemo(
    () => listings.map((l) => ({ ...l, isFavorite: favorites.includes(l.id) })),
    [listings, favorites],
  );
  const myListings = useMemo(
    () =>
      firebaseEnabled
        ? listingsWithFav.filter((l) => l.ownerUid === user?.uid)
        : myListingsState,
    [firebaseEnabled, listingsWithFav, user?.uid, myListingsState],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      // Chưa đăng nhập (bản real) → không lưu được yêu thích
      if (firebaseEnabled && !user?.uid) return;
      setFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
        if (firebaseEnabled && user?.uid) {
          toggleFavoriteRemote(user.uid, id).catch(() => {});
          // Chỉ đếm lượt lưu khi là hành động LƯU (bỏ lưu không trừ)
          if (!prev.includes(id)) {
            incrementListingSaves(id).catch(() => {});
          }
        }
        return next;
      });
    },
    [firebaseEnabled, user?.uid],
  );

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const trackView = useCallback((id: string) => {
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 10));
    if (firebaseEnabled) {
      incrementListingViews(id).catch(() => {});
    }
  }, []);

  const contactListing = useCallback(
    (listing: Listing) => {
      // Mỗi lần bấm liên hệ đều tính là 1 lượt liên hệ của tin
      if (firebaseEnabled) {
        incrementListingContacts(listing.id).catch(() => {});
      }
      // Tạo lead cho chủ tin: cần đăng nhập, không phải tin của mình, mỗi tin 1 lead/session
      if (!firebaseEnabled || !user?.uid) return;
      if (!listing.ownerUid || listing.ownerUid === user.uid) return;
      if (contactedIds.includes(listing.id)) return;
      setContactedIds((prev) => [...prev, listing.id]);
      addLeadRemote({
        listingId: listing.id,
        ownerUid: listing.ownerUid,
        name: user.name || 'Khách hàng VoNo',
        phone: user.phone || '—',
        message: 'Tôi quan tâm tin này, vui lòng liên hệ lại với tôi.',
      })
        .then(() =>
          // Báo chủ tin có khách quan tâm (hiện trong THÔNG BÁO + push qua FCM token)
          addNotificationRemote({
            uid: listing.ownerUid as string,
            role: 'owner',
            icon: 'chatbubble-ellipses',
            title: 'Khách quan tâm tin của bạn',
            body: `${user.name || 'Một khách hàng'} vừa liên hệ tin "${listing.title}". Hãy phản hồi nhanh để chốt đơn.`,
          }),
        )
        .catch(() => {});
    },
    [firebaseEnabled, user?.uid, user?.name, user?.phone, contactedIds],
  );

  const recentListings = recentIds
    .map((id) => listingsWithFav.find((l) => l.id === id))
    .filter((l): l is Listing => Boolean(l));

  const updateFilters = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const addListing = useCallback(
    async (
      data: Omit<Listing, 'id' | 'createdAt' | 'isFavorite' | 'status'>,
    ): Promise<Listing> => {
      if (firebaseEnabled && user?.uid) {
        const id = await addListingRemote(data, user.uid);
        return {
          ...data,
          id,
          ownerUid: user.uid,
          createdAt: new Date().toISOString(),
          isFavorite: false,
          status: 'active',
        };
      }
      const id = `bds${Date.now().toString().slice(-7)}`;
      const listing: Listing = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        status: 'active',
      };
      setMyListingsState((prev) => [listing, ...prev]);
      setListings((prev) => [listing, ...prev]);
      return listing;
    },
    [firebaseEnabled, user?.uid],
  );

  const deleteListing = useCallback(
    (id: string) => {
      setMyListingsState((prev) => prev.filter((l) => l.id !== id));
      setListings((prev) => prev.filter((l) => l.id !== id));
      setFavorites((prev) => prev.filter((f) => f !== id));
      if (firebaseEnabled) {
        deleteListingRemote(id).catch(() => {});
      }
    },
    [firebaseEnabled],
  );

  const updateListing = useCallback((id: string, partial: Partial<Listing>) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...partial } : l)));
    setMyListingsState((prev) => prev.map((l) => (l.id === id ? { ...l, ...partial } : l)));
    if (firebaseEnabled) {
      updateListingRemote(id, partial).catch(() => {});
    }
  }, []);

  const markRented = useCallback((id: string) => {
    setMyListingsState((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'rented' } : l)),
    );
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'rented' } : l)),
    );
    if (firebaseEnabled) {
      markRentedRemote(id).catch(() => {});
    }
  }, []);

  const updateUser = useCallback(
    (partial: Partial<User>) =>
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...partial };
        if (firebaseEnabled && next.uid) {
          saveUserProfile({ ...next, uid: next.uid }).catch(() => {});
        }
        return next;
      }),
    [],
  );

  const getListing = useCallback(
    (id: string) => listingsWithFav.find((l) => l.id === id),
    [listingsWithFav],
  );

  const handleSetUserLocation = useCallback((loc: GeoPoint | null) => setUserLocation(loc), []);

  const handleCompleteOnboarding = useCallback(() => setOnboardingComplete(true), []);

  const value = useMemo<AppContextValue>(
    () => ({
      listings: listingsWithFav,
      myListings,
      favorites,
      videos,
      user,
      activeRole,
      filters,
      signIn,
      signOut,
      toggleFavorite,
      isFavorite,
      recentListings,
      trackView,
      contactListing,
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
      listingsWithFav,
      myListings,
      favorites,
      videos,
      user,
      activeRole,
      filters,
      signIn,
      signOut,
      toggleFavorite,
      isFavorite,
      recentListings,
      trackView,
      contactListing,
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