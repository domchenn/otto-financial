import Svg, { Path } from 'react-native-svg';

import { colors } from '@/constants/theme';

const trendPath =
  'M0 66 C36 66 50 60 79 59 C112 58 124 49 154 49 C186 49 198 38 230 37 C266 36 291 23 340 18';

export function NetWorthChart() {
  return (
    <Svg
      accessibilityLabel="Net worth trend over six months"
      accessibilityRole="image"
      height="100%"
      preserveAspectRatio="none"
      viewBox="0 0 340 80"
      width="100%">
      <Path d={`${trendPath} L340 80 L0 80 Z`} fill={colors.surfaceMuted} />
      <Path
        d={trendPath}
        fill="none"
        stroke={colors.textPrimary}
        strokeLinecap="round"
        strokeWidth={3}
      />
    </Svg>
  );
}
