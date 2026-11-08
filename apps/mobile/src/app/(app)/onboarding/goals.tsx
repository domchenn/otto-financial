import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { IconTile } from '@/components/badges';
import { Button } from '@/components/Button';
import {
  GaugeIcon,
  GiftIcon,
  PieIcon,
  PlaneIcon,
  TrendDownIcon,
  type Icon,
} from '@/components/icons';
import { Footer, StepScreen } from '@/components/layouts';
import { OptionRow } from '@/components/selection';
import { space, type ToneName } from '@/theme/tokens';

const GOALS: { id: string; title: string; subtitle: string; icon: Icon; tone: ToneName }[] = [
  {
    id: 'points',
    title: 'Earn more points and miles',
    subtitle: 'Use the best card every time',
    icon: PlaneIcon,
    tone: 'lilac',
  },
  {
    id: 'credits',
    title: 'Use every card credit',
    subtitle: 'Stop leaving perks on the table',
    icon: GiftIcon,
    tone: 'butter',
  },
  {
    id: 'budget',
    title: 'Stay on budget',
    subtitle: 'Know what is left each week',
    icon: PieIcon,
    tone: 'mint',
  },
  {
    id: 'payoff',
    title: 'Pay down my balances',
    subtitle: 'Avoid interest, plan payoffs',
    icon: TrendDownIcon,
    tone: 'alert',
  },
  {
    id: 'score',
    title: 'Build my credit score',
    subtitle: 'Keep utilization healthy',
    icon: GaugeIcon,
    tone: 'sky',
  },
];

export default function Goals() {
  const [picked, setPicked] = useState<Set<string>>(new Set(['points', 'credits']));
  const toggle = (id: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <StepScreen
      step={{ index: 0, total: 5 }}
      heading="What should Otto help you with most?"
      subheading="Pick all that apply. This decides what you see first."
      footer={
        <Footer>
          <Button
            title="Continue"
            disabled={picked.size === 0}
            onPress={() => router.push('/onboarding/trip')}
          />
        </Footer>
      }
    >
      <View style={{ gap: space.md, marginTop: space.xl }}>
        {GOALS.map((g) => (
          <OptionRow
            key={g.id}
            kind="check"
            title={g.title}
            subtitle={g.subtitle}
            selected={picked.has(g.id)}
            onPress={() => toggle(g.id)}
            leading={<IconTile icon={g.icon} tone={g.tone} size={56} />}
          />
        ))}
      </View>
    </StepScreen>
  );
}
