import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNavBar from '@/components/BottomNavBar';
import TopBar from '@/components/TopBar';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="Mingle Chat" />

      <View style={styles.content}>
        <Text>Chat List Page</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9FC',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 110,
  },
});