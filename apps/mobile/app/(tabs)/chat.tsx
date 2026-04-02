import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';import TopBar from '@/components/TopBar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSearchBar from '@/components/chat/ChatSearchBar';
import ActiveMatchesList, { MatchItem } from '@/components/chat/ActiveMatchesList';
import ConversationItem, { ConversationItemType } from '@/components/chat/ConversationItem';

const LOGO = require('@/assets/images/logo.png');

const MATCHES: MatchItem[] = [
  { id: '1', name: 'New',   imageSource: LOGO, isNew: true },
  { id: '2', name: 'Leo',   imageSource: LOGO },
  { id: '3', name: 'Sofia', imageSource: LOGO },
  { id: '4', name: 'James', imageSource: LOGO },
];

const CONVERSATIONS: ConversationItemType[] = [
  { id: '1', name: 'Maya',   imageSource: LOGO, lastMessage: 'Typing...',                        time: '2M AGO',   isOnline: true,  isTyping: true  },
  { id: '2', name: 'Alex',   imageSource: LOGO, lastMessage: 'That rooftop bar sounds like a plan! 🙌', time: '1H AGO',   isOnline: false },
  { id: '3', name: 'Elena',  imageSource: LOGO, lastMessage: 'How was your weekend hiking trip?', time: 'YESTERDAY', isOnline: false },
  { id: '4', name: 'Marcus', imageSource: LOGO, lastMessage: 'Do you still have those concert tick...', time: '2D AGO', isOnline: false },
  { id: '5', name: 'Chloe',  imageSource: LOGO, lastMessage: 'That was such a fun dinner!',       time: '3D AGO',   isOnline: false },
];

export default function ChatScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar title="Mingle Chat" onLeftPress={() => router.push('/settings')} />

      <FlatList
        data={CONVERSATIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <ChatHeader count={12} />
            <ChatSearchBar />
          </>
        }
        renderItem={({ item }) => (
        <ConversationItem
          item={item}
          onPress={() => router.push({ pathname: '/conversation', params: { name: item.name } })}
        />        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list:      { paddingBottom: 20 },
});