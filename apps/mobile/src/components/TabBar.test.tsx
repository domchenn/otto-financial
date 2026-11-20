import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar } from './TabBar';
import { light } from '@/theme/tokens';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));

function props(activeIndex: number): BottomTabBarProps {
  const routes = ['index', 'wallet', 'spending', 'ask'].map((name) => ({ key: name, name }));
  const titles: Record<string, string> = {
    index: 'Home',
    wallet: 'Wallet',
    spending: 'Spending',
    ask: 'Ask',
  };
  return {
    state: { index: activeIndex, routes },
    descriptors: Object.fromEntries(
      routes.map((r) => [r.key, { options: { title: titles[r.name] } }]),
    ),
    emitter: { emit: () => ({ defaultPrevented: false }) },
    navigateToTab: jest.fn(),
  } as unknown as BottomTabBarProps;
}

describe('TabBar', () => {
  it('highlights only the active tab; Ask is gray when inactive', async () => {
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, left: 0, right: 0, bottom: 34 },
        }}
      >
        <TabBar {...props(0)} />
      </SafeAreaProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Ask' })).not.toBeSelected();
    expect(screen.getByText('Ask')).toHaveStyle({ color: light.muted });
    expect(screen.getByText('Home')).toHaveStyle({ color: light.ink });
  });
});
