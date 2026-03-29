import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AssistantInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  onPressAdd?: () => void;
};

export default function AssistantInputBar({
  value,
  onChangeText,
  onSend,
  placeholder = 'Message...',
  onPressAdd,
}: AssistantInputBarProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.leftIconButton} onPress={onPressAdd}>
        <Ionicons name="add-circle-outline" size={22} color="#B33A90" />
      </Pressable>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A591A1"
        onSubmitEditing={onSend}
        returnKeyType="send"
      />

      <Pressable style={styles.sendButton} onPress={onSend}>
        <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: '#F6EAF2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
  },
  leftIconButton: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#3A2A36',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D45C91',
    alignItems: 'center',
    justifyContent: 'center',
  },
});