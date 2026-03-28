import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNavBar from '@/components/BottomNavBar';
import TopBar from '@/components/TopBar';

export default function AssistantScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="Mingle Assistant" />

      <View style={styles.content}>
        <Text>AI Assistant Page</Text>
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