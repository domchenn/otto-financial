import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import AskSheet from '@/app/(app)/ask';
import { renderScreen } from '@/test/fixtures';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: { from?: string; q?: string } = {};
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: () => mockBack(),
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));
jest.mock('expo-blur', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { BlurView: View };
});

beforeEach(() => {
  mockParams = {};
  mockPush.mockClear();
  mockBack.mockClear();
});

describe('Ask sheet', () => {
  it('opens on a question and suggestions led by the screen it came from', async () => {
    mockParams = { from: 'benefits' };
    await renderScreen(<AskSheet />);
    expect(screen.getByText('What do you want to know?')).toBeOnTheScreen();
    expect(screen.getByText('Try asking')).toBeOnTheScreen();
    const suggestions = screen.getAllByText(/^(What credits|Summarize|Which card|How close)/);
    expect(suggestions.map((s) => s.props.children)).toEqual([
      'What credits expire this month?',
      'Summarize my week',
      'Which card for a $60 dinner tonight?',
      'How close am I to Japan?',
    ]);
  });

  it('answers in plain text, then the plan steps and Keep going', async () => {
    await renderScreen(<AskSheet />);
    await fireEvent.press(screen.getByText('What credits expire this month?'));
    // The question shows as the user's bubble, then Porter's answer under its label.
    expect(screen.getAllByText('What credits expire this month?').length).toBeGreaterThan(0);
    expect(screen.getByRole('header', { name: 'Porter' })).toBeOnTheScreen();
    expect(screen.getByText(/in credits reset this month\./)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Step 1: Use your \$10 Dining credit\./)).toBeOnTheScreen();
    expect(screen.getByText('Keep going')).toBeOnTheScreen();
    expect(screen.getByText(/^Based on .* · sample data$/)).toBeOnTheScreen();
  });

  it('asks the next topic from a Keep going chip', async () => {
    mockParams = { q: 'credits' };
    await renderScreen(<AskSheet />);
    await fireEvent.press(screen.getByText('Summarize my week'));
    expect(screen.getByText(/^Solid week:/)).toBeOnTheScreen();
    expect(screen.getAllByRole('header', { name: 'Porter' })).toHaveLength(2);
  });

  it('closes the sheet before opening a screen from a chip', async () => {
    mockParams = { q: 'credits' };
    await renderScreen(<AskSheet />);
    await fireEvent.press(screen.getByText('See all credits'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/benefits');
  });

  it('matches a typed canned question and is honest about anything else', async () => {
    await renderScreen(<AskSheet />);
    const field = screen.getByLabelText('Ask about your money, cards or trips');
    await fireEvent.changeText(field, 'summarize my week');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText(/^Solid week:/)).toBeOnTheScreen();
    await fireEvent.changeText(field, 'Should I refinance?');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText(/^I can only answer a few questions/)).toBeOnTheScreen();
  });

  it('closes when the dimmed background is tapped', async () => {
    await renderScreen(<AskSheet />);
    // The sheet is modal for VoiceOver, so the backdrop is hidden from it on purpose.
    const backdrop = screen.getByRole('button', { name: 'Close Ask', includeHiddenElements: true });
    await fireEvent.press(backdrop);
    await fireEvent.press(backdrop);
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1)); // once, despite two taps
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('gives VoiceOver a Close button on the handle', async () => {
    await renderScreen(<AskSheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  });
});
