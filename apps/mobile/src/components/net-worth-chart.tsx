import Svg, { Path } from 'react-native-svg';

import { colors } from '@/constants/theme';
import type { NetWorthHistoryPoint } from '@/data/home-data';

const chartWidth = 340;
const chartHeight = 80;
const verticalPadding = 10;

type NetWorthChartProps = {
  history: readonly NetWorthHistoryPoint[];
};

function createTrendPath(history: readonly NetWorthHistoryPoint[]) {
  if (history.length === 0) {
    return `M0 ${chartHeight / 2} L${chartWidth} ${chartHeight / 2}`;
  }

  const amounts = history.map((point) => point.amount);
  const minimum = Math.min(...amounts);
  const maximum = Math.max(...amounts);
  const range = maximum - minimum;

  return history
    .map((point, index) => {
      const x = history.length === 1 ? chartWidth / 2 : (index / (history.length - 1)) * chartWidth;
      const normalizedAmount = range === 0 ? 0.5 : (point.amount - minimum) / range;
      const y = chartHeight - verticalPadding - normalizedAmount * (chartHeight - verticalPadding * 2);

      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');
}

export function NetWorthChart({ history }: NetWorthChartProps) {
  const trendPath = createTrendPath(history);

  return (
    <Svg
      accessibilityLabel="Net worth trend over six months"
      accessibilityRole="image"
      height="100%"
      preserveAspectRatio="none"
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      width="100%">
      <Path
        d={`${trendPath} L${chartWidth} ${chartHeight} L0 ${chartHeight} Z`}
        fill={colors.surfaceMuted}
      />
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
