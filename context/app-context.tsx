import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getFirebaseAuth } from '@/firebase/app';
import { ensureSessionSignIn, fetchUserProfileWithRetry, onAuthStateChange, saveUserProfile, signOutFirebase } from '@/firebase/auth';
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
  removeFavoriteRemote,
  subscribeFavorites,
  subscribeListings,
  toggleFavoriteRemote,
  updateListingRemote,
} from '@/firebase/firestore';
import { DEFAULT_FILTERS, type Filters, type Listing, type User, type UserRole } from '@/types';

/**
 * Auth + Firestore dùng Firebase JS SDK → luôn bật.
 * Khai báo cục bộ thay vì import từ '@/firebase' vì barrel đó bị Metro transform
 * mất lệnh export (firebaseEnabled luôn undefined tại runtime).
 */
const firebaseEnabled = true;

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface AppContextValue {
  listings: Listing[];
  myListings: Listing[];
  favorites: string[];
  /** Số tin yêu thích còn tồn tại (không đếm tin đã bị xóa) */
  favoriteCount: number;
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
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListingsState, setMyListingsState] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  /** Tin đã tạo lead trong session này — tránh spam lead khi bấm Gọi nhiều lần */
  const [contactedIds, setContactedIds] = useState<string[]>([]);
  /** uid session Firebase hiện tại (ẩn danh nếu khách) — dùng làm chủ tin khi khách đăng */
  const [sessionUid, setSessionUid] = useState<string | null>(null);
  /** Bản mới nhất của user để chặn fallback đè lên profile đã đăng nhập (kẹt closure) */
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ---- Đồng bộ dữ liệu từ Firestore (JS SDK — chạy cả trong Expo Go) ----
  useEffect(() => {
    console.log('[session] Effect khởi tạo chạy — firebaseEnabled =', firebaseEnabled);
    if (!firebaseEnabled) return;
    let active = true;

    // Có session trước (ẩn danh nếu khách) để ghi/đọc dữ liệu qua được security rules
    ensureSessionSignIn()
      .then(() => {
        if (active) setSessionUid(getFirebaseAuth().currentUser?.uid ?? null);
      })
      .catch((err) => {
        console.warn(
          '[session] Khởi tạo phiên Firebase lỗi:',
          (err as { code?: string })?.code ?? '',
          (err as { message?: string })?.message ?? err,
        );
      });

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

  // Theo dõi danh sách yêu thích theo user đang đăng nhập
  useEffect(() => {
    setFavorites([]);
    if (!firebaseEnabled || !user?.uid) return;
    let active = true;
    const unsub = subscribeFavorites(
      user.uid,
      (ids) => {
        if (active) setFavorites(ids);
      },
      (error) => {
        if (__DEV__) console.warn('Firestore favorites error:', error);
      },
    );
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
      // Đăng xuất rồi lập tức tạo session ẩn danh mới để khách vẫn đăng/ghi được dữ liệu
      signOutFirebase()
        .then(() => ensureSessionSignIn())
        .catch(() => {});
    }
    setUser(null);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;
    let active = true;

    /**
     * NGUỒN CHÂN LÝ = getFirebaseAuth().currentUser tại thời điểm XỬ LÝ, KHÔNG phải
     * uid truyền vào callback. Callback onAuthStateChanged có thể bắn uid của một
     * session cũ (vd anonymous vừa bị restore đè, hoặc đang đổi real↔anon) — nếu tin
     * theo uid đó sẽ "đầu độc" state user bằng uid không còn là currentUser, làm mọi
     * subscription favorites/leads/notifications đọc nhầm doc → bị rules chặn.
     */
    const syncFromAuth = () => {
      const fireAuth = getFirebaseAuth();
      const current = fireAuth.currentUser;
      const uid = current?.uid ?? null;
      // Luôn đồng bộ sessionUid theo auth user hiện tại (có thể là ẩn danh)
      setSessionUid(uid);
      // Ẩn danh hoặc chưa có session → khách
      if (!current || current.isAnonymous) {
        setUser(null);
        return;
      }
      const realUid = current.uid;
      (async () => {
        let profile: User | null = null;
        try {
          profile = await fetchUserProfileWithRetry(realUid);
        } catch (error) {
          // Token Firestore vừa đổi (real → anon...) lần đọc đầu có thể bị rules chặn tạm thời.
          if (__DEV__) {
            console.warn(
              `[session] Đọc hồ sơ Firestore bị chặn (uid=${realUid}), dùng hồ sơ mặc định:`,
              error,
            );
          }
        }
        if (!active) return;
        // Auth đã đổi user trong lúc đọc → bỏ kết quả cũ, event dành cho user mới đã xử lý
        if (getFirebaseAuth().currentUser?.uid !== realUid) return;
        // Fallback KHÔNG được đè profile mà luồng đăng nhập vừa set (signIn)
        if (!profile && userRef.current) return;
        setUser(
          profile
            ? { ...profile, uid: realUid }
            : { uid: realUid, name: 'Người dùng', phone: '', email: '', role: 'renter' },
        );
        // Khôi phục session bằng tài khoản thật → đăng ký nhận push
        registerFcmToken(realUid).catch(() => {});
      })();
    };

    const unsubscribe = onAuthStateChange(() => syncFromAuth());
    // Chạy ngay để đồng bộ trạng thái bắt đầu chính xác
    syncFromAuth();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const activeRole: UserRole = user?.role ?? 'renter';

  /**
   * uid dùng khi ghi/so khớp tin: tài khoản thật nếu đã đăng nhập,
   * ngược lại dùng session ẩn danh để tin của khách cũng lưu lên Firestore.
   */
  const writeUid = user?.uid ?? sessionUid;

  // ---- Derived: gắn trạng thái yêu thích vào tin, tách tin của user ----
  const listingsWithFav = useMemo(
    () => listings.map((l) => ({ ...l, isFavorite: favorites.includes(l.id) })),
    [listings, favorites],
  );
  const myListings = useMemo(
    () =>
      firebaseEnabled
        ? listingsWithFav.filter((l) => l.ownerUid && l.ownerUid === writeUid)
        : myListingsState,
    [firebaseEnabled, listingsWithFav, writeUid, myListingsState],
  );

  /**
   * Số tin yêu thích CÒN TỒN TẠI — tin đã bị xóa vẫn nằm trong favorites/{uid}.listingIds
   * nhưng không được đếm (các trang hiển thị số này phải dùng chung giá trị này).
   */
  const favoriteCount = useMemo(
    () => listings.filter((l) => favorites.includes(l.id)).length,
    [listings, favorites],
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
      let uid = writeUid;
      // Session ẩn danh chưa kịp tạo (mở app xong đăng tin ngay) → tạo ngay tại đây
      if (firebaseEnabled && !uid) {
        await ensureSessionSignIn().catch((err) => {
          console.warn('[addListing] Tạo session ẩn danh thất bại:', err);
        });
        uid = getFirebaseAuth().currentUser?.uid ?? null;
        if (uid) setSessionUid(uid);
        console.log('[addListing] uid sau khi đảm bảo session:', uid ?? 'NULL');
      }
      if (firebaseEnabled && uid) {
        const id = await addListingRemote(data, uid);
        return {
          ...data,
          id,
          ownerUid: uid,
          createdAt: new Date().toISOString(),
          isFavorite: false,
          status: 'active',
        };
      }
      // Chỉ rơi vào đây khi Firebase thực sự không khả dụng — tin lưu cục bộ (ID dạng bds...)
      console.warn('[addListing] KHÔNG có session Firebase — tin chỉ lưu trên máy, không lên Firestore');
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
    [firebaseEnabled, writeUid],
  );

  const deleteListing = useCallback(
    (id: string) => {
      setMyListingsState((prev) => prev.filter((l) => l.id !== id));
      setListings((prev) => prev.filter((l) => l.id !== id));
      setFavorites((prev) => prev.filter((f) => f !== id));
      if (firebaseEnabled) {
        deleteListingRemote(id).catch(() => {});
        // Tin đã bị xóa → dọn luôn khỏi danh sách yêu thích của chính user trên Firestore,
        // nếu không snapshot favorites sẽ kéo id chết trở lại (yêu thích "không được xóa").
        if (user?.uid) removeFavoriteRemote(user.uid, id).catch(() => {});
      }
    },
    [firebaseEnabled, user?.uid],
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
      favoriteCount,
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
      favoriteCount,
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