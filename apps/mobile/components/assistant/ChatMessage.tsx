import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/context/ThemeContext';

type MessageType = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
};

export default function ChatMessage({ message }: { message: MessageType }) {
  const { colors } = useTheme();
  const isUser = message.sender === 'user';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.text);
  };

  return (
    <View style={[styles.wrapper, isUser ? styles.userWrapper : styles.assistantWrapper]}>
      <View style={[styles.row, isUser ? styles.userRow : styles.assistantRow]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.pink }
              : styles.assistantBubble,
          ]}
        >
          <Text
            selectable
            style={[styles.text, { color: isUser ? '#FFFFFF' : '#1E1340' }]}
          >
            {message.text}
          </Text>
        </View>

        {!isUser && (
          <Pressable
            style={[
              styles.copyButton,
              {
                backgroundColor: colors.pinkBg,
                borderColor: colors.border,
              },
            ]}
            onPress={handleCopy}
            hitSlop={8}
          >
            <Ionicons name="copy-outline" size={14} color={colors.pink} />
          </Pressable>
        )}
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
    maxWidth: '92%',
  },

  assistantWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignSelf: 'flex-start',
  },
  userRow: {
    alignSelf: 'flex-end',
  },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
  },

  text: {
    fontSize: 16,
    lineHeight: 22,
  },

  copyButton: {
    marginLeft: 5,
    marginBottom: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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