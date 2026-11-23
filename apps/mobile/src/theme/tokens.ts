/**
 * Porter design tokens. See docs/Porter-handoff/PORTER_HANDOFF.md §4 ("Design system").
 * Light is the default; every light token has exactly one dark partner. The handoff only
 * specifies light, so dark is derived: same roles, lifted for contrast on a dark ground.
 * Screens use these tokens only: never hard-code a color in a screen.
 */

/** A tint role: background, the dark shade used for text on it, and a solid accent. */
export type Tone = { bg: string; text: string; accent: string; track: string };

/**
 * Each tint always means the same thing (handoff §4): mint = groceries, budget, positive;
 * butter = dining, credits; sky = transport, travel, payments; blush = shopping;
 * lilac = other, investing, points; alert = overspend and expiring; sage = Porter's accent.
 */
export type ToneName = 'mint' | 'lilac' | 'butter' | 'sky' | 'blush' | 'alert' | 'sage';

export type Palette = {
  /** Screen background. */
  ground: string;
  /** Cards, inputs and the summary slot sit on this gray. */
  surface: string;
  /** One step darker than surface: tiles and inputs inside a card. */
  raised: string;
  hairline: string;
  ink: string;
  muted: string;
  faint: string;
  /** Primary action fill (ink buttons). actionText sits on it. */
  action: string;
  actionText: string;
  actionDisabled: string;
  actionDisabledText: string;
  /** Sage: the Ask button, positive states and the live dot. */
  accent: string;
  /** Text and icons on the accent. */
  onAccent: string;
  /** Sage used for text and links (lighter in dark mode so it stays readable). */
  link: string;
  moneyIn: string;
  /** Terracotta: overspend and expiring only. */
  alert: string;
  /** Apple sign-in button: black in light mode, white in dark (Apple's rules). */
  apple: string;
  appleText: string;
  /** Full-bleed hero behind Template A illustrations. */
  hero: string;
  heroDeep: string;
  /** Text on the hero, and its softer partner for labels and decoration. */
  onHero: string;
  onHeroMuted: string;
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
  ground: '#FFFFFF',
  surface: '#F5F5F3',
  raised: '#ECECEA',
  hairline: '#ECECEA',
  ink: '#17171A',
  muted: '#6B6B70',
  faint: '#A3A3A8',
  action: '#17171A',
  actionText: '#FFFFFF',
  actionDisabled: '#D4D4D2',
  actionDisabledText: '#FFFFFF',
  accent: '#2F6B4F',
  onAccent: '#FFFFFF',
  link: '#2F6B4F',
  moneyIn: '#2F6B4F',
  alert: '#A2502F',
  apple: '#17171A',
  appleText: '#FFFFFF',
  hero: '#2F6B4F',
  heroDeep: '#24553E',
  onHero: '#FFFFFF',
  onHeroMuted: '#CFE3D7',
  tones: {
    mint: { bg: '#E3F0E7', text: '#1F4D37', accent: '#2F6B4F', track: '#CBE0D2' },
    butter: { bg: '#FAF1D6', text: '#6B4A0B', accent: '#B8861A', track: '#EDDDB3' },
    sky: { bg: '#E6ECF8', text: '#1F3A5F', accent: '#3D5F92', track: '#CDD8EE' },
    blush: { bg: '#F6E6DF', text: '#7A3A22', accent: '#A2502F', track: '#EBCFC3' },
    lilac: { bg: '#EEEAF7', text: '#3F3470', accent: '#6A5BA8', track: '#DCD5EE' },
    alert: { bg: '#F6E6DF', text: '#8A4127', accent: '#A2502F', track: '#EBCFC3' },
    sage: { bg: '#E3F0E7', text: '#1F4D37', accent: '#2F6B4F', track: '#CBE0D2' },
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
  shadow: '#17171A',
};

export const dark: Palette = {
  ground: '#121214',
  surface: '#1D1D20',
  raised: '#28282C',
  hairline: '#2E2E33',
  ink: '#F2F2EF',
  muted: '#9D9DA3',
  faint: '#6B6B70',
  action: '#F2F2EF',
  actionText: '#17171A',
  actionDisabled: '#3A3A3F',
  actionDisabledText: '#8A8A90',
  accent: '#38805E',
  onAccent: '#FFFFFF',
  link: '#7FC4A0',
  moneyIn: '#7FC4A0',
  alert: '#E8936D',
  apple: '#F2F2EF',
  appleText: '#17171A',
  hero: '#24553E',
  heroDeep: '#1A3F2E',
  onHero: '#FFFFFF',
  onHeroMuted: '#A9CBB8',
  tones: {
    mint: { bg: '#18302A', text: '#8FD0AE', accent: '#7FC4A0', track: '#224237' },
    butter: { bg: '#382F16', text: '#F0CC6E', accent: '#E0B048', track: '#4C401E' },
    sky: { bg: '#1B2A42', text: '#A6C0EC', accent: '#7FA0D8', track: '#273A58' },
    blush: { bg: '#3A231B', text: '#F0AC8E', accent: '#E8936D', track: '#4F3024' },
    lilac: { bg: '#29253F', text: '#C6BCF0', accent: '#9F90DE', track: '#383257' },
    alert: { bg: '#3A231B', text: '#F0AC8E', accent: '#E8936D', track: '#4F3024' },
    sage: { bg: '#18302A', text: '#8FD0AE', accent: '#7FC4A0', track: '#224237' },
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

/** Type scale from the handoff: size / weight, tight tracking on large sizes. */
export const type = {
  hero: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 48, letterSpacing: -1.8 },
  display: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 40, letterSpacing: -1.4 },
  /** Screen titles. */
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 33, letterSpacing: -0.9 },
  heading: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  /** Porter's answer sentence in Ask. */
  answer: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 27, letterSpacing: -0.4 },
  row: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21, letterSpacing: -0.1 },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, letterSpacing: 0 },
  /** Section labels shown in caps ("TODAY"). Write the string in sentence case. */
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  small: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
} as const;

export type TypeVariant = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = {
  icon: 12,
  button: 14,
  input: 16,
  tile: 18,
  card: 22,
  sheet: 30,
  pill: 999,
} as const;

/** Screen padding: 20 sides, 60 top, 40 bottom (top/bottom include the safe area). */
export const screen = { side: 20, top: 60, bottom: 40 } as const;

export const size = { touch: 44, button: 54, smallButton: 40, iconButton: 44 } as const;
