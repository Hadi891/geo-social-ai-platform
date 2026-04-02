import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, Image, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatMood } from '../constants/useChatMood';
import { ChatMood } from '../constants/chatMood';

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

export default function ConversationScreen() {
const [mood, setMood] = useState<ChatMood>('neutral');
  const colors = useChatMood(mood);

  const { name } = useLocalSearchParams<{ name: string }>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages(prev => [
      ...prev.filter(m => !m.isTyping),
      {
        id: Date.now().toString(),
        text: trimmed,
        sender: 'me',
        time: getTime(),
      },
    ]);

    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.bubbleUser[0]} />
        </Pressable>

        <View style={styles.avatarWrap}>
          <Image source={LOGO} style={styles.headerAvatar} />
          <View style={[styles.onlineDot, { backgroundColor: colors.bubbleUser[0] }]} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.text }]}>
            {name ?? 'Chat'}, 24
          </Text>
          <Text style={[styles.headerStatus, { color: colors.bubbleUser[0] }]}>
            ONLINE
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* MOOD SWITCH */}
        <View style={{ flexDirection: 'row', gap: 10, padding: 10 }}>
          <Pressable onPress={() => setMood('discovery')}>
            <Text style={{ color: 'green' }}>Discovery</Text>
          </Pressable>
          <Pressable onPress={() => setMood('flow')}>
            <Text style={{ color: 'pink' }}>Flow</Text>
          </Pressable>
          <Pressable onPress={() => setMood('stalled')}>
            <Text style={{ color: 'red' }}>Stalled</Text>
          </Pressable>
        </View>

        {/* MESSAGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.dateSeparator}>
              <Text style={[styles.dateText, { color: colors.subText }]}>
                TODAY
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender === 'me';

            return (
              <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowThem]}>

                {!isMe && <Image source={LOGO} style={styles.msgAvatar} />}

                <View style={isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start', flex: 1 }}>

                  {/* BUBBLE */}
                  {item.isTyping ? (
                    <View style={[styles.bubble, { backgroundColor: colors.bubbleOther }]}>
                      <Text style={{ color: colors.subText, fontSize: 22 }}>•••</Text>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.bubble,
                        isMe
                          ? { backgroundColor: colors.bubbleUser[0] }
                          : { backgroundColor: colors.bubbleOther },
                      ]}
                    >
                      <Text style={[styles.messageText, { color: isMe ? '#FFF' : colors.text }]}>
                        {item.text}
                      </Text>
                    </View>
                  )}

                  {/* TIME */}
                  {!item.isTyping && (
                    <View style={styles.timeLine}>
                      <Text style={[styles.timeText, { color: colors.subText }]}>
                        {item.time}
                      </Text>
                      {isMe && (
                        <Ionicons name="checkmark-done" size={14} color={colors.subText} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* CHIPS */}
        <View style={[styles.chipsRow, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {["I'd love to join!", "Sunday afternoon works!"].map(chip => (
            <Pressable
              key={chip}
              style={[styles.chip, { backgroundColor: colors.bubbleUser[0] + '20' }]}
              onPress={() => setInput(chip)}
            >
              <Text style={[styles.chipText, { color: colors.bubbleUser[0] }]}>
                {chip}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* INPUT */}
        <View style={[styles.inputBar, { backgroundColor: colors.inputBg, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.subText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
          />

          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.bubbleUser[0] }]}
            onPress={sendMessage}
          >
            <Ionicons name="paper-plane" size={16} color="#FFF" />
          </Pressable>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  backBtn: { marginRight: 8 },

  avatarWrap: { position: 'relative', marginRight: 10 },

  headerAvatar: { width: 40, height: 40, borderRadius: 20 },

  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },

  headerInfo: { flex: 1 },

  headerName: { fontSize: 15, fontWeight: '700' },

  headerStatus: { fontSize: 11, fontWeight: '600' },

  messagesList: { padding: 16, paddingBottom: 8 },

  dateSeparator: { alignItems: 'center', marginBottom: 16 },

  dateText: { fontSize: 11, fontWeight: '600' },

  messageRow: { marginBottom: 16, maxWidth: '78%' },

  rowMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },

  rowThem: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '85%',
  },

  msgAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  messageText: { fontSize: 15, lineHeight: 22 },

  timeLine: { flexDirection: 'row', marginTop: 4 },

  timeText: { fontSize: 10 },

  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },

  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});