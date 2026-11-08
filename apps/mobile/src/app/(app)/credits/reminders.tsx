import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { GroupLabel, ToggleRow } from '@/components/rows';
import { Card, Stack } from '@/components/Surface';
import { credits } from '@/lib/sample';
import { space } from '@/theme/tokens';

export default function CreditReminders() {
  const [when, setWhen] = useState({ week: false, three: true, morning: true });
  const [byCard, setByCard] = useState({ gold: true, platinum: true });
  const count = (card: string) => credits.filter((c) => c.card === card).length;

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
            subtitle="Good for bigger credits like Resy or Saks"
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

      <GroupLabel>Cards</GroupLabel>
      <Card style={{ paddingVertical: space.xs }}>
        <Stack>
          <ToggleRow
            title="Gold Card"
            subtitle={`${count('gold')} credits`}
            value={byCard.gold}
            onValueChange={(v) => setByCard((s) => ({ ...s, gold: v }))}
          />
          <ToggleRow
            title="Platinum Card"
            subtitle={`${count('platinum')} credits`}
            value={byCard.platinum}
            onValueChange={(v) => setByCard((s) => ({ ...s, platinum: v }))}
          />
        </Stack>
      </Card>
    </StepScreen>
  );
}
