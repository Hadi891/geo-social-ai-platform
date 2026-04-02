import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ChatHeader({ count = 12 }: { count?: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      <Text style={[styles.subtitle, { color: colors.subText }]}>{count} active conversations</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  title:     { fontSize: 26, fontWeight: '700' },
  subtitle:  { fontSize: 13, marginTop: 2 },
});