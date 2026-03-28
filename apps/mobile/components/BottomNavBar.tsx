import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabKey = 'home' | 'map' | 'assistant' | 'chat' | 'profile';

type BottomNavBarProps = {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
};

const PINK = '#D85AAF';
const INACTIVE = '#8E8090';
const BG = '#F7F2F6';

const tabs: {
  key: TabKey;
  label: string;
  renderIcon: (focused: boolean) => React.ReactNode;
}[] = [
  {
    key: 'home',
    label: 'HOME',
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
    label: 'ASS',
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
    renderIcon: (focused) => (
      <Ionicons
        name={focused ? 'person' : 'person-outline'}
        size={20}
        color={focused ? '#FFFFFF' : INACTIVE}
      />
    ),
  },
];

export default function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const focused = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => {
                if (!focused) onTabPress(tab.key);
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
    backgroundColor: '#FCF9FC',
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: BG,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE3EC',
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