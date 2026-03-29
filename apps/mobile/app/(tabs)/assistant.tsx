import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import TopBar from '@/components/TopBar';
import AssistantHeader from '@/components/assistant/AssistantHeader';
import ChatMessage from '@/components/assistant/ChatMessage';
import SuggestionChip from '@/components/assistant/SuggestionChip';
import AssistantInputBar from '@/components/assistant/AssistantInputBar';

export type MessageType = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
};

const FIXED_ASSISTANT_REPLY = 'Totally natural! The best conversations start with curiosity.';

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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageType[]>(INITIAL_MESSAGES);

  const scrollViewRef = useRef<ScrollView>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const appendAssistantReply = () => {
    const assistantMessage: MessageType = {
      id: createId(),
      sender: 'assistant',
      text: FIXED_ASSISTANT_REPLY,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleSendMessage = (text: string) => {
    const trimmedText = text.trim();

    if (!trimmedText) return;

    const userMessage: MessageType = {
      id: createId(),
      sender: 'user',
      text: trimmedText,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const timeout = setTimeout(() => {
      appendAssistantReply();
    }, 600);

    timeoutsRef.current.push(timeout);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TopBar title="Mingle Assistant" />

        <View style={styles.content}>
          <AssistantHeader
            title="Mingle AI"
            subtitle="Your radiant curator"
          />

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContent}
            style={styles.suggestionsContainer}
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
            onPressAdd={() => {}}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FCF9FC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
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