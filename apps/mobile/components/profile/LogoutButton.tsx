import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type LogoutButtonProps = {
  onPress: () => void;
};

export default function LogoutButton({ onPress }: LogoutButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>Logout</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#E8505B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});