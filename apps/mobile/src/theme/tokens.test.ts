import { describe, expect, it } from '@jest/globals';

import { dark, light, type Palette, type ToneName } from './tokens';

/** WCAG 2 relative luminance of a #RRGGBB color. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Text/background pairs the screens actually use. */
function textPairs(p: Palette): [string, string, string][] {
  const pairs: [string, string, string][] = [
    ['ink on ground', p.ink, p.ground],
    ['ink on surface', p.ink, p.surface],
    ['muted on ground', p.muted, p.ground],
    ['muted on surface', p.muted, p.surface],
    ['link on ground', p.link, p.ground],
    ['link on surface', p.link, p.surface],
    ['moneyIn on ground', p.moneyIn, p.ground],
    ['alert on ground', p.alert, p.ground],
    ['actionText on action', p.actionText, p.action],
    ['onAccent on accent', p.onAccent, p.accent],
    ['onHero on hero', p.onHero, p.hero],
  ];
  for (const name of Object.keys(p.tones) as ToneName[]) {
    pairs.push([`${name} text on its tint`, p.tones[name].text, p.tones[name].bg]);
  }
  return pairs;
}

describe.each<[string, Palette]>([
  ['light', light],
  ['dark', dark],
])('%s palette', (_, palette) => {
  it.each(textPairs(palette))('%s meets 4.5:1', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the same keys in light and dark', () => {
    expect(Object.keys(palette).sort()).toEqual(Object.keys(light).sort());
    expect(Object.keys(palette.tones).sort()).toEqual(Object.keys(light.tones).sort());
  });
});

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});
