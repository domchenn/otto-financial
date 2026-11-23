import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { CardSwatch } from './badges';
import { Text } from './Text';
import { EXPIRING_SOON_DAYS } from '@/lib/credits';
import type { CardArt } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Width of one card in the horizontal scroll; the next card peeks past the screen edge. */
export const BENEFIT_CARD_WIDTH = 228;

/** Days left as a ring that empties over the period: terracotta inside two weeks, else sage. */
export function CountdownRing({
  daysLeft,
  share,
  size = 40,
}: {
  daysLeft: number;
  /** Share of the period left, 0..1. */
  share: number;
  size?: number;
}) {
  const { palette } = useTheme();
  const color = daysLeft <= EXPIRING_SOON_DAYS ? palette.alert : palette.link;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={palette.hairline}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - Math.max(0.04, share))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.ringLabel]}>
        <Text variant="small" weight="bold" color={color} style={styles.ringText}>
          {daysLeft}d
        </Text>
      </View>
    </View>
  );
}

function expiresText(daysLeft: number): string {
  if (daysLeft <= 0) return 'Expires today';
  if (daysLeft === 1) return 'Expires tomorrow';
  return `Expires in ${daysLeft} days`;
}

/** One credit to use before it expires (handoff §4.4), for Home's horizontal scroll. */
export function BenefitCard({
  art,
  cardName,
  amountCents,
  name,
  daysLeft,
  share,
  action,
}: {
  art: CardArt;
  cardName: string;
  amountCents: number;
  name: string;
  daysLeft: number;
  share: number;
  action: { title: string; onPress: () => void };
}) {
  const { palette } = useTheme();
  const soon = daysLeft <= EXPIRING_SOON_DAYS;
  const amount = formatCents(amountCents, { cents: 'auto' });
  return (
    <View style={[styles.card, { backgroundColor: palette.ground, borderColor: palette.hairline }]}>
      <View
        accessible
        accessibilityLabel={`${name}, ${amount} on ${cardName}. ${expiresText(daysLeft)}.`}
        style={styles.info}
      >
        <View style={styles.top}>
          <View style={styles.swatch}>
            <CardSwatch color={art.color} chip={art.chip} width={34} />
            <Text variant="small" muted numberOfLines={1}>
              {cardName}
            </Text>
          </View>
          <CountdownRing daysLeft={daysLeft} share={share} />
        </View>
        <View style={styles.copy}>
          <Text variant="heading" tabular style={styles.amount}>
            {amount}
          </Text>
          <Text variant="row" weight="semibold" numberOfLines={1} style={styles.name}>
            {name}
          </Text>
          <Text
            variant="small"
            weight="semibold"
            color={soon ? palette.alert : palette.muted}
            style={styles.expires}
          >
            {expiresText(daysLeft)}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${action.title}: ${name}`}
        onPress={action.onPress}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: palette.surface, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text variant="caption" weight="semibold">
          {action.title}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: BENEFIT_CARD_WIDTH,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: space.md,
  },
  info: { gap: space.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  swatch: { gap: 6, flexShrink: 1 },
  copy: { gap: 1 },
  amount: { fontSize: 22, lineHeight: 27, letterSpacing: -0.6 },
  name: { fontSize: 14, lineHeight: 19 },
  expires: { fontSize: 12 },
  ringLabel: { alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 10, lineHeight: 12 },
  cta: {
    minHeight: 44,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
