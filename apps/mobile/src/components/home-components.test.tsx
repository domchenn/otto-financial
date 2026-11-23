import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ActionRow } from './ActionRow';
import { BenefitCard } from './BenefitCard';
import { CartIcon } from './icons';
import { StatRow } from './StatRow';
import { SummarySlot } from './SummarySlot';
import { light } from '@/theme/tokens';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 0 } }));

describe('SummarySlot', () => {
  it('shows the brief under a Today label, clamped to three lines', async () => {
    await render(<SummarySlot brief={{ summary: 'A quiet Friday.' }} />);
    expect(screen.getByRole('header', { name: 'Today' })).toBeOnTheScreen();
    expect(screen.getByText('A quiet Friday.').props.numberOfLines).toBe(3);
    expect(screen.queryByRole('button', { name: 'Read all' })).toBeNull();
  });

  it('offers Read all only when there is more than the summary', async () => {
    const onReadAll = jest.fn();
    await render(
      <SummarySlot
        brief={{ summary: 'November is over plan.', detail: 'More.' }}
        onReadAll={onReadAll}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Read all' }));
    expect(onReadAll).toHaveBeenCalled();
  });

  it('shows a skeleton instead of text while loading', async () => {
    await render(<SummarySlot loading brief={{ summary: 'Old text' }} />);
    expect(screen.getByLabelText("Loading today's summary")).toBeOnTheScreen();
    expect(screen.queryByText('Old text')).toBeNull();
  });
});

describe('StatRow', () => {
  it('colors the sub-line by meaning and reads each stat as one button', async () => {
    const onPress = jest.fn();
    await render(
      <StatRow
        stats={[
          { label: 'Net worth', value: '$14,610', sub: '5 accounts', onPress },
          { label: 'Spent · Nov', value: '$1,436', sub: '$536 over plan', subTone: 'warn' },
          { label: 'Due Sun', value: '$1,632', sub: 'Covered', subTone: 'accent' },
        ]}
      />,
    );
    expect(screen.getByText('$536 over plan')).toHaveStyle({ color: light.alert });
    expect(screen.getByText('Covered')).toHaveStyle({ color: light.link });
    expect(screen.getByText('5 accounts')).toHaveStyle({ color: light.muted });
    await fireEvent.press(screen.getByRole('button', { name: 'Net worth, $14,610, 5 accounts' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ActionRow', () => {
  it('shows the title and reason and runs each action', async () => {
    const approve = jest.fn();
    const later = jest.fn();
    await render(
      <ActionRow
        icon={CartIcon}
        tone="mint"
        title="Move $1,200 of idle checking into savings"
        reason="You keep more in checking than a month of spending"
        primary={{ title: 'Show me', onPress: approve }}
        secondary={{ title: 'Not now', onPress: later }}
      />,
    );
    expect(screen.getByText('Move $1,200 of idle checking into savings')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Show me' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    expect(approve).toHaveBeenCalledTimes(1);
    expect(later).toHaveBeenCalledTimes(1);
  });
});

describe('BenefitCard', () => {
  const art = { color: '#D9D9DE', chip: '#B5B5BC', ink: '#17181C' };

  it('reads as one sentence and opens the credit', async () => {
    const onPress = jest.fn();
    await render(
      <BenefitCard
        art={art}
        cardName="Platinum"
        amountCents={1500}
        name="Uber Cash"
        daysLeft={10}
        share={0.33}
        action={{ title: 'How to use it', onPress }}
      />,
    );
    expect(
      screen.getByLabelText('Uber Cash, $15 on Platinum. Expires in 10 days.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'How to use it: Uber Cash' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('turns terracotta inside two weeks and stays muted after', async () => {
    const props = { art, cardName: 'Gold', amountCents: 2200, name: 'Dining credit', share: 0.5 };
    const action = { title: 'How to use it', onPress: jest.fn() };
    const { rerender } = await render(<BenefitCard {...props} daysLeft={14} action={action} />);
    expect(screen.getByText('Expires in 14 days')).toHaveStyle({ color: light.alert });
    await rerender(<BenefitCard {...props} daysLeft={40} action={action} />);
    expect(screen.getByText('Expires in 40 days')).toHaveStyle({ color: light.muted });
  });
});
