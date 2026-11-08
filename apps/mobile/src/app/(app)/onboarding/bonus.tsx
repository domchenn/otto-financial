import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Footer, StepScreen } from '@/components/layouts';
import { OptionRow } from '@/components/selection';
import { Card } from '@/components/Surface';
import { Text } from '@/components/Text';
import { space } from '@/theme/tokens';

type Answer = 'yes' | 'no' | 'soon';

export default function Bonus() {
  const [answer, setAnswer] = useState<Answer>('yes');
  const [card, setCard] = useState('Amex Gold');
  const [spend, setSpend] = useState('$4,000');
  const [by, setBy] = useState('Jan 15');

  return (
    <StepScreen
      keyboard
      step={{ index: 2, total: 5 }}
      heading="Working toward a sign-up bonus?"
      subheading={'Like "spend $4,000 in 3 months, get 60k points." Otto will track it for you.'}
      footer={
        <Footer>
          <Button title="Continue" onPress={() => router.push('/onboarding/budget')} />
        </Footer>
      }
    >
      <View style={{ gap: space.md, marginTop: space.xl }}>
        <OptionRow
          title="Yes, I am working on one"
          selected={answer === 'yes'}
          onPress={() => setAnswer('yes')}
        />
        <OptionRow
          title="Not right now"
          selected={answer === 'no'}
          onPress={() => setAnswer('no')}
        />
        <OptionRow
          title="Planning to open a card soon"
          selected={answer === 'soon'}
          onPress={() => setAnswer('soon')}
        />
      </View>
      {answer !== 'no' ? (
        <Card style={{ marginTop: space.xl, gap: space.lg }}>
          <Text variant="body" muted>
            Otto will track your progress once this card is connected.
          </Text>
          <Field label="Which card?" value={card} onChangeText={setCard} />
          <View style={styles.row}>
            <Field
              label="Spend needed"
              value={spend}
              onChangeText={setSpend}
              keyboardType="numbers-and-punctuation"
            />
            <Field label="By" value={by} onChangeText={setBy} />
          </View>
        </Card>
      ) : null}
    </StepScreen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: space.md } });
