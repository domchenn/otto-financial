import { useUser } from '@clerk/expo';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActionRow } from '@/components/ActionRow';
import { BENEFIT_CARD_WIDTH, BenefitCard } from '@/components/BenefitCard';
import { PlusIcon, SwapIcon, TicketIcon, type Icon } from '@/components/icons';
import { TabScreen } from '@/components/layouts';
import { LiveLabel, Wordmark } from '@/components/porter';
import { StatRow, type Stat } from '@/components/StatRow';
import { SummarySlot } from '@/components/SummarySlot';
import { Text } from '@/components/Text';
import { useAccounts, useBenefits, useBudget, useSummary } from '@/lib/api';
import { templateBrief, type DailyBrief } from '@/lib/brief';
import type { Budget } from '@/lib/budget';
import { allCredits, periodShareLeft, type Benefits } from '@/lib/credits';
import { cardArt, daysBetween, formatShortDate, parseDate, type Payment } from '@/lib/finance';
import { formatCents } from '@/lib/money';
import { deriveProposals, visibleProposals, type ProposalKind } from '@/lib/proposals';
import { useRefresh } from '@/lib/useRefresh';
import { screen, size, space, type ToneName } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const dateLabel = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const shortMonth = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
const shortWeekday = (iso: string) =>
  parseDate(iso).toLocaleDateString('en-US', { weekday: 'short' });

const PROPOSAL_LOOK: Record<ProposalKind, { icon: Icon; tone: ToneName }> = {
  sweep_cash: { icon: SwapIcon, tone: 'mint' },
  use_credit: { icon: TicketIcon, tone: 'butter' },
  default_card: { icon: TicketIcon, tone: 'butter' },
  cancel_sub: { icon: TicketIcon, tone: 'blush' },
  enroll_benefit: { icon: TicketIcon, tone: 'lilac' },
};

/** Credits on the "Use before they expire" row, and the gap between them. */
const EXPIRING_CARDS = 6;
const CARD_GAP = 10;

const LOAD_ERROR = "Porter couldn't reach your data. Pull down to try again.";

/** Home (handoff §3): the brief, three numbers, what Porter is on, and credits to use. */
export default function Home() {
  const { palette } = useTheme();
  const { user } = useUser();
  const refresh = useRefresh();
  const summary = useSummary();
  const budgetQuery = useBudget();
  const benefitsQuery = useBenefits();
  const accounts = useAccounts().data ?? [];
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(new Set());

  // Never show stale or made-up numbers next to an error: no data means "—".
  const s = summary.isError ? undefined : summary.data;
  const budget = budgetQuery.isError ? undefined : budgetQuery.data;
  const benefits = benefitsQuery.data;
  const failed = summary.isError || budgetQuery.isError;
  const loading = !failed && (summary.isPending || budgetQuery.isPending);
  const connected = summary.data?.has_connections ?? true;
  const payments = s?.upcoming_payments ?? [];

  const brief: DailyBrief | undefined = failed
    ? { summary: LOAD_ERROR }
    : loading
      ? undefined
      : templateBrief({ budget, expiring: benefits?.needs_attention, payments });

  const proposals = visibleProposals(
    deriveProposals({ accounts, budget, payments, expiring: benefits?.needs_attention }),
    dismissed,
  );

  return (
    <TabScreen refreshControl={refresh}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Wordmark size={20} />
          <Text variant="caption" muted weight="medium">
            {dateLabel.format(new Date())}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={[styles.avatar, { backgroundColor: palette.surface }]}
        >
          <Text variant="row" weight="bold" style={{ fontSize: 15 }}>
            {(user?.firstName ?? '·').charAt(0).toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <SummarySlot
          brief={brief}
          loading={loading}
          updatedAt={!failed && summary.dataUpdatedAt ? new Date(summary.dataUpdatedAt) : undefined}
          onReadAll={
            brief?.detail
              ? () => Alert.alert('Today', `${brief.summary}\n\n${brief.detail}`)
              : undefined
          }
        />
      </View>

      <View style={styles.section}>
        <StatRow
          stats={[
            {
              label: 'Net worth',
              value: s ? formatCents(s.net_worth.net_cents) : '—',
              sub: accounts.length ? accountsLabel(accounts.length) : undefined,
              onPress: () => router.push('/accounts'),
            },
            { ...spentStat(budget), onPress: () => router.push('/spending') },
            dueStat(s ? payments[0] : undefined, Boolean(s)),
          ]}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <LiveLabel>Porter&apos;s on it</LiveLabel>
          {proposals.length ? (
            <Text variant="small" muted>
              {proposals.length} to review
            </Text>
          ) : null}
        </View>
        {!connected ? (
          <ActionRow
            icon={PlusIcon}
            tone="sage"
            title="Connect your cards"
            reason="Porter fills this in with your real balances, purchases and credits."
            primary={{ title: 'Connect cards', onPress: () => router.push('/onboarding/connect') }}
          />
        ) : proposals.length ? (
          proposals.map((p) => {
            const look = PROPOSAL_LOOK[p.kind];
            return (
              <ActionRow
                key={p.id}
                icon={look.icon}
                tone={look.tone}
                title={p.title}
                reason={p.impact ? `${p.reason} · ${p.impact}` : p.reason}
                primary={{ title: p.primary, onPress: () => router.push(p.href as Href) }}
                secondary={
                  p.secondary
                    ? {
                        title: p.secondary,
                        onPress: () => setDismissed((d) => new Set(d).add(p.id)),
                      }
                    : undefined
                }
              />
            );
          })
        ) : (
          <View style={[styles.quiet, { borderTopColor: palette.hairline }]}>
            <Text variant="body" muted>
              Nothing needs you right now.
            </Text>
          </View>
        )}
      </View>

      <ExpiringCredits benefits={benefits} />
    </TabScreen>
  );
}

function accountsLabel(n: number): string {
  return n === 1 ? '1 account' : `${n} accounts`;
}

/** "Spent · Nov": this month against the plan. */
function spentStat(budget: Budget | undefined): Stat {
  const label = `Spent · ${shortMonth(new Date())}`;
  if (!budget) return { label, value: '—' };
  const { spent_cents, limit_cents, remaining_cents } = budget.month;
  const value = formatCents(spent_cents);
  if (limit_cents === null || remaining_cents === null) {
    return { label, value, sub: 'No plan set' };
  }
  if (remaining_cents < 0) {
    return { label, value, sub: `${formatCents(-remaining_cents)} over plan`, subTone: 'warn' };
  }
  return { label, value, sub: `${formatCents(remaining_cents)} left` };
}

/** "Due Sun": the next card payment and whether checking covers it. */
function dueStat(next: Payment | undefined, loaded: boolean): Stat {
  if (!next) return { label: 'Next due', value: '—', sub: loaded ? 'Nothing due' : undefined };
  const days = daysBetween(new Date(), parseDate(next.due_date));
  const label =
    days === 0
      ? 'Due today'
      : days > 0 && days <= 6
        ? `Due ${shortWeekday(next.due_date)}`
        : `Due ${formatShortDate(next.due_date)}`;
  const covered: Pick<Stat, 'sub' | 'subTone'> =
    next.covered === true
      ? { sub: 'Covered ✓', subTone: 'accent' }
      : next.covered === false
        ? { sub: 'Not covered', subTone: 'warn' }
        : { sub: next.name };
  return {
    label,
    value: formatCents(next.amount_cents),
    ...covered,
    onPress: () => router.push(`/card/${next.account_id}`),
  };
}

/** "Use before they expire": credits with money left, soonest first, with the next peeking. */
function ExpiringCredits({ benefits }: { benefits: Benefits | undefined }) {
  const { palette } = useTheme();
  if (!benefits) return null;
  const credits = allCredits(benefits)
    .filter((c) => c.remaining_cents > 0)
    .sort((a, b) => a.days_left - b.days_left)
    .slice(0, EXPIRING_CARDS);
  if (credits.length === 0) return null;
  // Everything left across all credits (as on Benefits), not just the cards shown here.
  const total = benefits.remaining_cents;
  const names = new Map(benefits.cards.map((c) => [c.account_id, c.account_name]));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="row" weight="bold" style={{ fontSize: 16 }}>
          Use before they expire
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${formatCents(total)} total, see all benefits`}
          onPress={() => router.push('/benefits')}
          hitSlop={12}
        >
          <Text variant="caption" color={palette.link}>
            {formatCents(total)} total
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={BENEFIT_CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        style={styles.bleed}
        contentContainerStyle={styles.cards}
      >
        {credits.map((c) => (
          <BenefitCard
            key={c.period_id}
            art={cardArt({ name: c.card_name, official_name: names.get(c.account_id) ?? null })}
            cardName={c.card_name}
            amountCents={c.remaining_cents}
            name={c.name}
            daysLeft={c.days_left}
            share={periodShareLeft(c)}
            action={{
              title: 'How to use it',
              onPress: () => router.push(`/credits/${c.period_id}`),
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: size.touch,
  },
  brand: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  avatar: {
    width: size.touch,
    height: size.touch,
    borderRadius: size.touch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: space.lg + 2 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: space.sm,
  },
  quiet: { borderTopWidth: 1, paddingVertical: space.md },
  bleed: { marginHorizontal: -screen.side },
  cards: { paddingHorizontal: screen.side, gap: CARD_GAP },
});
