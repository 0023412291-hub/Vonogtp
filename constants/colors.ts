/**
 * VoNo - Tìm Nhà Nhanh
 * Design system tokens (Warm Gold / Brown palette theo spec).
 */

export const COLORS = {
  // Primary
  white: '#FFFFFF',
  softWhite: '#F9F7F4',
  warmGold: '#D4AF37',
  bronze: '#8B6F47',
  darkBrown: '#4A3C2A',

  // Secondary
  lightGold: '#E8D4A8',
  darkGold: '#B8960F',
  errorRed: '#E63946',
  successGreen: '#2A9D8F',
  grayLight: '#E8E6E1',
  grayMedium: '#A8A59F',
  grayDark: '#6B6B6B',

  // Semantic
  background: '#FFFFFF',
  surface: '#F9F7F4',
  text: '#4A3C2A',
  textSecondary: '#A8A59F',
  border: '#E8E6E1',
  placeholder: '#A8A59F',

  // Status
  success: '#2A9D8F',
  warning: '#F5A623',
  error: '#E63946',
  info: '#0D7377',

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
