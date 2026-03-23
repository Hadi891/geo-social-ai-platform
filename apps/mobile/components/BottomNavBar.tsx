import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type TabKey = 'home' | 'map' | 'assistant' | 'chat' | 'profile';

type BottomNavBarProps = {
  activeTab: TabKey;
};

const PINK = '#D85AAF';
const INACTIVE = '#8E8090';
const BG = '#F7F2F6';

const tabs: {
  key: TabKey;
  label: string;
  route: string;
  renderIcon: (focused: boolean) => React.ReactNode;
}[] = [
  {
    key: 'home',
    label: 'HOME',
    route: '/home',
    renderIcon: (focused) => (
      <Ionicons
        name={focused ? 'home' : 'home-outline'}
        size={22}
        color={focused ? '#FFFFFF' : INACTIVE}
      />
    ),
  },
  {
    key: 'map',
    label: 'MAP',
    route: '/map',
    renderIcon: (focused) => (
      <Feather
        name="map"
        size={20}
        color={focused ? '#FFFFFF' : INACTIVE}
      />
    ),
  },
  {
    key: 'assistant',
    label: 'BOT',
    route: '/assistant',
    renderIcon: (focused) => (
      <MaterialCommunityIcons
        name={focused ? 'robot' : 'robot-outline'}
        size={20}
        color={focused ? '#FFFFFF' : INACTIVE}
      />
    ),
  },
  {
    key: 'chat',
    label: 'CHAT',
    route: '/chat',
    renderIcon: (focused) => (
      <Ionicons
        name={focused ? 'chatbubble' : 'chatbubble-outline'}
        size={20}
        color={focused ? '#FFFFFF' : INACTIVE}
      />
    ),
  },
  {
    key: 'profile',
    label: 'PROFILE',
    route: '/profile',
    renderIcon: (focused) => (
      <Ionicons
        name={focused ? 'person' : 'person-outline'}
        size={20}
        color={focused ? '#FFFFFF' : INACTIVE}
      />
    ),
  },
];

export default function BottomNavBar({ activeTab }: BottomNavBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const focused = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => {
                if (!focused) router.replace(tab.route);
              }}
            >
              {focused ? (
                <View style={styles.activeIconContainer}>
                  {tab.renderIcon(true)}
                </View>
              ) : (
                <View style={styles.iconContainer}>
                  {tab.renderIcon(false)}
                </View>
              )}

              <Text style={[styles.label, focused && styles.activeLabel]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: BG,
    borderRadius: 26,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconContainer: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PINK,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: INACTIVE,
    letterSpacing: 0.6,
  },
  activeLabel: {
    color: PINK,
  },
});