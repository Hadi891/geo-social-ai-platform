import React from 'react';
import { Tabs } from 'expo-router';
import BottomNavBar, { TabKey } from '@/components/BottomNavBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ state, navigation }) => (
        <BottomNavBar
          activeTab={state.routes[state.index].name as TabKey}
          onTabPress={(tab) => navigation.navigate(tab)}
        />
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="assistant" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}