export type PropertyType = 'phong_tro' | 'can_ho' | 'nha_nguyen_can' | 'dat_nen';

export type ListingStatus = 'active' | 'rented';

export type Condition = 'new' | 'needs_repair';

/** Hình thức giao dịch: cho thuê hoặc bán */
export type DealType = 'rent' | 'sale';

/** Hướng nhà/đất (tính theo hướng cửa chính) */
export const DIRECTIONS = [
  'Đông',
  'Tây',
  'Nam',
  'Bắc',
  'Đông Bắc',
  'Đông Nam',
  'Tây Bắc',
  'Tây Nam',
] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** Giấy tờ pháp lý của bất động sản */
export const LEGALS = ['Sổ hồng', 'Sổ đỏ', 'Hợp đồng mua bán', 'Giấy tờ khác'] as const;
export type Legal = (typeof LEGALS)[number];

/** Mức độ nội thất đã trang bị sẵn */
export const FURNISHED_OPTIONS: { value: 'full' | 'basic' | 'none'; label: string }[] = [
  { value: 'full', label: 'Đầy đủ nội thất' },
  { value: 'basic', label: 'Nội thất cơ bản' },
  { value: 'none', label: 'Không nội thất' },
];
export type Furnished = 'full' | 'basic' | 'none';

export interface ListingContact {
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

export interface Listing {
  id: string;
  title: string;
  /** Giá theo VND (mặc định / tháng) */
  price: number;
  /** Diện tích m² */
  area: number;
  districtId: string;
  district: string;
  ward: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  yearBuilt?: number;
  /** Bán hay cho thuê (mặc định cho thuê khi seed/loại cũ) */
  deal?: DealType;
  /** Hướng cửa chính (căn hộ / nhà / đất nền) */
  direction?: Direction;
  /** Pháp lý (thường áp dụng với tin bán) */
  legal?: Legal;
  /** Mặt tiền (m) */
  frontage?: number;
  /** Mức độ nội thất đã trang bị */
  furnished?: Furnished;
  description: string;
  amenities: string[];
  images: string[];
  contact: ListingContact;
  /** Hiển thị SĐT trên tin hay chỉ liên hệ qua tin nhắn */
  showPhone: boolean;
  /** UID chủ tin (đặt khi người dùng đăng tin; tin mẫu/seed để trống) */
  ownerUid?: string;
  /** Số liệu hiệu quả tin đăng (mock): lượt xem, liên hệ, lượt lưu */
  views?: number;
  contactCount?: number;
  savedCount?: number;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
  status: ListingStatus;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
  condition?: Condition;
}

/** Thông báo trong app (bản thật lưu trên Firestore collection `notifications`) */
export interface AppNotification {
  id: string;
  /** UID người nhận — mock để trống */
  uid?: string;
  role: 'renter' | 'owner' | 'both';
  icon: string;
  title: string;
  body: string;
  /** Chuỗi hiển thị ("3 giờ trước") — tự tính từ createdAt nếu là bản thật */
  time: string;
}

/** Chế độ sử dụng: người tìm thuê/mua (renter) hoặc người đăng tin (owner) */
export type UserRole = 'renter' | 'owner';

/** Trạng thái xử lý khách quan tâm tin đăng */
export type LeadStatus = 'new' | 'contacted' | 'closed';

/** Khách quan tâm tin đăng (lưu thật trên Firestore collection `leads`) */
export interface Lead {
  id: string;
  name: string;
  phone: string;
  /** Tin mà khách quan tâm */
  listingId: string;
  message: string;
  status: LeadStatus;
  time: string;
}

/** Tin nhắn trong hội thoại chat giữa người thuê và chủ tin */
export interface ChatMessage {
  id: string;
  senderUid: string;
  text: string;
  /** ISO string (chuẩn hóa từ Firestore Timestamp) */
  createdAt: string;
  status: 'sent' | 'seen';
}

/** Hội thoại 1-1 gắn với một tin đăng */
export interface Conversation {
  id: string;
  participants: string[];
  listingId?: string;
  listingTitle?: string;
  /** Tên hiển thị của từng thành viên theo uid — denormalize để inbox không cần join users/ */
  memberInfo: Record<string, { name: string }>;
  lastMessage: { text: string; senderUid: string; createdAt: string };
  /** Số tin chưa đọc theo từng uid */
  unread: Record<string, number>;
  createdAt: string;
}

export const USER_ROLES: { value: UserRole; label: string; desc: string; icon: string }[] = [
  { value: 'renter', label: 'Tìm Nhà', desc: 'Xem, lọc và lưu tin phù hợp nhu cầu', icon: 'search-outline' },
  { value: 'owner', label: 'Đăng Tin', desc: 'Đăng và quản lý tin của bạn', icon: 'megaphone-outline' },
];

export interface User {
  /** Firebase Authentication UID (nếu đã liên kết Firebase) */
  uid?: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
}

export interface School {
  id: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
}

export interface District {
  id: string;
  name: string;
  wards: string[];
}

export interface Filters {
  query: string;
  priceMin: number | null;
  priceMax: number | null;
  districts: string[];
  types: PropertyType[];
  bedrooms: number | null;
  bathrooms: number | null;
  condition: Condition | null;
  schoolId: string | null;
  maxDistanceKm: number | null;
  /** Hình thức: bán / cho thuê / null = tất cả */
  deal: DealType | null;
  /** Bộ lọc hướng */
  directions: Direction[];
  /** Bộ lọc pháp lý (áp dụng với tin bán) */
  legals: Legal[];
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  priceMin: null,
  priceMax: null,
  districts: [],
  types: [],
  bedrooms: null,
  bathrooms: null,
  condition: null,
  schoolId: null,
  maxDistanceKm: null,
  deal: null,
  directions: [],
  legals: [],
};

export const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'phong_tro', label: 'Phòng trọ', icon: 'bed-outline' },
  { value: 'can_ho', label: 'Căn hộ', icon: 'business-outline' },
  { value: 'nha_nguyen_can', label: 'Nhà nguyên căn', icon: 'home-outline' },
  { value: 'dat_nen', label: 'Đất nền', icon: 'map-outline' },
];

export const AMENITIES = [
  'WiFi',
  'Máy lạnh',
  'Tủ lạnh',
  'Máy giặt',
  'TV',
  'Nấu ăn',
  'WC riêng',
  'Ban công',
  'Bếp riêng',
  'Thang máy',
  'Giặt ủi',
  'Bảo vệ',
];
