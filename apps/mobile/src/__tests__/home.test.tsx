import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Home from '@/app/(app)/(tabs)/index';

jest.mock('@clerk/expo', () => ({ useUser: () => ({ user: { firstName: 'Dominic' } }) }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));

function renderHome() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <Home />
    </SafeAreaProvider>,
  );
}

describe('Home', () => {
  it('leads with what is left to spend this week', async () => {
    await renderHome();
    expect(screen.getByText(/left to spend this week/)).toBeOnTheScreen();
    expect(screen.getByText(/Dominic/)).toBeOnTheScreen();
  });

  it('dismisses the Otto nudge with Later', async () => {
    await renderHome();
    expect(screen.getByText('Otto noticed')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Later' }));
    expect(screen.queryByText('Otto noticed')).toBeNull();
  });

  it('opens the dining credit from the nudge', async () => {
    await renderHome();
    await fireEvent.press(screen.getByRole('button', { name: 'Show me where' }));
    expect(mockPush).toHaveBeenCalledWith('/credits/gold-dining');
  });
});
