/**
 * Otto design tokens. See docs/prd.html §05 ("Otto design language").
 * Light is the default; every light token has exactly one dark partner.
 * Screens use these tokens only: never hard-code a color in a screen.
 */

/** A pastel role: background, the dark shade used for text on it, and a solid accent. */
export type Tone = { bg: string; text: string; accent: string; track: string };

export type ToneName = 'mint' | 'lilac' | 'butter' | 'sky' | 'alert' | 'indigo';

export type Palette = {
  ground: string;
  surface: string;
  raised: string;
  hairline: string;
  ink: string;
  muted: string;
  faint: string;
  /** Primary action fill (buttons). White text sits on it. */
  action: string;
  actionText: string;
  actionDisabled: string;
  actionDisabledText: string;
  /** Indigo used for text, links and icons (lighter in dark mode so it stays readable). */
  link: string;
  moneyIn: string;
  alert: string;
  /** Apple sign-in button: black in light mode, white in dark (Apple's rules). */
  apple: string;
  appleText: string;
  /** Full-bleed hero behind Template A illustrations. */
  hero: string;
  heroDeep: string;
  tones: Record<ToneName, Tone>;
  illustration: {
    coin: string;
    coinShade: string;
    coinInk: string;
    card: string;
    cardChip: string;
    pink: string;
    mint: string;
    sparkle: string;
  };
  shadow: string;
};

export const light: Palette = {
  ground: '#F6F5F2',
  surface: '#FFFFFF',
  raised: '#F1F0EC',
  hairline: '#E4E2DC',
  ink: '#17181C',
  muted: '#6B6D75',
  faint: '#A3A4AB',
  action: '#3D4FD6',
  actionText: '#FFFFFF',
  actionDisabled: '#C9CEF7',
  actionDisabledText: '#FFFFFF',
  link: '#3D4FD6',
  moneyIn: '#2F8A57',
  alert: '#C2410C',
  apple: '#17181C',
  appleText: '#FFFFFF',
  hero: '#3D4FD6',
  heroDeep: '#2A3699',
  tones: {
    mint: { bg: '#E3F2E9', text: '#1F5136', accent: '#2F8A57', track: '#CDE3D6' },
    lilac: { bg: '#ECE8FB', text: '#3B2F7A', accent: '#6E56CF', track: '#D9D2F3' },
    butter: { bg: '#FBF1D6', text: '#6B4A0B', accent: '#D29B1F', track: '#EDDDB3' },
    sky: { bg: '#E3ECFA', text: '#1E3A66', accent: '#3565B5', track: '#CCDAF0' },
    alert: { bg: '#FDE8DC', text: '#9A3412', accent: '#C2410C', track: '#F6CDB6' },
    indigo: { bg: '#E4E7FB', text: '#2A3699', accent: '#3D4FD6', track: '#CDD3F5' },
  },
  illustration: {
    coin: '#F5C04F',
    coinShade: '#E0A73A',
    coinInk: '#7A5410',
    card: '#8FD9AE',
    cardChip: '#F5D27A',
    pink: '#F4A3C0',
    mint: '#8FD9AE',
    sparkle: '#FFFFFF',
  },
  shadow: '#17181C',
};

export const dark: Palette = {
  ground: '#121318',
  surface: '#1C1D23',
  raised: '#2A2B33',
  hairline: '#34353E',
  ink: '#F2F1EE',
  muted: '#9C9DA6',
  faint: '#6B6D75',
  action: '#5161E8',
  actionText: '#FFFFFF',
  actionDisabled: '#2E3466',
  actionDisabledText: '#8890C4',
  link: '#9CA8FF',
  moneyIn: '#4FC384',
  alert: '#FF9F73',
  apple: '#F2F1EE',
  appleText: '#17181C',
  hero: '#252E78',
  heroDeep: '#1B2259',
  tones: {
    mint: { bg: '#16302A', text: '#7FDCA5', accent: '#4FC384', track: '#1F4238' },
    lilac: { bg: '#2A2550', text: '#C3B8FF', accent: '#8B78F0', track: '#3A346A' },
    butter: { bg: '#3A2F14', text: '#F5C451', accent: '#E5B03F', track: '#4E3F1C' },
    sky: { bg: '#1B2B45', text: '#9CC2FA', accent: '#6E9DE8', track: '#263A5C' },
    alert: { bg: '#3D2016', text: '#FF9F73', accent: '#FF9F73', track: '#55301F' },
    indigo: { bg: '#252A4D', text: '#9CA8FF', accent: '#7F8CFF', track: '#323866' },
  },
  illustration: {
    coin: '#F5C04F',
    coinShade: '#E0A73A',
    coinInk: '#7A5410',
    card: '#4CC384',
    cardChip: '#F5D27A',
    pink: '#F4A3C0',
    mint: '#4FC384',
    sparkle: '#FFFFFF',
  },
  shadow: '#000000',
};

export const fonts = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Type scale from the design board: size / weight, tight tracking on large sizes. */
export const type = {
  hero: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 48, letterSpacing: -1.8 },
  display: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 40, letterSpacing: -1.4 },
  title: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 35, letterSpacing: -1.1 },
  heading: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  row: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, letterSpacing: -0.1 },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, letterSpacing: 0 },
} as const;

export type TypeVariant = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { icon: 12, input: 16, card: 20, sheet: 32, pill: 999 } as const;

/** Screen padding: 24 sides, 60 top, 40 bottom (top/bottom include the safe area). */
export const screen = { side: 24, top: 60, bottom: 40 } as const;

export const size = { touch: 44, button: 54, smallButton: 40, iconButton: 44 } as const;
