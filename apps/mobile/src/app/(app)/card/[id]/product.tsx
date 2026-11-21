import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Footer, StepScreen } from '@/components/layouts';
import { GroupLabel } from '@/components/rows';
import { Chip, OptionRow } from '@/components/selection';
import { Text } from '@/components/Text';
import { useAssignCard, useBenefits, useCardProducts } from '@/lib/api';
import type { CardProduct } from '@/lib/credits';
import { space } from '@/theme/tokens';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NONE = 'none';

/** Tell Otto which card a linked account is, so it can track that card's credits. */
export default function CardProductPicker() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const products = useCardProducts().data ?? [];
  const current = useBenefits().data?.cards.find((c) => c.account_id === id);
  const assign = useAssignCard();

  const [cardId, setCardId] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<number | null | undefined>(undefined);
  const selected = cardId ?? current?.card_id ?? NONE;
  const anniversary = month === undefined ? (current?.anniversary_month ?? null) : month;
  const product = products.find((p) => p.id === selected);
  const needsMonth = product?.needs_anniversary ?? false;

  const issuers = groupByIssuer(products, current?.institution_name ?? null);

  const save = () =>
    assign.mutate(
      {
        accountId: id,
        cardId: selected === NONE ? null : selected,
        anniversaryMonth: needsMonth ? anniversary : null,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert("Couldn't save", 'Check your connection and try again.'),
      },
    );

  return (
    <StepScreen
      heading="Which card is this?"
      subheading={
        current
          ? `${current.account_name}${current.account_mask ? ` •• ${current.account_mask}` : ''}. Otto tracks the credits that come with it.`
          : 'Otto tracks the credits that come with it.'
      }
      footer={
        <Footer>
          <Button title="Save" onPress={save} loading={assign.isPending} />
        </Footer>
      }
    >
      {needsMonth ? (
        <View style={{ marginTop: space.lg }}>
          <Text variant="row" weight="bold" style={{ fontSize: 18 }}>
            Card anniversary month
          </Text>
          <Text variant="body" muted style={{ marginTop: space.xs }}>
            Some of this card&apos;s credits reset on the month you opened it. It&apos;s on your
            annual fee statement.
          </Text>
          <View style={styles.months}>
            {MONTHS.map((label, i) => (
              <Chip
                key={label}
                label={label}
                selected={anniversary === i + 1}
                onPress={() => setMonth(i + 1)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {issuers.map(([issuer, cards]) => (
        <View key={issuer}>
          <GroupLabel>{issuer}</GroupLabel>
          <View style={styles.options}>
            {cards.map((p) => (
              <OptionRow
                key={p.id}
                title={p.name}
                selected={selected === p.id}
                onPress={() => setCardId(p.id)}
              />
            ))}
          </View>
        </View>
      ))}

      <GroupLabel>Other</GroupLabel>
      <View style={styles.options}>
        <OptionRow
          title="Not listed"
          subtitle="Otto won't track credits for this card"
          selected={selected === NONE}
          onPress={() => setCardId(NONE)}
        />
      </View>
    </StepScreen>
  );
}

/**
 * Catalog cards by issuer, with the account's own bank first: some banks (Chase) give every
 * card the same generic name, so Otto can't guess which one it is.
 */
function groupByIssuer(
  products: CardProduct[],
  institution: string | null,
): [string, CardProduct[]][] {
  const groups = new Map<string, CardProduct[]>();
  for (const p of products) groups.set(p.issuer, [...(groups.get(p.issuer) ?? []), p]);
  const own = institution?.toLowerCase() ?? '';
  const isOwn = (issuer: string) =>
    own !== '' && (own.includes(issuer.toLowerCase()) || issuer.toLowerCase().includes(own));
  return [...groups.entries()].sort(([a], [b]) => Number(isOwn(b)) - Number(isOwn(a)));
}

const styles = StyleSheet.create({
  months: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  options: { gap: space.sm },
});
