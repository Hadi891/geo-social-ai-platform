import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';

import BottomNavBar, { TabKey } from '@/components/BottomNavBar';
import NotificationPanel from '@/components/notification/NotificationPanel';
import { NotificationProvider } from '@/components/notification/NotificationContext';

export default function TabsLayout() {
  return (
    <NotificationProvider>
      <View style={styles.container}>
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

        <NotificationPanel />
      </View>
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});