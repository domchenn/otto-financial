import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import { AppearancePicker } from './AppearancePicker';
import { getAppearance, setAppearance } from '@/theme/appearance';

jest.mock('expo-secure-store', () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => {},
}));

jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});

beforeEach(() => setAppearance('system'));

describe('AppearancePicker', () => {
  it('starts on System and explains it', async () => {
    await render(<AppearancePicker />);
    expect(screen.getByRole('tab', { name: 'System' })).toBeSelected();
    expect(screen.getByText(/follows your iPhone/)).toBeOnTheScreen();
  });

  it('switches to Dark when tapped', async () => {
    await render(<AppearancePicker />);
    await fireEvent.press(screen.getByRole('tab', { name: 'Dark' }));
    expect(getAppearance()).toBe('dark');
    expect(screen.getByRole('tab', { name: 'Dark' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'System' })).not.toBeSelected();
    expect(screen.getByText('Otto stays dark whatever your iPhone is set to.')).toBeOnTheScreen();
  });
});
