import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function SuggestionChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable style={[styles.chip, { backgroundColor: colors.pinkBg }]} onPress={onPress}>
      <Text style={[styles.label, { color: colors.pink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip:  { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, marginRight: 10 },
  label: { fontSize: 13, fontWeight: '600' },
});