import React from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ProfileFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
};

export default function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  error,
}: ProfileFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A99AA7"
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !!error && styles.inputError,
        ]}
      />

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#8A7D89',
    marginBottom: 8,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#F7F2F6',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#251D28',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  multilineInput: {
    minHeight: 120,
    paddingTop: 14,
    paddingBottom: 14,
  },
  inputError: {
    borderColor: '#E8505B',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#E8505B',
    fontWeight: '600',
  },
});