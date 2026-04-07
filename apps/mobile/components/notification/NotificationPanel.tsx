import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotifications } from './NotificationContext';
import { NotificationActivity } from './types';
import { newMatches, recentActivities as initialRecentActivities } from './mockData';
import NewMatchesSection from './NewMatchesSection';
import RecentActivitySection from './RecentActivitySection';
import MatchActionModal from './MatchActionModal';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const TOP_BAR_HEIGHT = 56;
const BOTTOM_NAV_HEIGHT = 82;

export default function NotificationPanel() {
  const { isOpen } = useNotifications();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [selectedProfileLike, setSelectedProfileLike] = useState<NotificationActivity | null>(null);
  const [activities, setActivities] = useState<NotificationActivity[]>(initialRecentActivities);

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

  const handleNotificationPress = (item: NotificationActivity) => {
    if (item.type === 'like' && item.likeTarget === 'profile') {
      setSelectedProfileLike(item);
    }
  };

  const handleCloseModal = () => {
    setSelectedProfileLike(null);
  };

  const handleConfirmMatch = (item: NotificationActivity) => {
    const newMatchNotification: NotificationActivity = {
      id: Date.now().toString(),
      type: 'match',
      name: item.name,
      createdAt: formatNowForNotification(),
      avatar: item.avatar,
    };

    setActivities((prev) => [newMatchNotification, ...prev]);
    setSelectedProfileLike(null);
  };

  return (
    <>
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
          <RecentActivitySection
            items={activities}
            onItemPress={handleNotificationPress}
          />
        </ScrollView>
      </Animated.View>

      <MatchActionModal
        visible={!!selectedProfileLike}
        item={selectedProfileLike}
        onClose={handleCloseModal}
        onMatch={handleConfirmMatch}
      />
    </>
  );
}

function formatNowForNotification() {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
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