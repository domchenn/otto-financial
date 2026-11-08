import { View } from 'react-native';

/** A rounded progress track. `value` is 0–1. */
export function ProgressBar({
  value,
  color,
  track,
  height = 8,
}: {
  value: number;
  color: string;
  track: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}
    >
      <View
        style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }}
      />
    </View>
  );
}
