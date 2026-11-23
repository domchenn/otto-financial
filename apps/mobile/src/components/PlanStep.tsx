import { StyleSheet, View } from 'react-native';

import { CardSwatch } from './badges';
import { CheckIcon } from './icons';
import { Text } from './Text';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * One step of a plan in an Ask answer (handoff §4.8): a numbered circle, or a sage check
 * once done, then a bold title, a muted detail and an optional card swatch.
 */
export function PlanStep({
  index,
  title,
  detail,
  done,
  card,
}: {
  index: number;
  title: string;
  detail: string;
  done: boolean;
  card?: { color: string; chip: string };
}) {
  const { palette } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Step ${index}${done ? ', done' : ''}: ${title}. ${detail}`}
      style={[styles.row, { borderTopColor: palette.hairline }]}
    >
      <View
        style={[
          styles.mark,
          done
            ? { backgroundColor: palette.accent, borderColor: palette.accent }
            : { borderColor: palette.hairline },
        ]}
      >
        {done ? (
          <CheckIcon color={palette.onAccent} size={16} />
        ) : (
          <Text variant="caption" weight="bold" muted>
            {index}
          </Text>
        )}
      </View>
      <View style={styles.copy}>
        <Text variant="row" weight="bold" style={styles.title}>
          {title}
        </Text>
        <Text variant="caption" muted weight="medium" style={styles.detail}>
          {detail}
        </Text>
      </View>
      {card ? <CardSwatch color={card.color} chip={card.chip} width={32} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingVertical: space.md,
    borderTopWidth: 1,
  },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 15, lineHeight: 20 },
  detail: { lineHeight: 18 },
});
