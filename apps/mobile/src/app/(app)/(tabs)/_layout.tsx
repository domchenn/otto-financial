import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';

/** Home · Accounts · [Ask] · Spending · Benefits (handoff §3). */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts' }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask' }} />
      <Tabs.Screen name="spending" options={{ title: 'Spending' }} />
      <Tabs.Screen name="benefits" options={{ title: 'Benefits' }} />
    </Tabs>
  );
}
