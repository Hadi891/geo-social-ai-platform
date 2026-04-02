import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotifications } from './NotificationContext';
import { newMatches, recentActivities } from './mockData';
import NewMatchesSection from './NewMatchesSection';
import RecentActivitySection from './RecentActivitySection';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const TOP_BAR_HEIGHT = 56;
const BOTTOM_NAV_HEIGHT = 82;

export default function NotificationPanel() {
  const { isOpen } = useNotifications();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isOpen ? 0 : -SCREEN_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, opacity, translateY]);

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        styles.panel,
        {
          top: insets.top + TOP_BAR_HEIGHT,
          bottom: insets.bottom + BOTTOM_NAV_HEIGHT,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <NewMatchesSection matches={newMatches} />
        <RecentActivitySection items={recentActivities} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFF8FB',
    zIndex: 999,
    elevation: 999,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    paddingBottom: 24,
  },
});