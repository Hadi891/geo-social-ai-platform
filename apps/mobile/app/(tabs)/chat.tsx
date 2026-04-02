import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomNavBar from '@/components/BottomNavBar';
import TopBar from '@/components/TopBar';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';


export default function ChatScreen() {
    const { colors } = useTheme();
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      content: {
        flex: 1,
        padding: 20,
        paddingBottom: 110,
      },
    });

  return (
    <View style={styles.container}>
        <TopBar title="Mingle Chat" onLeftPress={() => router.navigate('/settings')} />

      <View style={styles.content}>
        <Text>Chat List Page</Text>
      </View>

    </View>
  );
}

