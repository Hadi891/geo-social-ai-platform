import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

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
    label: 'ASSISTANT',
    renderIcon: (focused) => (
      <MaterialCommunityIcons
        name={focused ? 'robot' : 'robot-outline'}
        size={22}
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
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background,
//       backgroundColor: "#00FF00",
      paddingTop: 8,
    },
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      backgroundColor: colors.card,
      paddingTop: 12,
      paddingBottom: 10,
      paddingHorizontal: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      backgroundColor: colors.pink,
//       backgroundColor: "#00FF00",
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
    },
    activeLabel: {
      color: colors.pink,
    },
  });

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
              <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                {tab.renderIcon(focused)}
              </View>

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
