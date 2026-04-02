import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  onPressAdd?: () => void;
};

export default function AssistantInputBar({ value, onChangeText, onSend, placeholder = 'Message...', onPressAdd }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
      <Pressable style={styles.leftIconButton} onPress={onPressAdd}>
        <Ionicons name="add-circle-outline" size={22} color={colors.pink} />
      </Pressable>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subText}
        onSubmitEditing={onSend}
        returnKeyType="send"
      />
      <Pressable style={[styles.sendButton, { backgroundColor: colors.pink }]} onPress={onSend}>
        <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { minHeight: 58, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 8 },
  leftIconButton: { width: 34, alignItems: 'center', justifyContent: 'center' },
  input:          { flex: 1, fontSize: 15, paddingHorizontal: 8, paddingVertical: 12 },
  sendButton:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});