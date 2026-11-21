import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { BudgetFields } from '@/components/BudgetFields';
import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { useBudget, useSaveBudget } from '@/lib/api';
import { draftFrom, type BudgetDraft } from '@/lib/budget';

export default function Budget() {
  const budget = useBudget().data;
  const save = useSaveBudget();
  const [draft, setDraft] = useState<BudgetDraft | undefined>(undefined);
  const value = draft ?? draftFrom(budget);

  return (
    <StepScreen
      step={{ index: 3, total: 5 }}
      heading="How do you like to budget?"
      subheading="This is for everyday spending, not rent or bills."
      footer={
        <Footer>
          <Button
            title="Continue"
            loading={save.isPending}
            onPress={() =>
              save.mutate(value, {
                onSuccess: () => router.push('/onboarding/check-in'),
                onError: () =>
                  Alert.alert("Couldn't save your budget", 'Check your connection and try again.'),
              })
            }
          />
        </Footer>
      }
    >
      <BudgetFields value={value} onChange={setDraft} />
    </StepScreen>
  );
}
