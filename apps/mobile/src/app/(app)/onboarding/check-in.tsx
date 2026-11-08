import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { LabelTile } from '@/components/badges';
import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { NotificationPreview } from '@/components/NotificationPreview';
import { OptionRow } from '@/components/selection';
import { Text } from '@/components/Text';
import { space, type ToneName } from '@/theme/tokens';

type Cadence = 'daily' | 'matters' | 'weekly';

const OPTIONS: {
  id: Cadence;
  label: string;
  tone: ToneName;
  title: string;
  subtitle: string;
  preview: [string, string];
}[] = [
  {
    id: 'daily',
    label: 'AM',
    tone: 'butter',
    title: 'A daily brief',
    subtitle: 'A quick morning summary of your money',
    preview: ['Good morning, Dom', '$312 left this week. Your dining credit resets in 3 days.'],
  },
  {
    id: 'matters',
    label: '!',
    tone: 'indigo',
    title: 'Only when it matters',
    subtitle: 'Expiring credits, due dates and unusual charges',
    preview: ['Credit expiring Tuesday', 'Your $10 Gold dining credit resets in 3 days.'],
  },
  {
    id: 'weekly',
    label: '7d',
    tone: 'mint',
    title: 'A weekly recap',
    subtitle: 'Every Sunday: what you spent and earned',
    preview: ['Your week with Otto', 'You spent $188, earned 640 points and used $15 in credits.'],
  },
];

export default function CheckIn() {
  const [cadence, setCadence] = useState<Cadence>('matters');
  const current = OPTIONS.find((o) => o.id === cadence) ?? OPTIONS[1]!;

  return (
    <StepScreen
      step={{ index: 4, total: 5 }}
      heading="How often should Otto check in?"
      subheading="You can change this anytime in settings."
      footer={
        <Footer>
          <Button title="Continue" onPress={() => router.push('/onboarding/connect')} />
        </Footer>
      }
    >
      <View style={{ gap: space.md, marginTop: space.xl }}>
        {OPTIONS.map((o) => (
          <OptionRow
            key={o.id}
            title={o.title}
            subtitle={o.subtitle}
            selected={cadence === o.id}
            onPress={() => setCadence(o.id)}
            leading={<LabelTile label={o.label} tone={o.tone} size={56} />}
          />
        ))}
      </View>
      <Text
        variant="row"
        weight="bold"
        muted
        style={{ marginTop: space.xl, marginBottom: space.md }}
      >
        Preview
      </Text>
      <NotificationPreview title={current.preview[0]} body={current.preview[1]} />
    </StepScreen>
  );
}
