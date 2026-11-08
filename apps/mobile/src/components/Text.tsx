import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { fonts, type as typeScale, type TypeVariant } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Props = RNTextProps & {
  variant?: TypeVariant;
  /** Overrides the default ink color. */
  color?: string;
  muted?: boolean;
  /** Tabular numbers so amounts line up in columns. */
  tabular?: boolean;
  center?: boolean;
  weight?: keyof typeof fonts;
};

/** The only text primitive. Sentence case everywhere, no all-caps labels. */
export function Text({
  variant = 'body',
  color,
  muted,
  tabular,
  center,
  weight,
  style,
  ...rest
}: Props) {
  const { palette } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typeScale[variant],
        { color: color ?? (muted ? palette.muted : palette.ink) },
        weight ? { fontFamily: fonts[weight] } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    />
  );
}
