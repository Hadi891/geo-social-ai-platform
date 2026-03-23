import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNavBar from '@/components/BottomNavBar';

export default function AssistantScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text>AI Assistant Page</Text>
      </View>

      <BottomNavBar activeTab="assistant" />
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