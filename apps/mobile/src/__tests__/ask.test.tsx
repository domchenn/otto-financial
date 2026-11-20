import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import Ask from '@/app/(app)/(tabs)/ask';
import { renderScreen } from '@/test/fixtures';

jest.mock('@clerk/expo', () => ({ useUser: () => ({ user: { firstName: 'Dominic' } }) }));

let mockKeyboard = false;
jest.mock('@/lib/useKeyboardVisible', () => ({ useKeyboardVisible: () => mockKeyboard }));
beforeEach(() => {
  mockKeyboard = false;
});

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('@/lib/api', () => {
  const f = jest.requireActual<typeof import('@/test/fixtures')>('@/test/fixtures');
  return { useSpending: () => f.mockResult(f.weekSpending) };
});

describe('Ask', () => {
  it('leads with the headline and a small wordmark, not an avatar', async () => {
    await renderScreen(<Ask />);
    expect(screen.getByText('Hi Dominic. What do you want to know?')).toBeOnTheScreen();
    expect(screen.getByLabelText('Otto')).toBeOnTheScreen();
  });

  it('suggests questions from the user’s numbers', async () => {
    await renderScreen(<Ask />);
    expect(screen.getByText('Your $10 dining credit resets in 3 days')).toBeOnTheScreen();
    expect(screen.getByText('Which card for dinner tonight?')).toBeOnTheScreen();
    expect(screen.getByText('$120 spent since Monday')).toBeOnTheScreen();
    expect(screen.getByText(/^\$65 in credits expire /)).toBeOnTheScreen();
  });

  it('opens the credit or asks Otto when a suggestion is tapped', async () => {
    await renderScreen(<Ask />);
    await fireEvent.press(screen.getByText('Your $10 dining credit resets in 3 days'));
    expect(mockPush).toHaveBeenLastCalledWith('/credits/gold-dining');
    await fireEvent.press(screen.getByText('Summarize my week'));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/chat', params: { q: 'week' } });
  });

  // Regression: the input kept the tab bar's bottom margin with the keyboard open, leaving a
  // big gap above the keyboard.
  it('drops the tab bar margin while the keyboard is open', async () => {
    const inputArea = () => {
      let node = screen.getByLabelText('Ask about your money…').parent;
      while (node && !(StyleSheet.flatten(node.props.style)?.paddingBottom > 0)) node = node.parent;
      return StyleSheet.flatten(node?.props.style);
    };
    await renderScreen(<Ask />);
    expect(inputArea()?.paddingBottom).toBeGreaterThan(100);
    mockKeyboard = true;
    await renderScreen(<Ask />);
    expect(inputArea()?.paddingBottom).toBeLessThan(20);
  });
});
