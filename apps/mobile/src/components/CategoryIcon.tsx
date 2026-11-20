import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { CarIcon, CartIcon, ForkKnifeIcon, PlaneIcon, TagIcon, type Icon } from './icons';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const ICONS: Record<string, Icon> = {
  FOOD_AND_DRINK: ForkKnifeIcon,
  GENERAL_MERCHANDISE: CartIcon,
  TRAVEL: PlaneIcon,
  TRANSPORTATION: CarIcon,
};

export function categoryIcon(category: string | null): Icon {
  return (category && ICONS[category]) || TagIcon;
}

/** A spending category's line icon on the light gray rounded tile used for monograms. */
export function CategoryIcon({ category, size = 52 }: { category: string | null; size?: number }) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: radius.input, backgroundColor: palette.raised },
      ]}
    >
      {createElement(categoryIcon(category), { color: palette.ink, size: size * 0.46 })}
    </View>
  );
}

const styles = StyleSheet.create({ tile: { alignItems: 'center', justifyContent: 'center' } });
