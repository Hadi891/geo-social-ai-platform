import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNavBar from '@/components/BottomNavBar';
import TopBar from '@/components/TopBar';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="Mingle Map" />
      <View style={styles.content}>
        <Text>Map Page</Text>
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