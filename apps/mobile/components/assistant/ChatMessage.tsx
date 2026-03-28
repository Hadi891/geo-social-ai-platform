import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

type MessageType = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
};

type ChatMessageProps = {
  message: MessageType;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';

  return (
    <View
      style={[
        styles.wrapper,
        isUser ? styles.userWrapper : styles.assistantWrapper,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>
      </View>

      <Text style={[styles.meta, isUser ? styles.userMeta : styles.assistantMeta]}>
        {isUser ? 'YOU' : 'MINGLE AI'} • {message.time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    maxWidth: '84%',
  },
  assistantWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE3EC',
  },
  userBubble: {
    backgroundColor: '#A22F87',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  assistantText: {
    color: '#3A2A36',
  },
  userText: {
    color: '#FFFFFF',
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