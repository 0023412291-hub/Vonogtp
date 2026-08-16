export type PropertyType = 'phong_tro' | 'can_ho' | 'nha_nguyen_can' | 'dat_nen';

export type ListingStatus = 'active' | 'rented';

export type Condition = 'new' | 'needs_repair';

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
  description: string;
  amenities: string[];
  images: string[];
  contact: ListingContact;
  /** Hiển thị SĐT trên tin hay chỉ liên hệ qua tin nhắn */
  showPhone: boolean;
  latitude: number;
  longitude: number;
  isFavorite: boolean;
  status: ListingStatus;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
  condition?: Condition;
}

export interface User {
  name: string;
  phone: string;
  email: string;
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
