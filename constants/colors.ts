/**
 * VoNo - Tìm Nhà Nhanh
 * Design system tokens (Teal Xanh biếc - fresh & modern).
 */

export const COLORS = {
  // Primary
  white: '#FFFFFF',
  softWhite: '#F4F7F7',
  warmGold: '#0E8F8E',
  bronze: '#0A7A76',
  darkBrown: '#16343D',

  // Secondary
  lightGold: '#A8D8D5',
  darkGold: '#0B6E6C',
  errorRed: '#E63946',
  successGreen: '#2A9D8F',
  grayLight: '#E4ECEC',
  grayMedium: '#94A6A8',
  grayDark: '#5C6B70',

  // Semantic
  background: '#FFFFFF',
  surface: '#F4F7F7',
  text: '#16343D',
  textSecondary: '#94A6A8',
  border: '#E4ECEC',
  placeholder: '#94A6A8',

  // Status
  success: '#2A9D8F',
  warning: '#F5A623',
  error: '#E63946',
  info: '#0D7377',

  // Giá & đánh giá: cam ấm giữ cảm giác "tiền", tránh vàng chóe
  priceAccent: '#E0912F',

  // Overlays
  overlay: 'rgba(23, 32, 51, 0.45)',
  overlayLight: 'rgba(0, 0, 0, 0.22)',
  whiteOverlay: 'rgba(255, 255, 255, 0.92)',
};

export const SHADOWS = {
  light: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold' as const, lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};
