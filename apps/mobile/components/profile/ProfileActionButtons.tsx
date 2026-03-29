import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ProfileActionButtonsProps = {
  onSave: () => void;
  onCancel: () => void;
};

export default function ProfileActionButtons({
  onSave,
  onCancel,
}: ProfileActionButtonsProps) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveText}>Save Changes</Text>
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: '#D85AAF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#776A77',
  },
});