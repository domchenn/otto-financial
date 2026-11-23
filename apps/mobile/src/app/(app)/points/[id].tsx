import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Footer, StepScreen } from '@/components/layouts';
import { Text } from '@/components/Text';
import { useConfirmPoints, usePoints } from '@/lib/api';
import { formatNumber } from '@/lib/money';
import { cardNames, findProgram, parsePoints } from '@/lib/points';
import { space } from '@/theme/tokens';

const confirmedDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** Enter the balance shown in the bank's app; Porter estimates from there. */
export default function ConfirmPoints() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const program = findProgram(usePoints().data, id);
  const confirm = useConfirmPoints();
  const [text, setText] = useState('');
  const points = parsePoints(text);

  if (!program) return <StepScreen title="Points" />;
  const save = () => {
    if (points === null) return;
    confirm.mutate(
      { programId: program.id, points },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert("Couldn't save", 'Check your connection and try again.'),
      },
    );
  };

  return (
    <StepScreen
      heading={`Add your current ${program.short_name} balance`}
      subheading={`Open your bank's app and enter the ${program.name} balance it shows. Porter adds the points you earn on ${cardNames(program)} from today.`}
      footer={
        <Footer>
          <Button
            title="Save"
            onPress={save}
            disabled={points === null}
            loading={confirm.isPending}
          />
        </Footer>
      }
    >
      <View style={{ marginTop: space.xl }}>
        <Field
          label={`${program.name} points`}
          value={text}
          onChangeText={setText}
          keyboardType="number-pad"
          placeholder={
            program.estimated_points !== null ? formatNumber(program.estimated_points) : '0'
          }
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
          error={text !== '' && points === null ? 'Enter a whole number of points' : null}
        />
      </View>
      {program.confirmed_points !== null && program.confirmed_at !== null ? (
        <Text variant="body" muted style={{ marginTop: space.lg }}>
          You entered {formatNumber(program.confirmed_points)} on{' '}
          {confirmedDate.format(new Date(program.confirmed_at))}. Porter estimates{' '}
          {formatNumber(program.estimated_points ?? program.confirmed_points)} now.
        </Text>
      ) : null}
    </StepScreen>
  );
}
