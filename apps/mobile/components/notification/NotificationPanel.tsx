import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useNotifications } from './NotificationContext';
import { NewMatch, NotificationActivity } from './types';
import NewMatchesSection from './NewMatchesSection';
import RecentActivitySection from './RecentActivitySection';
import LikerProfilePopup from './LikerProfilePopup';

import { useAuth } from '@/context/AuthContext';
import {
  getNotifications,
  getLikerProfile,
  type LikerProfile,
  type NotificationMatch,
  type NotificationActivity as APIActivity,
} from '@repo/api';

const LOGO = require('@/assets/images/logo.png');
const SCREEN_HEIGHT = Dimensions.get('window').height;
const TOP_BAR_HEIGHT = 56;
const BOTTOM_NAV_HEIGHT = 82;

function mapMatches(raw: NotificationMatch[]): NewMatch[] {
  return raw.map((m) => ({
    id: m.match_id,
    user_id: m.user_id,
    name: m.name ?? 'Match',
    avatar: m.avatar_url ? { uri: m.avatar_url } : LOGO,
  }));
}

function mapActivities(raw: APIActivity[]): NotificationActivity[] {
  return raw.map((a, i) => ({
    id: `${a.type}-${a.actor_id}-${i}`,
    type: a.type,
    actor_id: a.actor_id,
    name: a.actor_name ?? 'User',
    message: a.extra_text ?? undefined,
    ref_id: a.ref_id ?? undefined,
    createdAt: a.created_at,
    avatar: a.actor_avatar_url ? { uri: a.actor_avatar_url } : LOGO,
  }));
}

export default function NotificationPanel() {
  const { isOpen, close } = useNotifications();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [matches, setMatches] = useState<NewMatch[]>([]);
  const [activities, setActivities] = useState<NotificationActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Liker popup state
  const [likerPopupVisible, setLikerPopupVisible] = useState(false);
  const [likerProfile, setLikerProfile] = useState<LikerProfile | null>(null);
  const [likerLoading, setLikerLoading] = useState(false);
  const [selectedLikerId, setSelectedLikerId] = useState<string | null>(null);

  // Animate panel
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

  // Fetch data when panel opens
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await getNotifications(token);
      setMatches(mapMatches(data.matches));
      setActivities(mapActivities(data.activities));
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleMatchPress = (match: NewMatch) => {
    close();
    router.push({
      pathname: '/conversation',
      params: { name: match.name, match_id: match.id },
    });
  };

  const handleActivityPress = async (item: NotificationActivity) => {
    if (item.type === 'like_profile') {
      // Show liker profile popup
      setSelectedLikerId(item.actor_id);
      setLikerPopupVisible(true);
      setLikerLoading(true);
      setLikerProfile(null);
      try {
        const token = await getToken();
        const profile = await getLikerProfile(token, item.actor_id);
        setLikerProfile(profile);
      } catch (err) {
        console.error('Failed to load liker profile', err);
        setLikerPopupVisible(false);
      } finally {
        setLikerLoading(false);
      }
    } else if (item.type === 'match') {
      // Open the chat with this match
      close();
      router.push({
        pathname: '/conversation',
        params: { name: item.name, match_id: item.ref_id ?? '' },
      });
    }
    // like_post and comment: no navigation for now (could go to post detail later)
  };

  const handleLikerPass = () => {
    setLikerPopupVisible(false);
    setLikerProfile(null);
  };

  const handleLikerLike = async () => {
    if (!selectedLikerId) return;
    try {
      const { apiFetch } = await import('@repo/api');
      const token = await getToken();
      await apiFetch(token, '/like', {
        method: 'POST',
        body: JSON.stringify({ liked_user_id: selectedLikerId }),
      });
    } catch (err) {
      console.error('Like failed', err);
    }
    setLikerPopupVisible(false);
    setLikerProfile(null);
    // Refresh notifications to show new match if it happened
    fetchData();
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
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#D85AAF" />
          </View>
        ) : matches.length === 0 && activities.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubText}>
              Go explore nearby people and start connecting!
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <NewMatchesSection matches={matches} onMatchPress={handleMatchPress} />
            <RecentActivitySection items={activities} onActivityPress={handleActivityPress} />
          </ScrollView>
        )}
      </Animated.View>

      <LikerProfilePopup
        visible={likerPopupVisible}
        loading={likerLoading}
        profile={likerProfile}
        onPass={handleLikerPass}
        onLike={handleLikerLike}
        onClose={handleLikerPass}
      />
    </>
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1A1D',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});
