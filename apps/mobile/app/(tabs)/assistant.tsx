import React, { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import TopBar from '@/components/TopBar';
import { useTheme } from '@/context/ThemeContext';
import AssistantHeader from '@/components/assistant/AssistantHeader';
import ChatMessage from '@/components/assistant/ChatMessage';
import SuggestionChip from '@/components/assistant/SuggestionChip';
import AssistantInputBar from '@/components/assistant/AssistantInputBar';
import { useAuth } from '@/context/AuthContext';
import { sendAssistantMessage } from '@repo/api';
import { router } from 'expo-router';

export type MessageType = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
};

const SUGGESTIONS = [
  'Give me an icebreaker',
  'Review my bio',
  'Help me start a conversation',
];

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

const INITIAL_MESSAGES: MessageType[] = [
  {
    id: createId(),
    sender: 'assistant',
    text: "Hi there! I'm your Mingle assistant. I'm here to help you make meaningful connections. How can I brighten your profile today?",
    time: getCurrentTime(),
  },
];

export default function AssistantScreen() {
  const { colors } = useTheme();
  const { getToken } = useAuth();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageType[]>(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const styles = StyleSheet.create({
    keyboardContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 12,
    },
    messagesContainer: {
      flex: 1,
      marginTop: 18,
    },
    messagesContent: {
      paddingBottom: 8,
    },
    suggestionsContainer: {
      marginTop: 8,
      marginBottom: 12,
      flexGrow: 0,
    },
    suggestionsContent: {
      paddingRight: 8,
    },
  });

  const handleSendMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || loading) return;

    const userMessage: MessageType = {
      id: createId(),
      sender: 'user',
      text: trimmedText,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    Keyboard.dismiss();
    setLoading(true);

    try {
      const token = await getToken();
      const reply = await sendAssistantMessage(token, trimmedText);

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          sender: 'assistant',
          text: reply,
          time: getCurrentTime(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          sender: 'assistant',
          text: 'Sorry, something went wrong. Please try again.',
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <View style={styles.container}>
        <TopBar
          title="Mingle Assistant"
          onLeftPress={() => router.navigate('/settings')}
        />

        <View style={styles.content}>
          <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                scrollViewRef.current?.scrollToEnd({ animated: true })
              }
            >
              <AssistantHeader
                title="Mingle AI"
                subtitle="Your radiant curator"
              />

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContent}
            style={styles.suggestionsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {SUGGESTIONS.map((suggestion) => (
              <SuggestionChip
                key={suggestion}
                label={suggestion}
                onPress={() => handleSendMessage(suggestion)}
              />
            ))}
          </ScrollView>

          <AssistantInputBar
            value={input}
            onChangeText={setInput}
            onSend={() => handleSendMessage(input)}
            placeholder="Message Mingle AI..."
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}