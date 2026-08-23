import type { District, School } from '@/types';

/** Danh mục quận/huyện TP.HCM kèm phường — dữ liệu danh mục tĩnh (không phải dữ liệu người dùng) */
export const DISTRICTS: District[] = [
  { id: 'q1', name: 'Quận 1', wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Nguyễn Thái Bình'] },
  { id: 'q3', name: 'Quận 3', wards: ['Phường 1', 'Phường 2', 'Phường Võ Thị Sáu'] },
  { id: 'q5', name: 'Quận 5', wards: ['Phường 1', 'Phường 4', 'Phường 14'] },
  { id: 'q7', name: 'Quận 7', wards: ['Phường Tân Phong', 'Phường Tân Thuận Đông', 'Phường Phú Mỹ'] },
  { id: 'q10', name: 'Quận 10', wards: ['Phường 11', 'Phường 12', 'Phường 15'] },
  { id: 'binhthanh', name: 'Bình Thạnh', wards: ['Phường 22', 'Phường 25', 'Phường 26'] },
  { id: 'tanbinh', name: 'Tân Bình', wards: ['Phường 1', 'Phường 2', 'Phường 13'] },
  { id: 'govap', name: 'Gò Vấp', wards: ['Phường 3', 'Phường 5', 'Phường 10'] },
  { id: 'thuduc', name: 'Thủ Đức', wards: ['Phường Linh Trung', 'Phường Hiệp Bình Chánh', 'Phường Trường Thọ'] },
  { id: 'phunhuan', name: 'Phú Nhuận', wards: ['Phường 4', 'Phường 10', 'Phường 17'] },
];

/** Danh mục trường đại học dùng cho lọc "gần trường" — dữ liệu danh mục tĩnh */
export const SCHOOLS: School[] = [
  { id: 'hcmut', name: 'Đại học Bách Khoa TP.HCM', shortName: 'ĐH Bách Khoa', latitude: 10.7721, longitude: 106.6576 },
  { id: 'ueh', name: 'Đại học Kinh tế TP.HCM', shortName: 'ĐH Kinh tế', latitude: 10.7734, longitude: 106.6981 },
  { id: 'hcmus', name: 'Đại học Khoa học Tự nhiên', shortName: 'ĐH KHTN', latitude: 10.7592, longitude: 106.6825 },
  { id: 'hcmussh', name: 'ĐH Khoa học Xã hội & Nhân văn', shortName: 'ĐH KHXH&NV', latitude: 10.7609, longitude: 106.6925 },
  { id: 'vanlang', name: 'Đại học Văn Lang (Cơ sở 3)', shortName: 'ĐH Văn Lang', latitude: 10.8059, longitude: 106.6817 },
  { id: 'hufi', name: 'Đại học Công nghiệp TP.HCM', shortName: 'ĐH Công nghiệp', latitude: 10.7511, longitude: 106.6666 },
  { id: 'rmit', name: 'RMIT University Việt Nam', shortName: 'RMIT', latitude: 10.7297, longitude: 106.6954 },
  { id: 'hcmute', name: 'ĐH Sư phạm Kỹ thuật TP.HCM', shortName: 'ĐH SPKT', latitude: 10.85, longitude: 106.771 },
];

/** Tâm bản đồ TP.HCM */
export const HCMC_CENTER = { latitude: 10.7769, longitude: 106.7009 };
