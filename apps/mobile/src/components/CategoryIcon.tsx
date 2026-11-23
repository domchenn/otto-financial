import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { CarIcon, CartIcon, ForkKnifeIcon, PlaneIcon, TagIcon, type Icon } from './icons';
import { radius, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const ICONS: Record<string, Icon> = {
  FOOD_AND_DRINK: ForkKnifeIcon,
  GENERAL_MERCHANDISE: CartIcon,
  TRAVEL: PlaneIcon,
  TRANSPORTATION: CarIcon,
};

/** Fixed category tints from the handoff: the same category always gets the same color. */
const TONES: Record<string, ToneName> = {
  FOOD_AND_DRINK: 'butter',
  GENERAL_MERCHANDISE: 'blush',
  TRAVEL: 'sky',
  TRANSPORTATION: 'sky',
};

export function categoryIcon(category: string | null): Icon {
  return (category && ICONS[category]) || TagIcon;
}

/** The tint for a Plaid primary category; anything unmapped is "other" (lilac). */
export function categoryTone(category: string | null): ToneName {
  return (category && TONES[category]) || 'lilac';
}

/** A spending category's line icon on its tinted rounded tile. */
export function CategoryIcon({ category, size = 52 }: { category: string | null; size?: number }) {
  const { palette } = useTheme();
  const tone = palette.tones[categoryTone(category)];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius.icon, backgroundColor: tone.bg },
      ]}
    >
      {createElement(categoryIcon(category), { color: tone.text, size: size * 0.46 })}
    </View>
  );
}

const styles = StyleSheet.create({ tile: { alignItems: 'center', justifyContent: 'center' } });
