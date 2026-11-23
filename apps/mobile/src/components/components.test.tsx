import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';
import { OptionRow } from './selection';
import { StatTile } from './StatTile';
import { NetWorthBar } from './NetWorthBar';
import { PlanStep } from './PlanStep';
import { LiveLabel, PorterNoticed } from './porter';

describe('Button', () => {
  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<Button title="Continue" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled and says so to VoiceOver', async () => {
    const onPress = jest.fn();
    await render(<Button title="Create an account" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Create an account' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});

describe('OptionRow', () => {
  it('exposes its checked state and reports taps', async () => {
    const onPress = jest.fn();
    await render(<OptionRow kind="check" title="Stay on budget" selected onPress={onPress} />);
    const row = screen.getByRole('checkbox', { name: 'Stay on budget' });
    expect(row).toBeChecked();
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('StatTile', () => {
  it('renders label, value and caption', async () => {
    await render(
      <StatTile tone="lilac" label="Points" value="142,800" caption="≈ $2,140 in travel" />,
    );
    expect(screen.getByText('Points')).toBeOnTheScreen();
    expect(screen.getByText('142,800')).toBeOnTheScreen();
    expect(screen.getByText('≈ $2,140 in travel')).toBeOnTheScreen();
  });
});

describe('PorterNoticed', () => {
  it('renders the nudge with both actions', async () => {
    const show = jest.fn();
    const later = jest.fn();
    await render(
      <PorterNoticed
        primary={{ title: 'Show me where', onPress: show }}
        secondary={{ title: 'Later', onPress: later }}
      >
        Your dining credit resets in 3 days.
      </PorterNoticed>,
    );
    expect(screen.getByText('Porter noticed')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Later' }));
    expect(later).toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
  });
});

describe('tiles', () => {
  it('use the neutral gray tile when a pastel would carry no meaning', async () => {
    const { LabelTile } = jest.requireActual<typeof import('./badges')>('./badges');
    const { light } = jest.requireActual<typeof import('@/theme/tokens')>('@/theme/tokens');
    await render(<LabelTile label="AX" tone="neutral" />);
    expect(screen.getByText('AX')).toHaveStyle({ color: light.ink });
    await render(<LabelTile label="CR" tone="butter" />);
    expect(screen.getByText('CR')).toHaveStyle({ color: light.tones.butter.text });
  });
});

describe('LiveLabel', () => {
  it('reads its label as a header, with the dot hidden from VoiceOver', async () => {
    await render(<LiveLabel>Today</LiveLabel>);
    expect(screen.getByRole('header', { name: 'Today' })).toBeOnTheScreen();
  });
});

describe('NetWorthBar', () => {
  const base = {
    net_cents: 1_461_000,
    cash_cents: 1_874_100,
    investments_cents: 0,
    cards_cents: 413_100,
    loans_cents: 0,
    changes: [],
    tracking_since: null,
  };

  it('always names cash, investing and cards, with what is owed as negative', async () => {
    await render(<NetWorthBar netWorth={base} />);
    const legend: [string, string][] = [
      ['Cash', '$18,741'],
      ['Investing', '$0'],
      ['Cards', '−$4,131'],
    ];
    for (const [label, amount] of legend) {
      expect(screen.getByText(label)).toBeOnTheScreen();
      expect(screen.getByText(amount)).toBeOnTheScreen();
    }
    expect(screen.queryByText('Loans')).toBeNull();
  });

  it('adds loans only when there are some', async () => {
    await render(<NetWorthBar netWorth={{ ...base, loans_cents: 250_000 }} />);
    expect(screen.getByText('Loans')).toBeOnTheScreen();
    expect(screen.getByText('−$2,500')).toBeOnTheScreen();
  });
});

describe('PlanStep', () => {
  it('reads its number, title and detail as one sentence', async () => {
    await render(
      <PlanStep index={1} title="Book flights" detail="Covers about $1,800" done={false} />,
    );
    expect(screen.getByLabelText('Step 1: Book flights. Covers about $1,800')).toBeOnTheScreen();
    expect(screen.getByText('1')).toBeOnTheScreen();
  });

  it('shows a check instead of the number once done', async () => {
    await render(<PlanStep index={2} title="Use your hotel credit" detail="Platinum" done />);
    expect(
      screen.getByLabelText('Step 2, done: Use your hotel credit. Platinum'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('2')).toBeNull();
  });
});
