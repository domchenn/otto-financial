import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { GroupLabel, ToggleRow } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { useBenefits } from '@/lib/api';
import { space } from '@/theme/tokens';

export default function CreditReminders() {
  const [when, setWhen] = useState({ week: false, three: true, morning: true });
  // Push reminders arrive with APNs (TODO.md); until then these choices stay on this screen.
  const [off, setOff] = useState<Record<string, boolean>>({});
  const cards = (useBenefits().data?.cards ?? []).filter((c) => c.credits.length > 0);

  return (
    <StepScreen
      heading="Credit reminders"
      subheading="Choose when Otto nudges you before a credit resets."
      footer={
        <Footer>
          <Button title="Done" onPress={() => router.back()} />
        </Footer>
      }
    >
      <GroupLabel>When to remind me</GroupLabel>
      <Card style={{ paddingVertical: space.xs }}>
        <Stack>
          <ToggleRow
            title="A week before"
            subtitle="Good for bigger credits like Resy or a hotel credit"
            value={when.week}
            onValueChange={(v) => setWhen((s) => ({ ...s, week: v }))}
          />
          <ToggleRow
            title="3 days before"
            subtitle="Recommended"
            value={when.three}
            onValueChange={(v) => setWhen((s) => ({ ...s, three: v }))}
          />
          <ToggleRow
            title="The morning it resets"
            subtitle="A last-chance nudge"
            value={when.morning}
            onValueChange={(v) => setWhen((s) => ({ ...s, morning: v }))}
          />
        </Stack>
      </Card>

      {cards.length > 0 ? <GroupLabel>Cards</GroupLabel> : null}
      {cards.length > 0 ? (
        <Card style={{ paddingVertical: space.xs }}>
          <Stack>
            {cards.map((c) => (
              <ToggleRow
                key={c.account_id}
                title={c.card_name ?? c.account_name}
                subtitle={`${c.credits.length} ${c.credits.length === 1 ? 'credit' : 'credits'}`}
                value={!off[c.account_id]}
                onValueChange={(v) => setOff((s) => ({ ...s, [c.account_id]: !v }))}
              />
            ))}
          </Stack>
        </Card>
      ) : null}
    </StepScreen>
  );
}
