import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useChatMood } from '../../constants/useChatMood';
import { ChatMood } from '../../constants/chatMood';
import { LinearGradient } from 'expo-linear-gradient';

type MessageType = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
};

export default function ChatMessage({
  message,
  mood,
}: {
  message: MessageType;
  mood: 'discovery' | 'flow' | 'stalled';
}) {
  const colors = useChatMood(mood);
  const isUser = message.sender === 'user';

  return (
    <View
      style={[
        styles.wrapper,
        isUser ? styles.userWrapper : styles.assistantWrapper,
      ]}
    >
      {/* USER MESSAGE */}
      {isUser ? (
        <LinearGradient
          colors={colors.bubbleUser}
          style={styles.bubble}
        >
          <Text style={[styles.text, { color: '#FFFFFF' }]}>
            {message.text}
          </Text>
        </LinearGradient>
      ) : (
        /* ASSISTANT MESSAGE */
        <View
          style={[
            styles.bubble,
            { backgroundColor: colors.bubbleOther },
          ]}
        >
          <Text style={[styles.text, { color: colors.text }]}>
            {message.text}
          </Text>
        </View>
      )}


      <Text
        style={[
          styles.meta,
          isUser ? styles.userMeta : styles.assistantMeta,
        ]}
      >
        {isUser ? 'YOU' : 'MINGLE AI'} • {message.time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16, maxWidth: '84%' },
  assistantWrapper: { alignSelf: 'flex-start' },
  userWrapper: { alignSelf: 'flex-end' },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  text: {
    fontSize: 16,
    lineHeight: 22,
  },

  meta: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  assistantMeta: {
    color: '#8F7B8B',
    marginLeft: 4,
  },

  userMeta: {
    color: '#8F7B8B',
    textAlign: 'right',
    marginRight: 4,
  },
});