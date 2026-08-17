/** Format giá VND → "3.5 triệu", "1.2 tỷ" */
export function formatPrice(price: number): string {
  if (price >= 1_000_000_000) {
    const v = price / 1_000_000_000;
    return `${trimZero(v.toFixed(1))} tỷ`;
  }
  if (price >= 1_000_000) {
    const v = price / 1_000_000;
    return `${trimZero(v.toFixed(1))} triệu`;
  }
  return `${price.toLocaleString('vi-VN')} đ`;
}

export function formatPriceShort(price: number): string {
  if (price >= 1_000_000_000) return `${trimZero((price / 1_000_000_000).toFixed(1))} tỷ`;
  if (price >= 1_000_000) return `${trimZero((price / 1_000_000).toFixed(1))} triệu`;
  return `${price.toLocaleString('vi-VN')}`;
}

function trimZero(v: string): string {
  return v.replace(/\.0$/, '');
}

/** 3500000 → "3.500.000" */
export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

/** ISO date → "3 ngày trước" */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}

/** Khoảng cách km giữa 2 toạ độ (Haversine) */
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** 96 → "1:36" */
export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** 12400 → "12.4K", 1500000 → "1.5M" */
export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${trimZero((views / 1_000_000).toFixed(1))}M`;
  if (views >= 1_000) return `${trimZero((views / 1_000).toFixed(1))}K`;
  return String(views);
}

export const PRICE_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Tất cả mức giá', min: null, max: null },
  { label: 'Dưới 3 triệu', min: null, max: 3_000_000 },
  { label: '3 - 5 triệu', min: 3_000_000, max: 5_000_000 },
  { label: '5 - 8 triệu', min: 5_000_000, max: 8_000_000 },
  { label: '8 - 15 triệu', min: 8_000_000, max: 15_000_000 },
  { label: 'Trên 15 triệu', min: 15_000_000, max: null },
];
