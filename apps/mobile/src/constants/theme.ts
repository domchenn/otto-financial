export const colors = {
  background: '#FFFFFF',
  textPrimary: '#0B1F33',
  textSecondary: '#66717F',
  surface: '#F5F7FB',
  surfaceMuted: '#EEF2F6',
  border: '#E5EAF1',
  accent: '#F5C84B',
  accentSoft: '#FFF6D6',
  success: '#1C7B57',
  danger: '#B85A2B',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  pageTitle: {
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  display: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -2,
  },
} as const;

export const radii = {
  medium: 14,
  control: 16,
  large: 18,
  extraLarge: 24,
  pill: 999,
} as const;
