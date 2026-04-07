import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import TopBar from '@/components/TopBar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import ConversationItem, { ConversationItemType } from '@/components/chat/ConversationItem';
import { getMatches, getTypingIndicator, type Match } from '@repo/api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require('@/assets/images/logo.png');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Postgres returns timestamps without Z — force UTC interpretation
function parseUtc(iso: string) {
  return new Date(iso.endsWith('Z') ? iso : iso + 'Z');
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d      = parseUtc(iso);
  const now    = new Date();
  const diffMs  = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH   / 24);
  if (diffMin < 1)   return 'JUST NOW';
  if (diffMin < 60)  return `${diffMin}M AGO`;
  if (diffH   < 24)  return `${diffH}H AGO`;
  if (diffD   === 1) return 'YESTERDAY';
  return `${diffD}D AGO`;
}

// Extract the stable path part of a presigned URL (ignore expiring query params)
// e.g. "https://bucket.s3.amazonaws.com/profile-images/sub/uuid.jpg?X-Amz-..."
// → "https://bucket.s3.amazonaws.com/profile-images/sub/uuid.jpg"
function stablePhotoPath(url: string): string {
  try { return new URL(url).origin + new URL(url).pathname; } catch { return url; }
}

const POLL_MS       = 5000;  // how often to refresh match list while tab is open
const TYPING_POLL_MS = 4000;

export default function ChatScreen() {
  const { colors }   = useTheme();
  const { getToken } = useAuth();

  const [matches,    setMatches]    = useState<Match[]>([]);
  const [typingIds,  setTypingIds]  = useState<Set<string>>(new Set());
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  // Cache stable photo URIs to prevent flickering.
  // Key: match_id, Value: stable URI (path without query string)
  const photoCache = useRef<Map<string, string>>(new Map());
  // Stable image source per match_id (the full signed URL, kept until path changes)
  const photoSource = useRef<Map<string, string>>(new Map());

  const isFocused  = useRef(false);
  const pollTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef   = useRef('');

  // ── Stable photo resolution ───────────────────────────────────────────────
  function resolvePhoto(matchId: string, url: string | null): string | typeof LOGO {
    if (!url) return LOGO;
    const stablePath = stablePhotoPath(url);
    // Only update stored URI if the underlying file changed
    if (photoCache.current.get(matchId) !== stablePath) {
      photoCache.current.set(matchId, stablePath);
      photoSource.current.set(matchId, url); // store full URL for display
    }
    return photoSource.current.get(matchId) ?? url;
  }

  // ── Load matches ──────────────────────────────────────────────────────────
  const loadMatches = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const token = tokenRef.current || await getToken();
      tokenRef.current = token;
      const { matches: data } = await getMatches(token);
      setMatches(data);
      setError('');
    } catch (e: any) {
      setError(e.message ?? 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  // ── Poll typing ───────────────────────────────────────────────────────────
  const pollTyping = useCallback(async (currentMatches: Match[]) => {
    if (currentMatches.length === 0 || !tokenRef.current) return;
    try {
      const results = await Promise.allSettled(
        currentMatches.map(m => getTypingIndicator(tokenRef.current, m.match_id))
      );
      const typing = new Set<string>();
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.typing_user_ids.length > 0) {
          typing.add(currentMatches[i].match_id);
        }
      });
      setTypingIds(typing);
    } catch { /* ignore */ }
  }, []);

  // ── Focus lifecycle ───────────────────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    isFocused.current = true;

    // Immediate load on focus
    loadMatches();

    // Background poll while tab is open
    pollTimer.current = setInterval(() => {
      if (isFocused.current) loadMatches();
    }, POLL_MS);

    return () => {
      isFocused.current = false;
      if (pollTimer.current)  clearInterval(pollTimer.current);
      if (typingTimer.current) clearInterval(typingTimer.current);
    };
  }, [loadMatches]));

  // Typing poll restarts when matches change
  useEffect(() => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    if (matches.length === 0) return;
    typingTimer.current = setInterval(() => pollTyping(matches), TYPING_POLL_MS);
    return () => { if (typingTimer.current) clearInterval(typingTimer.current); };
  }, [matches, pollTyping]);

  // ── Map to display items ──────────────────────────────────────────────────
  const safeConversations: ConversationItemType[] = matches.map(m => {
    const resolved = resolvePhoto(m.match_id, m.profile_photo_url);
    return {
      id:          m.match_id,
      match_id:    m.match_id,
      name:        m.name ?? 'Match',
      imageSource: typeof resolved === 'string' ? { uri: resolved } : LOGO,
      lastMessage: m.last_message ?? 'Say hello 👋',
      time:        fmtTime(m.last_message_time ?? m.matched_at),
      isTyping:    typingIds.has(m.match_id),
      isOnline:    false,
      unreadCount: m.unread_count ?? 0,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Mingle Chat" onLeftPress={() => router.push('/settings')} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.subText }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={safeConversations}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMatches(true)}
              tintColor={colors.pink}
            />
          }
          ListHeaderComponent={
            <>
              <ChatHeader count={safeConversations.length} />
              <ChatSearchBar />
            </>
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                No matches yet — go explore nearby people! 🌍
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationItem
              item={item}
              onPress={() => router.push({
                pathname: '/conversation',
                params: { name: item.name, match_id: item.match_id ?? '' },
              })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list:      { paddingBottom: 20 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 14, textAlign: 'center' },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
