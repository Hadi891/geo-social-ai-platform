import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type SuggestionChipProps = {
  label: string;
  onPress: () => void;
};

export default function SuggestionChip({
  label,
  onPress,
}: SuggestionChipProps) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F4E6F0',
    marginRight: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7D496D',
  },
});