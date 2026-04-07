import React, { useCallback, useEffect, useState } from 'react';
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

// Postgres returns timestamps without Z — force UTC interpretation
function parseUtc(iso: string) {
  return new Date(iso.endsWith('Z') ? iso : iso + 'Z');
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d = parseUtc(iso);
  const now = new Date();
  const diffMs  = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH   / 24);
  if (diffMin < 60)  return `${diffMin || 1}M AGO`;
  if (diffH   < 24)  return `${diffH}H AGO`;
  if (diffD   === 1) return 'YESTERDAY';
  return `${diffD}D AGO`;
}

function matchToItem(m: Match, typingMatchIds: Set<string>): ConversationItemType {
  const isTyping = typingMatchIds.has(m.match_id);
  return {
    id:          m.match_id,           // use match_id as the list key
    match_id:    m.match_id,
    name:        m.name ?? 'Match',
    imageSource: m.profile_photo_url ? { uri: m.profile_photo_url } : LOGO,
    lastMessage: m.last_message ?? 'Say hello 👋',
    time:        fmtTime(m.last_message_time ?? m.matched_at),
    isTyping,
    isOnline:    false,                // typing presence is shown via isTyping
  };
}

const TYPING_POLL_MS = 4000;

export default function ChatScreen() {
  const { colors }   = useTheme();
  const { getToken } = useAuth();

  const [matches,       setMatches]       = useState<Match[]>([]);
  const [typingIds,     setTypingIds]      = useState<Set<string>>(new Set());
  const [loading,       setLoading]        = useState(true);
  const [refreshing,    setRefreshing]     = useState(false);
  const [error,         setError]          = useState('');

  // ── Load matches ────────────────────────────────────────────────────────────
  const loadMatches = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const token = await getToken();
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

  // ── Poll typing across all matches ─────────────────────────────────────────
  const pollTyping = useCallback(async () => {
    if (matches.length === 0) return;
    try {
      const token = await getToken();
      const results = await Promise.allSettled(
        matches.map(m => getTypingIndicator(token, m.match_id))
      );
      const typing = new Set<string>();
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.typing_user_ids.length > 0) {
          typing.add(matches[i].match_id);
        }
      });
      setTypingIds(typing);
    } catch {
      // ignore
    }
  }, [matches, getToken]);

  // Reload every time this tab is focused (e.g. returning from conversation)
  useFocusEffect(useCallback(() => {
    loadMatches();
  }, [loadMatches]));

  useEffect(() => {
    if (matches.length === 0) return;
    const t = setInterval(pollTyping, TYPING_POLL_MS);
    return () => clearInterval(t);
  }, [matches, pollTyping]);

  const conversations = matches.map(m => matchToItem(m, typingIds));

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
          data={conversations}
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
              <ChatHeader count={conversations.length} />
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
  container:  { flex: 1 },
  list:       { paddingBottom: 20 },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText:  { fontSize: 14, textAlign: 'center' },
  emptyText:  { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
