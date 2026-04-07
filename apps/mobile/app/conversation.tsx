import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Image, ScrollView,
  Animated, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatMood } from '../constants/useChatMood';
import { ChatMood, ChatMoodMeta } from '../constants/chatMood';
import { useAuth } from '@/context/AuthContext';
import {
  getMyProfile,
  getMessages,
  sendChatMessage,
  markChatRead,
  editChatMessage,
  deleteChatMessage,
  postTypingIndicator,
  getTypingIndicator,
  type ChatMessage as APIChatMessage,
} from '@repo/api';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require('@/assets/images/logo.png');

// ── Local message type ────────────────────────────────────────────────────────

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  isTyping?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Postgres returns timestamps without Z — force UTC interpretation
const parseUtc = (iso: string) => new Date(iso.endsWith('Z') ? iso : iso + 'Z');

const fmt = (iso: string) =>
  parseUtc(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function toLocalMessage(m: APIChatMessage, myId: string): Message {
  return {
    id:        m.id,
    text:      m.message_text ?? '',
    sender:    m.sender_id === myId ? 'me' : 'them',
    time:      fmt(m.created_at),
    isDeleted: m.is_deleted,
    isEdited:  m.is_edited,
  };
}

// ── Bubble shape per mood ─────────────────────────────────────────────────────

function getBubbleStyle(mood: ChatMood, isMe: boolean) {
  if (mood === 'discovery') {
    return isMe
      ? { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 22, borderBottomRightRadius: 5 }
      : { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 5,  borderBottomRightRadius: 22 };
  }
  if (mood === 'flow') {
    return isMe
      ? { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 5 }
      : { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 5,  borderBottomRightRadius: 20 };
  }
  // stalled
  return isMe
    ? { borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 2 }
    : { borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 2,  borderBottomRightRadius: 10 };
}

const getInputRadius  = (mood: ChatMood) => mood === 'discovery' ? 24 : mood === 'stalled' ? 8  : 18;
const getSendRadius   = (mood: ChatMood) => mood === 'stalled'   ? 10 : 19;

// ── Discovery top banner ──────────────────────────────────────────────────────

function DiscoveryBanner({ accent }: { accent: string }) {
  return (
    <View style={[dBanner.card, { backgroundColor: accent + '15', borderColor: accent + '50' }]}>
      <Text style={dBanner.emoji}>💫</Text>
      <View style={{ flex: 1 }}>
        <Text style={[dBanner.title, { color: accent }]}>You just matched!</Text>
        <Text style={dBanner.subtitle}>Start with something genuine — reference their interests.</Text>
      </View>
    </View>
  );
}
const dBanner = StyleSheet.create({
  card:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16, padding: 14, borderRadius: 16, borderWidth: 1 },
  emoji:    { fontSize: 24, marginTop: 2 },
  title:    { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  subtitle: { fontSize: 12, color: '#A0826D', lineHeight: 17 },
});

// ── Stalled nudge (pinned above chips) ────────────────────────────────────────

function StalledNudge({ accent, bgColor }: { accent: string; bgColor: string }) {
  return (
    <View style={[sNudge.card, { backgroundColor: bgColor, borderTopColor: accent + '40' }]}>
      <Text style={sNudge.emoji}>💤</Text>
      <View style={{ flex: 1 }}>
        <Text style={[sNudge.title, { color: accent }]}>This chat has gone quiet</Text>
        <Text style={sNudge.sub}>A small nudge can go a long way.</Text>
      </View>
      <Pressable style={[sNudge.cta, { borderColor: accent }]}>
        <Text style={[sNudge.ctaText, { color: accent }]}>AI boost</Text>
      </Pressable>
    </View>
  );
}
const sNudge = StyleSheet.create({
  card:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  emoji:   { fontSize: 20 },
  title:   { fontSize: 12, fontWeight: '700' },
  sub:     { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  cta:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1.5, marginLeft: 'auto' },
  ctaText: { fontSize: 11, fontWeight: '700' },
});

// ── Mood tabs ─────────────────────────────────────────────────────────────────

const MOOD_TABS: { key: ChatMood; label: string }[] = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'flow',      label: 'Flow'      },
  { key: 'stalled',   label: 'Stalled'   },
];

// ── Main screen ───────────────────────────────────────────────────────────────

const POLL_MESSAGES_MS = 4000;
const POLL_TYPING_MS   = 2500;
const TYPING_TTL_MS    = 3000; // re-send typing heartbeat every 3s

export default function ConversationScreen() {
  const insets   = useSafeAreaInsets();
  const { getToken } = useAuth();
  const params   = useLocalSearchParams<{ name: string; match_id: string }>();
  const matchId  = params.match_id || '';
  const hasMatch = matchId.length > 0;

  // ── Mood ───────────────────────────────────────────────────────────────────
  const [mood, setMood] = useState<ChatMood>('neutral');
  const colors = useChatMood(mood);
  const meta   = ChatMoodMeta[mood];

  // Pre-compute tab accent colors (hooks must not be inside loops)
  const discColors = useChatMood('discovery');
  const flowColors = useChatMood('flow');
  const stalColors = useChatMood('stalled');
  const TAB_ACCENT: Record<string, string> = {
    discovery: discColors.accent,
    flow:      flowColors.accent,
    stalled:   stalColors.accent,
  };

  // ── Data ───────────────────────────────────────────────────────────────────
  const [, setMyUserId]   = useState<string | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [loading,       setLoading]       = useState(hasMatch);
  const [initDone,      setInitDone]      = useState(!hasMatch); // true immediately when no match_id
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [input,         setInput]         = useState('');

  // ── Edit / action state ────────────────────────────────────────────────────
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [actionMsg,    setActionMsg]    = useState<Message | null>(null); // long-press target
  const [actionVisible, setActionVisible] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const flatListRef       = useRef<FlatList>(null);
  const pollRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingPollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingHeartbeat   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const tokenRef          = useRef<string>('');
  const myUserIdRef       = useRef<string>('');
  const lastMessageIdRef  = useRef<string>('');

  // ── Animations ─────────────────────────────────────────────────────────────
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const sendScale      = useRef(new Animated.Value(1)).current;

  // ── Mood switch ────────────────────────────────────────────────────────────
  const switchMood = (newMood: ChatMood) => {
    if (newMood === mood) return;
    setMood(newMood);
    Animated.sequence([
      Animated.timing(contentOpacity, { toValue: 0.15, duration: 100, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1,    duration: 220, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.spring(sendScale,  { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
    ]).start();
  };

  // ── Load messages ──────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!hasMatch || !tokenRef.current || !myUserIdRef.current) return;
    try {
      const { messages: raw } = await getMessages(tokenRef.current, matchId, { limit: 50 });
      const mapped = raw.map(m => toLocalMessage(m, myUserIdRef.current));
      setMessages(mapped);
      if (raw.length > 0) lastMessageIdRef.current = raw[raw.length - 1].id;
    } catch {
      // silently ignore polling errors
    }
  }, [matchId, hasMatch]);

  // ── Poll typing ────────────────────────────────────────────────────────────
  const pollTyping = useCallback(async () => {
    if (!hasMatch || !tokenRef.current || !myUserIdRef.current) return;
    try {
      const { typing_user_ids } = await getTypingIndicator(tokenRef.current, matchId);
      setIsOtherTyping(typing_user_ids.length > 0);
    } catch {
      // ignore
    }
  }, [matchId, hasMatch]);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMatch) return;

    let cancelled = false;

    (async () => {
      try {
        const token = await getToken();
        if (cancelled) return;
        tokenRef.current = token;

        const profile = await getMyProfile(token);
        if (cancelled) return;
        myUserIdRef.current = profile.id;
        setMyUserId(profile.id);

        // Initial load
        const { messages: raw } = await getMessages(token, matchId, { limit: 50 });
        if (cancelled) return;
        setMessages(raw.map(m => toLocalMessage(m, profile.id)));
        if (raw.length > 0) lastMessageIdRef.current = raw[raw.length - 1].id;

        // Mark read
        markChatRead(token, matchId).catch(() => {});

        setLoading(false);
        setInitDone(true);

        // Start polling
        pollRef.current       = setInterval(loadMessages,  POLL_MESSAGES_MS);
        typingPollRef.current = setInterval(pollTyping,    POLL_TYPING_MS);
      } catch (err: any) {
        if (!cancelled) {
          setLoading(false);
          setInitDone(true); // still allow typing even if initial load fails
          Alert.alert('Connection error', err?.message ?? 'Could not load messages.');
        }
      }
    })();

    return () => {
      cancelled = true;
      if (pollRef.current)       clearInterval(pollRef.current);
      if (typingPollRef.current) clearInterval(typingPollRef.current);
      if (typingHeartbeat.current) clearTimeout(typingHeartbeat.current);
    };
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  // ── Typing heartbeat ───────────────────────────────────────────────────────
  const handleInputChange = (text: string) => {
    setInput(text);
    if (!hasMatch || !tokenRef.current) return;
    if (typingHeartbeat.current) return; // already scheduled
    postTypingIndicator(tokenRef.current, matchId);
    typingHeartbeat.current = setTimeout(() => {
      typingHeartbeat.current = null;
    }, TYPING_TTL_MS);
  };

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    // If editing an existing message
    if (editingId) {
      setInput('');
      setEditingId(null);
      // Optimistic update
      setMessages(prev => prev.map(m =>
        m.id === editingId ? { ...m, text, isEdited: true } : m
      ));
      try {
        await editChatMessage(tokenRef.current, editingId, text);
      } catch {
        Alert.alert('Edit failed', 'Could not edit the message. Please try again.');
        loadMessages(); // revert
      }
      return;
    }

    setInput('');

    if (!hasMatch || !initDone) return;

    // Optimistic: add a temp message
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = { id: tempId, text, sender: 'me', time: getTime() };
    setMessages(prev => [...prev.filter(m => !m.isTyping), optimistic]);

    try {
      const sent = await sendChatMessage(tokenRef.current, matchId, text);
      // Replace temp with real
      setMessages(prev => prev.map(m => m.id === tempId ? toLocalMessage(sent, myUserIdRef.current) : m));
      markChatRead(tokenRef.current, matchId).catch(() => {});
    } catch (err: any) {
      // Remove temp on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Send failed', err?.message ?? 'Could not send the message. Please try again.');
    }
  };

  // ── Long press → action sheet ──────────────────────────────────────────────
  const handleLongPress = (msg: Message) => {
    if (msg.sender !== 'me' || msg.isDeleted) return;
    setActionMsg(msg);
    setActionVisible(true);
  };

  const handleEdit = () => {
    if (!actionMsg) return;
    setActionVisible(false);
    setEditingId(actionMsg.id);
    setInput(actionMsg.text);
  };

  const handleDelete = () => {
    if (!actionMsg) return;
    setActionVisible(false);
    const target = actionMsg;
    // Optimistic
    setMessages(prev => prev.map(m =>
      m.id === target.id ? { ...m, isDeleted: true, text: '' } : m
    ));
    deleteChatMessage(tokenRef.current, target.id).catch(() => {
      loadMessages(); // revert on failure
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const accent      = colors.accent;
  const inputRadius = getInputRadius(mood);
  const sendRadius  = getSendRadius(mood);

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 8,
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={accent} />
        </Pressable>

        <View style={[
          styles.avatarWrap,
          meta.avatarRingColor && { borderWidth: 2.5, borderColor: meta.avatarRingColor, borderRadius: 26, padding: 2 },
        ]}>
          <Image source={LOGO} style={[styles.headerAvatar, mood === 'stalled' && { opacity: 0.4 }]} />
          {mood !== 'stalled' && <View style={[styles.onlineDot, { backgroundColor: accent }]} />}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.headerName, { color: colors.text }]}>
              {params.name ?? 'Chat'}, 24
            </Text>
            {mood === 'flow' && (
              <View style={[styles.flowBadge, { backgroundColor: accent + '20' }]}>
                <Text style={styles.flowBadgeText}>🔥</Text>
              </View>
            )}
          </View>
          <Text style={[styles.statusText, {
            color:   mood === 'stalled' ? '#94A3B8' : accent,
            opacity: mood === 'stalled' ? 0.7 : 1,
          }]}>
            {isOtherTyping ? 'typing...' : meta.statusLabel}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>

        {/* ── MOOD TAB BAR ── */}
        <View style={[styles.moodBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {MOOD_TABS.map(tab => {
            const isActive = mood === tab.key;
            const tabColor = TAB_ACCENT[tab.key] ?? accent;
            return (
              <Pressable
                key={tab.key}
                onPress={() => switchMood(tab.key)}
                style={[styles.moodTab, isActive && { borderBottomColor: tabColor, borderBottomWidth: 2.5 }]}
              >
                <Text style={[styles.moodTabText, { color: isActive ? tabColor : '#999' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── ANIMATED CONTENT ── */}
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>

          {/* Loading state */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={accent} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={[
                ...messages,
                ...(isOtherTyping
                  ? [{ id: '__typing__', text: '', sender: 'them' as const, time: '', isTyping: true }]
                  : []),
              ]}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <>
                  {mood === 'discovery' && <DiscoveryBanner accent={accent} />}
                  <View style={styles.dateSeparator}>
                    <View style={[styles.datePill, { backgroundColor: colors.border }]}>
                      <Text style={[styles.dateText, { color: colors.subText }]}>TODAY</Text>
                    </View>
                  </View>
                </>
              }
              renderItem={({ item }) => {
                const isMe = item.sender === 'me';
                const bubbleStyle = getBubbleStyle(mood, isMe);

                // Typing indicator bubble
                if (item.isTyping) {
                  return (
                    <View style={[styles.messageRow, styles.rowThem]}>
                      <Image source={LOGO} style={[styles.msgAvatar, mood === 'stalled' && { opacity: 0.35 }]} />
                      <View style={[styles.bubble, bubbleStyle, { backgroundColor: colors.bubbleOther }]}>
                        <Text style={{ color: colors.subText, fontSize: 20, letterSpacing: 2 }}>•••</Text>
                      </View>
                    </View>
                  );
                }

                // Deleted message
                if (item.isDeleted) {
                  return (
                    <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowThem]}>
                      {!isMe && <Image source={LOGO} style={[styles.msgAvatar, mood === 'stalled' && { opacity: 0.35 }]} />}
                      <View style={[
                        styles.bubble, bubbleStyle,
                        { backgroundColor: colors.bubbleOther, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
                      ]}>
                        <Text style={{ color: colors.subText, fontSize: 13, fontStyle: 'italic' }}>
                          🗑 Message deleted
                        </Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <Pressable
                    onLongPress={() => handleLongPress(item)}
                    style={[styles.messageRow, isMe ? styles.rowMe : styles.rowThem]}
                  >
                    {!isMe && (
                      <Image source={LOGO} style={[styles.msgAvatar, mood === 'stalled' && { opacity: 0.35 }]} />
                    )}
                    <View style={isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start', flex: 1 }}>
                      <View style={[
                        styles.bubble,
                        bubbleStyle,
                        { backgroundColor: isMe ? accent : colors.bubbleOther },
                        !isMe && mood === 'stalled' && { borderWidth: 1, borderColor: '#CBD5E1' },
                      ]}>
                        <Text style={[
                          styles.messageText,
                          { color: isMe ? '#FFF' : colors.text },
                          mood === 'stalled' && { fontSize: 14, opacity: 0.85 },
                        ]}>
                          {item.text}
                        </Text>
                      </View>

                      <View style={styles.timeLine}>
                        {item.isEdited && (
                          <Text style={[styles.editedLabel, { color: colors.subText }]}>edited · </Text>
                        )}
                        <Text style={[styles.timeText, { color: colors.subText }]}>{item.time}</Text>
                        {isMe && (
                          <Ionicons
                            name="checkmark-done"
                            size={13}
                            color={mood === 'flow' ? accent : colors.subText}
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {/* ── STALLED NUDGE ── */}
          {mood === 'stalled' && (
            <StalledNudge accent={accent} bgColor={colors.inputBg} />
          )}

          {/* ── CHIPS ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.chipsRow, { backgroundColor: colors.background, borderTopColor: colors.border }]}
            contentContainerStyle={styles.chipsContent}
          >
            {meta.chips.map(chip => (
              <Pressable
                key={chip}
                style={[styles.chip, {
                  backgroundColor: accent + '18',
                  borderColor:     accent + '55',
                  borderRadius:    mood === 'stalled' ? 8 : 999,
                }]}
                onPress={() => setInput(chip)}
              >
                <Text style={[styles.chipText, { color: accent }]}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── INPUT BAR ── */}
          {editingId && (
            <View style={[styles.editBanner, { backgroundColor: accent + '15', borderTopColor: colors.border }]}>
              <Ionicons name="create-outline" size={14} color={accent} />
              <Text style={[styles.editBannerText, { color: accent }]}>Editing message</Text>
              <Pressable onPress={() => { setEditingId(null); setInput(''); }} style={styles.editCancel}>
                <Ionicons name="close" size={16} color={accent} />
              </Pressable>
            </View>
          )}

          <View style={[styles.inputBar, {
            backgroundColor: colors.inputBg,
            borderTopColor:  colors.border,
            paddingBottom:   insets.bottom + 10,
          }]}>
            <TextInput
              style={[styles.input, {
                color:           colors.text,
                backgroundColor: colors.background,
                borderColor:     editingId ? accent : colors.border,
                borderRadius:    inputRadius,
              }]}
              value={input}
              onChangeText={handleInputChange}
              placeholder={meta.inputPlaceholder}
              placeholderTextColor={colors.subText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
            />

            <Animated.View style={{ transform: [{ scale: sendScale }] }}>
              <Pressable
                disabled={!initDone}
                style={[styles.sendBtn, {
                  backgroundColor: accent,
                  borderRadius:    sendRadius,
                  opacity: !initDone ? 0.35 : mood === 'stalled' ? 0.72 : 1,
                }]}
                onPress={handleSend}
              >
                <Ionicons
                  name={editingId ? 'checkmark' : mood === 'discovery' ? 'heart' : 'paper-plane'}
                  size={editingId ? 20 : mood === 'stalled' ? 15 : 17}
                  color="#FFF"
                />
              </Pressable>
            </Animated.View>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── ACTION SHEET MODAL (edit / delete) ── */}
      <Modal
        visible={actionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActionVisible(false)}>
          <Pressable style={[styles.actionSheet, { backgroundColor: colors.inputBg }]} onPress={() => {}}>
            <View style={[styles.actionHandle, { backgroundColor: colors.border }]} />

            <Pressable style={styles.actionRow} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color={accent} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Edit message</Text>
            </Pressable>

            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />

            <Pressable style={styles.actionRow} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.actionLabel, { color: '#EF4444' }]}>Delete message</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn:      { marginRight: 8 },
  avatarWrap:   { marginRight: 10 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  onlineDot:    { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: '#FFF' },
  headerInfo:   { flex: 1 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerName:   { fontSize: 15, fontWeight: '700' },
  flowBadge:    { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  flowBadgeText:{ fontSize: 12 },
  statusText:   { fontSize: 11, fontWeight: '600', marginTop: 1 },

  moodBar:     { flexDirection: 'row', borderBottomWidth: 1 },
  moodTab:     { flex: 1, alignItems: 'center', paddingVertical: 9, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  moodTabText: { fontSize: 12, fontWeight: '600' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  messagesList: { padding: 16, paddingBottom: 8 },
  dateSeparator:{ alignItems: 'center', marginBottom: 16 },
  datePill:     { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  dateText:     { fontSize: 11, fontWeight: '600' },

  messageRow: { marginBottom: 14, maxWidth: '78%' },
  rowMe:      { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowThem:    { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'flex-end', maxWidth: '85%' },
  msgAvatar:  { width: 30, height: 30, borderRadius: 15, marginRight: 7 },

  bubble:      { paddingHorizontal: 14, paddingVertical: 10 },
  messageText: { fontSize: 15, lineHeight: 22 },

  timeLine:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  editedLabel:  { fontSize: 10, fontStyle: 'italic' },
  timeText:     { fontSize: 10 },

  chipsRow:     { borderTopWidth: 1, maxHeight: 52 },
  chipsContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  chipText:     { fontSize: 12, fontWeight: '600' },

  editBanner:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderTopWidth: 1 },
  editBannerText: { flex: 1, fontSize: 12, fontWeight: '600' },
  editCancel:     { padding: 4 },

  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, gap: 10 },
  input:    { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1.5 },
  sendBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  actionSheet:  { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 32 },
  actionHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  actionRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  actionLabel:  { fontSize: 16, fontWeight: '500' },
  actionDivider:{ height: 1 },
});
