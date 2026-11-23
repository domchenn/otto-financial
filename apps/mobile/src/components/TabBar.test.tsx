import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar } from './TabBar';
import { light } from '@/theme/tokens';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));

const TABS = [
  ['index', 'Home'],
  ['accounts', 'Accounts'],
  ['ask', 'Ask'],
  ['spending', 'Spending'],
  ['benefits', 'Benefits'],
] as const;

function props(activeIndex: number, emitted = { defaultPrevented: false }) {
  const routes = TABS.map(([name]) => ({ key: name, name }));
  const navigateToTab = jest.fn();
  const p = {
    state: { index: activeIndex, routes },
    descriptors: Object.fromEntries(TABS.map(([name, title]) => [name, { options: { title } }])),
    emitter: { emit: () => emitted },
    navigateToTab,
  } as unknown as BottomTabBarProps;
  return { p, navigateToTab };
}

function renderBar(p: BottomTabBarProps) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <TabBar {...p} />
    </SafeAreaProvider>,
  );
}

describe('TabBar', () => {
  it('shows the five Porter tabs in order with Ask in the middle', async () => {
    await renderBar(props(0).p);
    expect(screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual([
      'Home',
      'Accounts',
      'Ask',
      'Spending',
      'Benefits',
    ]);
  });

  it('highlights only the active tab in ink', async () => {
    await renderBar(props(1).p);
    expect(screen.getByRole('tab', { name: 'Accounts' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
    expect(screen.getByText('Accounts')).toHaveStyle({ color: light.ink });
    expect(screen.getByText('Home')).toHaveStyle({ color: light.muted });
  });

  it('navigates to a tab when tapped', async () => {
    const { p, navigateToTab } = props(0);
    await renderBar(p);
    await fireEvent.press(screen.getByRole('tab', { name: 'Benefits' }));
    expect(navigateToTab).toHaveBeenCalledWith('benefits');
  });

  it('lets a tabPress listener take over (how Ask opens its sheet)', async () => {
    const { p, navigateToTab } = props(0, { defaultPrevented: true });
    await renderBar(p);
    await fireEvent.press(screen.getByRole('tab', { name: 'Ask' }));
    expect(navigateToTab).not.toHaveBeenCalled();
  });
});
