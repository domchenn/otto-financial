import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { BudgetFields } from '@/components/BudgetFields';
import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { useBudget, useSaveBudget } from '@/lib/api';
import { draftFrom, type BudgetDraft } from '@/lib/budget';

/** Edit budgets after onboarding, including categories that don't count. */
export default function BudgetSettings() {
  const budget = useBudget();
  const save = useSaveBudget();
  const [draft, setDraft] = useState<BudgetDraft | undefined>(undefined);

  if (!budget.data) return <StepScreen title="Budget" />;
  const value = draft ?? draftFrom(budget.data);

  return (
    <StepScreen
      heading="Budget"
      subheading="For everyday spending. Home shows what's left."
      footer={
        <Footer>
          <Button
            title="Save"
            loading={save.isPending}
            onPress={() =>
              save.mutate(value, {
                onSuccess: () => router.back(),
                onError: () =>
                  Alert.alert("Couldn't save your budget", 'Check your connection and try again.'),
              })
            }
          />
        </Footer>
      }
    >
      <BudgetFields
        value={value}
        onChange={setDraft}
        excludable={budget.data.excludable_categories}
      />
    </StepScreen>
  );
}
