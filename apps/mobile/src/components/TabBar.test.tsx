import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabBar } from './TabBar';
import { light } from '@/theme/tokens';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 1 },
}));

const TABS = [
  ['index', 'Home'],
  ['accounts', 'Accounts'],
  ['spending', 'Spending'],
  ['benefits', 'Benefits'],
] as const;

function setup(activeIndex: number) {
  const routes = TABS.map(([name]) => ({ key: name, name }));
  const navigateToTab = jest.fn();
  const onAsk = jest.fn();
  const props = {
    state: { index: activeIndex, routes },
    descriptors: Object.fromEntries(TABS.map(([name, title]) => [name, { options: { title } }])),
    emitter: { emit: () => ({ defaultPrevented: false }) },
    navigateToTab,
  } as unknown as BottomTabBarProps;
  return { props, navigateToTab, onAsk };
}

async function renderBar(activeIndex = 0) {
  const s = setup(activeIndex);
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <TabBar {...s.props} onAsk={s.onAsk} />
    </SafeAreaProvider>,
  );
  return s;
}

describe('TabBar', () => {
  it('shows Home, Accounts, Ask, Spending and Benefits, with Ask in the middle', async () => {
    await renderBar();
    expect(screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual([
      'Home',
      'Accounts',
      'Spending',
      'Benefits',
    ]);
    const labels = screen.getAllByText(/^(Home|Accounts|Ask|Spending|Benefits)$/);
    expect(labels.map((l) => l.props.children)).toEqual([
      'Home',
      'Accounts',
      'Ask',
      'Spending',
      'Benefits',
    ]);
  });

  it('highlights only the active tab in ink', async () => {
    await renderBar(1);
    expect(screen.getByRole('tab', { name: 'Accounts' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
    expect(screen.getByText('Accounts')).toHaveStyle({ color: light.ink });
    expect(screen.getByText('Home')).toHaveStyle({ color: light.muted });
  });

  it('navigates to a tab when tapped', async () => {
    const { navigateToTab } = await renderBar();
    await fireEvent.press(screen.getByRole('tab', { name: 'Benefits' }));
    expect(navigateToTab).toHaveBeenCalledWith('benefits');
  });

  it('opens Ask over the current tab instead of switching tabs', async () => {
    const { navigateToTab, onAsk } = await renderBar(3);
    await fireEvent.press(screen.getByRole('button', { name: 'Ask Porter' }));
    expect(onAsk).toHaveBeenCalledWith('benefits');
    expect(navigateToTab).not.toHaveBeenCalled();
  });
});
