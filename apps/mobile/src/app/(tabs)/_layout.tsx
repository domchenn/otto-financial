import { Tabs } from 'expo-router';

const navy = '#0B1F33';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: navy,
        tabBarInactiveTintColor: '#66717F',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5EAF1',
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="benefits" options={{ title: 'Benefits' }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
    </Tabs>
  );
}
