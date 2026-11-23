import { router } from 'expo-router';

import { Monogram } from '@/components/badges';
import { StepScreen } from '@/components/layouts';
import { ListRow } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { Text } from '@/components/Text';
import { usePoints } from '@/lib/api';
import { formatNumber } from '@/lib/money';
import { cardNames, confirmedLabel, type PointsProgram } from '@/lib/points';
import { useRefresh } from '@/lib/useRefresh';
import { space } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Every points program: the total, then each one with its estimate (PRD F3). */
export default function PointsScreen() {
  const points = usePoints();
  const refresh = useRefresh();
  const data = points.data;
  const confirmed = (data?.confirmed_count ?? 0) > 0;

  return (
    <StepScreen refreshControl={refresh}>
      <Text variant="display" style={{ marginTop: space.lg }}>
        Points
      </Text>
      {points.isError ? (
        <Text variant="body" muted style={{ fontSize: 17, marginTop: space.xs }}>
          Porter couldn&apos;t load your points. Pull down to try again.
        </Text>
      ) : (
        <>
          <Text variant="hero" tabular style={{ marginTop: space.md }}>
            {confirmed ? formatNumber(data?.total_points ?? 0) : '—'}
          </Text>
          <Text variant="body" muted style={{ fontSize: 17, marginTop: space.xs }}>
            {confirmed
              ? 'Total across your programs. An estimate: Porter adds what you earn after each balance you enter.'
              : 'Banks don’t share points balances yet. Add each one from your bank’s app, and Porter keeps it up to date from your purchases.'}
          </Text>
        </>
      )}

      {data && data.programs.length === 0 ? (
        <Text variant="body" muted style={{ marginTop: space.xl }}>
          None of your linked cards earn points Porter knows about yet.
        </Text>
      ) : null}

      {data && data.programs.length > 0 ? (
        <Card style={{ marginTop: space.xl, paddingVertical: space.xs }}>
          <Stack>
            {data.programs.map((p) => (
              <ProgramRow key={p.id} program={p} />
            ))}
          </Stack>
        </Card>
      ) : null}
    </StepScreen>
  );
}

function ProgramRow({ program: p }: { program: PointsProgram }) {
  const { palette } = useTheme();
  const confirmed = p.confirmed_at !== null && p.estimated_points !== null;
  return (
    <ListRow
      leading={<Monogram label={p.short_name} size={44} />}
      title={p.name}
      subtitle={
        confirmed
          ? `${confirmedLabel(p.confirmed_at!)}${p.earned_since !== 0 ? ` · ${p.earned_since > 0 ? '+' : ''}${formatNumber(p.earned_since)} since` : ''}`
          : cardNames(p)
      }
      value={confirmed ? formatNumber(p.estimated_points!) : 'Add balance'}
      valueColor={confirmed ? undefined : palette.action}
      chevron
      onPress={() => router.push(`/points/${p.id}`)}
    />
  );
}
