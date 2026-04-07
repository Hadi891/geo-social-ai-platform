import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Image, ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatMood } from '../constants/useChatMood';
import { ChatMood, ChatMoodMeta } from '../constants/chatMood';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOGO = require('@/assets/images/logo.png');

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  isTyping?: boolean;
};

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const INITIAL_MESSAGES: Message[] = [
  { id: '1', text: 'Hey! I saw you like outdoor photography too. Have you been to that new gallery downtown? 🍂', sender: 'them', time: '11:24 AM' },
  { id: '2', text: 'Oh hi! Yes, I actually went there last Saturday. The "Light & Shadows" exhibit was incredible.', sender: 'me', time: '11:26 AM' },
  { id: '3', text: "I loved the monochrome series the most! I'm planning to go back this weekend if you're interested?", sender: 'them', time: '11:28 AM' },
  { id: '4', text: '...', sender: 'them', time: '', isTyping: true },
];

const MOOD_TABS: { key: ChatMood; label: string }[] = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'flow',      label: 'Flow'      },
  { key: 'stalled',   label: 'Stalled'  },
];

// ── Bubble border-radius per mood and sender ──────────────────────────────────
function getBubbleStyle(mood: ChatMood, isMe: boolean) {
  if (mood === 'discovery') {
    // Very round pill with a small tail corner
    return isMe
      ? { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 22, borderBottomRightRadius: 5 }
      : { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 5,  borderBottomRightRadius: 22 };
  }
  if (mood === 'flow') {
    // Smooth rounded with subtle tail
    return isMe
      ? { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 5 }
      : { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 5,  borderBottomRightRadius: 20 };
  }
  if (mood === 'stalled') {
    // Boxy, almost rectangular
    return isMe
      ? { borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 2 }
      : { borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 2,  borderBottomRightRadius: 10 };
  }
  return { borderRadius: 18 };
}

// ── Input field border-radius per mood ───────────────────────────────────────
function getInputRadius(mood: ChatMood) {
  if (mood === 'discovery') return 24; // pill
  if (mood === 'stalled')   return 8;  // rectangular
  return 18;                           // flow / neutral
}

// ── Send button shape per mood ────────────────────────────────────────────────
function getSendBtnRadius(mood: ChatMood) {
  if (mood === 'stalled') return 10; // rounded square
  return 19;                         // circle
}

// ── Discovery top banner ──────────────────────────────────────────────────────
function DiscoveryBanner({ accent }: { accent: string }) {
  return (
    <View style={[discoveryBanner.card, { backgroundColor: accent + '15', borderColor: accent + '50' }]}>
      <Text style={discoveryBanner.emoji}>💫</Text>
      <View style={{ flex: 1 }}>
        <Text style={[discoveryBanner.title, { color: accent }]}>You just matched!</Text>
        <Text style={discoveryBanner.subtitle}>
          Start with something genuine — reference their interests.
        </Text>
      </View>
    </View>
  );
}

const discoveryBanner = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 0,
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  emoji:    { fontSize: 24, marginTop: 2 },
  title:    { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  subtitle: { fontSize: 12, color: '#A0826D', lineHeight: 17 },
});

// ── Stalled bottom nudge (always visible above chips) ─────────────────────────
function StalledNudge({ accent, bgColor }: { accent: string; bgColor: string }) {
  return (
    <View style={[stalledNudge.card, { backgroundColor: bgColor, borderTopColor: accent + '40' }]}>
      <Text style={stalledNudge.emoji}>💤</Text>
      <View style={{ flex: 1 }}>
        <Text style={[stalledNudge.title, { color: accent }]}>This chat has gone quiet</Text>
        <Text style={stalledNudge.subtitle}>A small nudge can go a long way.</Text>
      </View>
      <Pressable style={[stalledNudge.cta, { borderColor: accent }]}>
        <Text style={[stalledNudge.ctaText, { color: accent }]}>AI boost</Text>
      </Pressable>
    </View>
  );
}

const stalledNudge = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  emoji:    { fontSize: 20 },
  title:    { fontSize: 12, fontWeight: '700' },
  subtitle: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  cta: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    marginLeft: 'auto',
  },
  ctaText: { fontSize: 11, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState<ChatMood>('neutral');
  const colors = useChatMood(mood);
  const meta   = ChatMoodMeta[mood];

  const { name } = useLocalSearchParams<{ name: string }>();
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const flatListRef = useRef<FlatList>(null);

  // ── Transition animations ─────────────────────────────────────────────────
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const sendScale      = useRef(new Animated.Value(1)).current;

  const switchMood = (newMood: ChatMood) => {
    if (newMood === mood) return;
    setMood(newMood);
    // Fade content out → in on mode change
    Animated.sequence([
      Animated.timing(contentOpacity, { toValue: 0.15, duration: 100, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1,    duration: 220, useNativeDriver: true }),
    ]).start();
    // Bounce the send button
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.spring(sendScale,  { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
    ]).start();
  };

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [
      ...prev.filter(m => !m.isTyping),
      { id: Date.now().toString(), text: trimmed, sender: 'me', time: getTime() },
    ]);
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Pre-compute tab accent colors at component level (hooks must not be called in loops)
  const discoveryAccent = useChatMood('discovery').accent;
  const flowAccent      = useChatMood('flow').accent;
  const stalledAccent   = useChatMood('stalled').accent;
  const TAB_ACCENT: Record<string, string> = { discovery: discoveryAccent, flow: flowAccent, stalled: stalledAccent };

  const accent      = colors.accent;
  const inputRadius = getInputRadius(mood);
  const sendRadius  = getSendBtnRadius(mood);

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 8,
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={accent} />
        </Pressable>

        {/* Avatar — ring for discovery & stalled, dimmed for stalled */}
        <View style={[
          styles.avatarWrap,
          meta.avatarRingColor && { borderWidth: 2.5, borderColor: meta.avatarRingColor, borderRadius: 26, padding: 2 },
        ]}>
          <Image
            source={LOGO}
            style={[styles.headerAvatar, mood === 'stalled' && { opacity: 0.4 }]}
          />
          {/* Online dot — hidden for stalled */}
          {mood !== 'stalled' && (
            <View style={[styles.onlineDot, { backgroundColor: accent }]} />
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.headerName, { color: colors.text }]}>
              {name ?? 'Chat'}, 24
            </Text>
            {/* 🔥 badge only in flow */}
            {mood === 'flow' && (
              <View style={[styles.flowBadge, { backgroundColor: accent + '20' }]}>
                <Text style={styles.flowBadgeText}>🔥</Text>
              </View>
            )}
          </View>
          <Text style={[styles.statusText, {
            color: mood === 'stalled' ? '#94A3B8' : accent,
            opacity: mood === 'stalled' ? 0.7 : 1,
          }]}>
            {meta.statusLabel}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>

        {/* ── MOOD TAB BAR ──────────────────────────────────────────────── */}
        <View style={[styles.moodBar, {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }]}>
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

        {/* ── ANIMATED CONTENT ──────────────────────────────────────────── */}
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>

          {/* ── MESSAGES ────────────────────────────────────────────────── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={
              <>
                {/* Discovery-only: welcome banner at top of conversation */}
                {mood === 'discovery' && <DiscoveryBanner accent={accent} />}

                <View style={styles.dateSeparator}>
                  <View style={[styles.datePill, { backgroundColor: colors.border }]}>
                    <Text style={[styles.dateText, { color: colors.subText }]}>TODAY</Text>
                  </View>
                </View>
              </>
            }
            renderItem={({ item }) => {
              const isMe     = item.sender === 'me';
              const bubbleStyle = getBubbleStyle(mood, isMe);

              return (
                <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowThem]}>

                  {!isMe && (
                    <Image
                      source={LOGO}
                      style={[styles.msgAvatar, mood === 'stalled' && { opacity: 0.35 }]}
                    />
                  )}

                  <View style={isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start', flex: 1 }}>

                    {/* BUBBLE */}
                    {item.isTyping ? (
                      <View style={[styles.bubble, bubbleStyle, { backgroundColor: colors.bubbleOther }]}>
                        <Text style={{ color: colors.subText, fontSize: 20, letterSpacing: 2 }}>•••</Text>
                      </View>
                    ) : (
                      <View style={[
                        styles.bubble,
                        bubbleStyle,
                        { backgroundColor: isMe ? accent : colors.bubbleOther },
                        // Stalled received bubbles get a subtle border
                        !isMe && mood === 'stalled' && { borderWidth: 1, borderColor: '#CBD5E1' },
                      ]}>
                        <Text style={[
                          styles.messageText,
                          { color: isMe ? '#FFF' : colors.text },
                          // Stalled: slightly smaller, less energetic
                          mood === 'stalled' && { fontSize: 14, opacity: 0.85 },
                        ]}>
                          {item.text}
                        </Text>
                      </View>
                    )}

                    {/* TIME + read receipt */}
                    {!item.isTyping && (
                      <View style={styles.timeLine}>
                        <Text style={[styles.timeText, { color: colors.subText }]}>{item.time}</Text>
                        {isMe && (
                          <Ionicons
                            name="checkmark-done"
                            size={13}
                            // Flow: colored ticks to show engagement; others: subdued
                            color={mood === 'flow' ? accent : colors.subText}
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />

          {/* ── STALLED NUDGE — always visible, above chips ─────────────── */}
          {mood === 'stalled' && (
            <StalledNudge accent={accent} bgColor={colors.inputBg} />
          )}

          {/* ── CHIPS ───────────────────────────────────────────────────── */}
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
                  backgroundColor:  accent + '18',
                  borderColor:      accent + '55',
                  // Stalled chips: less rounded to match boxy theme
                  borderRadius: mood === 'stalled' ? 8 : 999,
                }]}
                onPress={() => setInput(chip)}
              >
                <Text style={[styles.chipText, { color: accent }]}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── INPUT BAR ───────────────────────────────────────────────── */}
          <View style={[styles.inputBar, {
            backgroundColor: colors.inputBg,
            borderTopColor:  colors.border,
            paddingBottom:   insets.bottom + 10,
          }]}>
            <TextInput
              style={[styles.input, {
                color:           colors.text,
                backgroundColor: colors.background,
                borderColor:     colors.border,
                borderRadius:    inputRadius,
              }]}
              value={input}
              onChangeText={setInput}
              placeholder={meta.inputPlaceholder}
              placeholderTextColor={colors.subText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
            />

            <Animated.View style={{ transform: [{ scale: sendScale }] }}>
              <Pressable
                style={[styles.sendBtn, {
                  backgroundColor: accent,
                  borderRadius:    sendRadius,
                  // Stalled: slightly muted, less prominent
                  opacity: mood === 'stalled' ? 0.72 : 1,
                }]}
                onPress={sendMessage}
              >
                <Ionicons
                  name={mood === 'discovery' ? 'heart' : 'paper-plane'}
                  size={mood === 'stalled' ? 15 : 17}
                  color="#FFF"
                />
              </Pressable>
            </Animated.View>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn:    { marginRight: 8 },
  avatarWrap: { marginRight: 10 },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  onlineDot: {
    position: 'absolute',
    bottom: 1, right: 1,
    width: 11, height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  headerInfo: { flex: 1 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerName: { fontSize: 15, fontWeight: '700' },
  flowBadge:  { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  flowBadgeText: { fontSize: 12 },
  statusText: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  // Mood tab bar
  moodBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  moodTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  moodTabText: { fontSize: 12, fontWeight: '600' },

  // Messages
  messagesList: { padding: 16, paddingBottom: 8 },
  dateSeparator: { alignItems: 'center', marginBottom: 16 },
  datePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  dateText: { fontSize: 11, fontWeight: '600' },

  messageRow:  { marginBottom: 14, maxWidth: '78%' },
  rowMe:       { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowThem: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 7 },

  bubble: { paddingHorizontal: 14, paddingVertical: 10 },
  messageText: { fontSize: 15, lineHeight: 22 },

  timeLine: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeText:  { fontSize: 10 },

  // Chips
  chipsRow:     { borderTopWidth: 1, maxHeight: 52 },
  chipsContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  chipText:     { fontSize: 12, fontWeight: '600' },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  sendBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
