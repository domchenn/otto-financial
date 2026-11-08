import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';
import { OptionRow } from './selection';
import { StatTile } from './StatTile';
import { OttoNoticed } from './otto';

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

describe('OttoNoticed', () => {
  it('renders the nudge with both actions', async () => {
    const show = jest.fn();
    const later = jest.fn();
    await render(
      <OttoNoticed
        primary={{ title: 'Show me where', onPress: show }}
        secondary={{ title: 'Later', onPress: later }}
      >
        Your dining credit resets in 3 days.
      </OttoNoticed>,
    );
    expect(screen.getByText('Otto noticed')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Later' }));
    expect(later).toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
  });
});
