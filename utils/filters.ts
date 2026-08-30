import { SCHOOLS } from '@/data/constants';
import type { Filters, Listing } from '@/types';
import { distanceKm } from '@/utils/formatters';

/** Lọc danh sách tin theo bộ lọc nâng cao (client-side, dữ liệu mock) */
export function filterListings(listings: Listing[], filters: Filters): Listing[] {
  const q = filters.query.trim().toLowerCase();
  const school = filters.schoolId ? SCHOOLS.find((s) => s.id === filters.schoolId) : undefined;

  return listings.filter((l) => {
    if (q) {
      const haystack = `${l.title} ${l.address} ${l.district} ${l.ward} ${l.contact.name}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.priceMin != null && l.price < filters.priceMin) return false;
    if (filters.priceMax != null && l.price > filters.priceMax) return false;
    if (filters.districts.length > 0 && !filters.districts.includes(l.district)) return false;
    if (filters.types.length > 0 && !filters.types.includes(l.type)) return false;
    if (filters.deal && (l.deal ?? 'rent') !== filters.deal) return false;
    if (filters.directions.length > 0 && !(l.direction && filters.directions.includes(l.direction)))
      return false;
    if (filters.legals.length > 0 && !(l.legal && filters.legals.includes(l.legal))) return false;
    if (filters.bedrooms != null && l.bedrooms < filters.bedrooms) return false;
    if (filters.bathrooms != null && l.bathrooms < filters.bathrooms) return false;
    if (filters.condition && l.condition !== filters.condition) return false;
    if (school && filters.maxDistanceKm != null) {
      if (distanceKm(l, school) > filters.maxDistanceKm) return false;
    }
    return true;
  });
}

export function activeFiltersCount(f: Filters): number {
  let n = 0;
  if (f.priceMin != null || f.priceMax != null) n += 1;
  if (f.districts.length > 0) n += 1;
  if (f.types.length > 0) n += 1;
  if (f.bedrooms != null) n += 1;
  if (f.bathrooms != null) n += 1;
  if (f.condition) n += 1;
  if (f.schoolId != null) n += 1;
  if (f.deal) n += 1;
  if (f.directions.length > 0) n += 1;
  if (f.legals.length > 0) n += 1;
  return n;
}
