import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function ChatSearchBar() {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name="search" size={18} color={colors.subText} style={{ marginRight: 8 }} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder="Search conversations..."
        placeholderTextColor={colors.subText}
        value={query}
        onChangeText={setQuery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  input:     { flex: 1, fontSize: 14 },
});