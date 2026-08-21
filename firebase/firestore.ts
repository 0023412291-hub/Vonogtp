import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';

import { MOCK_LEADS, MOCK_LISTINGS } from '@/data/mock';
import type { Lead, LeadStatus } from '@/data/mock';
import type { AppNotification, Listing, Video } from '@/types';

type FirestoreDocumentData = Record<string, unknown>;

/** Firestore trả về Timestamp cho createdAt — chuẩn hóa về ISO string */
function normalizeTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  const maybeDate = (value as { toDate?: () => Date }).toDate?.();
  if (maybeDate instanceof Date) return maybeDate.toISOString();
  return new Date().toISOString();
}

/** Chuyển doc listing từ Firestore sang đúng kiểu Listing (isFavorite do context tính) */
function normalizeListing(id: string, data: FirestoreDocumentData): Listing {
  const { createdAt, ...rest } = data;
  return {
    ...(rest as Omit<Listing, 'id' | 'createdAt' | 'isFavorite'>),
    id,
    createdAt: normalizeTimestamp(createdAt),
    isFavorite: false,
  } as Listing;
}

/** Chuyển doc lead từ Firestore sang kiểu Lead (tính thời gian tương đối nếu là lead thật) */
function normalizeLead(id: string, data: FirestoreDocumentData): Lead {
  const base = { ...(data as unknown as Lead), id };
  if (!base.time && data.createdAt) {
    base.time = relativeTimeFromNow(normalizeTimestamp(data.createdAt));
  }
  return base;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Đổi mốc thời gian thành chuỗi kiểu "3 phút trước" để hiển thị danh sách lead */
function relativeTimeFromNow(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MINUTE_MS) return 'Vừa xong';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} phút trước`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} giờ trước`;
  const days = Math.floor(diff / DAY_MS);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

/** Theo dõi realtime toàn bộ tin đăng (đọc công khai, không cần đăng nhập) */
export function subscribeListings(
  callback: (listings: Listing[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(collection(getFirestore(), 'listings'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => normalizeListing(d.id, d.data() as FirestoreDocumentData)));
    },
    (error) => onError?.(error),
  );
}

/** Theo dõi realtime danh sách video tour nhà */
export function subscribeVideos(
  callback: (videos: Video[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(collection(getFirestore(), 'videos'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ ...(d.data() as Video), id: d.id })));
    },
    (error) => onError?.(error),
  );
}

/** Theo dõi realtime danh sách id tin yêu thích của một user */
export function subscribeFavorites(uid: string, callback: (ids: string[]) => void): () => void {
  const ref = doc(getFirestore(), 'favorites', uid);
  return onSnapshot(ref, (snap) => {
    const data = snap.data() as FirestoreDocumentData | undefined;
    const ids = data?.listingIds;
    callback(Array.isArray(ids) ? (ids as string[]) : []);
  });
}

/** Thêm/bỏ một tin vào danh sách yêu thích của user trên Firestore */
export async function toggleFavoriteRemote(uid: string, listingId: string): Promise<void> {
  const ref = doc(getFirestore(), 'favorites', uid);
  const current = await getDoc(ref);
  const ids: string[] =
    current.exists() && Array.isArray(current.data()?.listingIds)
      ? ((current.data()?.listingIds as unknown[]) as string[])
      : [];
  const next = ids.includes(listingId) ? ids.filter((x) => x !== listingId) : [...ids, listingId];
  await setDoc(ref, { listingIds: next }, { merge: true });
}

/** Tạo tin mới trên Firestore — trả về id tin vừa tạo */
export async function addListingRemote(
  data: Omit<Listing, 'id' | 'createdAt' | 'isFavorite' | 'status'>,
  uid: string,
): Promise<string> {
  const ref = await addDoc(collection(getFirestore(), 'listings'), {
    ...data,
    ownerUid: uid,
    status: 'active',
    isFavorite: false,
    views: 0,
    contactCount: 0,
    savedCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Cập nhật một phần tin đăng trên Firestore */
export async function updateListingRemote(id: string, partial: Partial<Listing>): Promise<void> {
  await updateDoc(doc(getFirestore(), 'listings', id), partial as Record<string, unknown>);
}

/** Xóa tin đăng trên Firestore */
export async function deleteListingRemote(id: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), 'listings', id));
}

/** Đánh dấu tin đã cho thuê */
export async function markRentedRemote(id: string): Promise<void> {
  await updateDoc(doc(getFirestore(), 'listings', id), { status: 'rented' });
}

/** Tăng lượt xem tin (analytics-lite, gọi khi mở chi tiết tin) */
export async function incrementListingViews(id: string): Promise<void> {
  await updateDoc(doc(getFirestore(), 'listings', id), { views: increment(1) });
}

/** Tăng số lần khách bấm liên hệ trên tin (analytics-lite) */
export async function incrementListingContacts(id: string): Promise<void> {
  await updateDoc(doc(getFirestore(), 'listings', id), { contactCount: increment(1) });
}

/** Tăng lượt lưu tin (analytics-lite, chỉ gọi khi thêm vào yêu thích) */
export async function incrementListingSaves(id: string): Promise<void> {
  await updateDoc(doc(getFirestore(), 'listings', id), { savedCount: increment(1) });
}

/** Tạo lead thật khi khách bấm Gọi/Liên hệ trên tin — chủ tin sẽ thấy trong "Khách quan tâm" */
export async function addLeadRemote(params: {
  listingId: string;
  ownerUid: string;
  name: string;
  phone: string;
  message: string;
}): Promise<void> {
  await addDoc(collection(getFirestore(), 'leads'), {
    ...params,
    status: 'new',
    createdAt: serverTimestamp(),
  });
}

/**
 * Theo dõi realtime khách quan tâm của một chủ tin.
 * Gồm lead riêng của user + lead demo (ownerUid rỗng) để giữ nội dung mẫu.
 */
export function subscribeLeads(uid: string, callback: (leads: Lead[]) => void): () => void {
  const db = getFirestore();
  const ownQuery = query(collection(db, 'leads'), where('ownerUid', '==', uid));
  const demoQuery = query(collection(db, 'leads'), where('ownerUid', '==', ''));

  let ownLeads: Lead[] = [];
  let demoLeads: Lead[] = [];
  let pending = 2;
  let active = true;
  const flush = () => {
    if (active && pending === 0) callback([...ownLeads, ...demoLeads]);
  };
  const read = (snap: { docs: { id: string; data: () => FirestoreDocumentData }[] }): Lead[] =>
    snap.docs.map((d) => normalizeLead(d.id, d.data()));

  const unsubOwn = onSnapshot(ownQuery, (snap) => {
    ownLeads = read(snap);
    pending = Math.max(0, pending - 1);
    flush();
  });
  const unsubDemo = onSnapshot(demoQuery, (snap) => {
    demoLeads = read(snap);
    pending = Math.max(0, pending - 1);
    flush();
  });

  return () => {
    active = false;
    unsubOwn();
    unsubDemo();
  };
}

/** Cập nhật trạng thái khách quan tâm (Mới → Đã liên hệ → Đã chốt) */
export async function updateLeadStatusRemote(id: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(getFirestore(), 'leads', id), { status });
}

/** Chuẩn hóa doc notification: tính chuỗi thời gian tương đối từ createdAt */
function normalizeNotification(id: string, data: FirestoreDocumentData): AppNotification {
  const base = { ...(data as unknown as AppNotification), id };
  if (!base.time && data.createdAt) {
    base.time = relativeTimeFromNow(normalizeTimestamp(data.createdAt));
  }
  return base;
}

/** Theo dõi realtime thông báo của một user (mới nhất trước) */
export function subscribeNotifications(
  uid: string,
  callback: (items: AppNotification[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(collection(getFirestore(), 'notifications'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as FirestoreDocumentData;
        const ms = new Date(normalizeTimestamp(data.createdAt)).getTime();
        return { item: normalizeNotification(d.id, data), ms };
      });
      items.sort((a, b) => b.ms - a.ms);
      callback(items.map((x) => x.item));
    },
    (error) => onError?.(error),
  );
}

/** Tạo một thông báo cho user (vd: chủ tin có khách quan tâm) */
export async function addNotificationRemote(params: {
  uid: string;
  role: AppNotification['role'];
  icon: string;
  title: string;
  body: string;
}): Promise<void> {
  await addDoc(collection(getFirestore(), 'notifications'), {
    ...params,
    createdAt: serverTimestamp(),
  });
}

// ---- Seed dữ liệu mẫu ----

let seeding = false;
let seededOnce = false;

/**
 * Nếu collection listings đang trống, đẩy dữ liệu mẫu (14 tin + khách quan tâm) lên Firestore.
 * Chỉ chạy 1 lần trong session, tự động khi mở app lần đầu với dữ liệu trống.
 */
export async function seedFirestoreDataIfEmpty(): Promise<void> {
  if (seeding || seededOnce) return;
  const db = getFirestore();
  const existing = await getDocs(collection(db, 'listings'));
  if (!existing.empty) {
    seededOnce = true;
    return;
  }
  seeding = true;
  try {
    const batch = writeBatch(db);
    for (const listing of MOCK_LISTINGS) {
      const ref = doc(collection(db, 'listings'), listing.id);
      batch.set(ref, { ...listing, ownerUid: '' });
    }
    for (const lead of MOCK_LEADS) {
      const ref = doc(collection(db, 'leads'), lead.id);
      batch.set(ref, { ...lead, ownerUid: '' });
    }
    await batch.commit();
    seededOnce = true;
  } finally {
    seeding = false;
  }
}