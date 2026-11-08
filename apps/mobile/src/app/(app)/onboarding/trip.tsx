import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { OttoBubble } from '@/components/otto';
import { Chip, ChipWrap } from '@/components/selection';
import { Text } from '@/components/Text';
import { space } from '@/theme/tokens';

const PLACES = [
  'Japan',
  'Europe',
  'Mexico & Caribbean',
  'A US city',
  'Somewhere else',
  'Nothing yet',
];
const WHEN = ['This year', 'Next year', 'Someday'];

const REACTIONS: Record<string, string> = {
  Japan:
    'Japan is one of the best ways to use points. I will track how close you are to the flights.',
  Europe:
    'Europe has great award options from most programs. I will watch how close your points get you.',
  'Mexico & Caribbean':
    'Short flights mean fewer points. You may already be closer than you think.',
  'A US city': 'Domestic trips are cheap on points. I will flag the best card to book with.',
  'Somewhere else': 'Tell me more later in Ask Otto and I will track it.',
};

export default function Trip() {
  const [place, setPlace] = useState('Japan');
  const [when, setWhen] = useState('Next year');
  const next = () => router.push('/onboarding/bonus');

  return (
    <StepScreen
      step={{ index: 1, total: 5 }}
      trailing={{ title: 'Skip', onPress: next }}
      heading="Any trip on your radar?"
      subheading="Otto will show how close your points get you."
      footer={
        <Footer>
          <Button title="Continue" onPress={next} />
        </Footer>
      }
    >
      <Text variant="row" weight="bold" style={{ marginTop: space.xl, marginBottom: space.md }}>
        Where to?
      </Text>
      <ChipWrap>
        {PLACES.map((p) => (
          <Chip key={p} label={p} selected={place === p} onPress={() => setPlace(p)} />
        ))}
      </ChipWrap>
      {place !== 'Nothing yet' ? (
        <>
          <Text variant="row" weight="bold" style={{ marginTop: space.xl, marginBottom: space.md }}>
            When?
          </Text>
          <ChipWrap>
            {WHEN.map((w) => (
              <Chip key={w} label={w} selected={when === w} onPress={() => setWhen(w)} />
            ))}
          </ChipWrap>
        </>
      ) : null}
      {REACTIONS[place] ? (
        <View style={{ marginTop: space.xl }}>
          <OttoBubble>{REACTIONS[place]}</OttoBubble>
        </View>
      ) : null}
    </StepScreen>
  );
}
