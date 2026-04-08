import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface IntroversionTestPromptProps {
  visible: boolean;
  onTakeIt: () => void;
  onLater: () => void;
}

export default function IntroversionTestPrompt({
  visible,
  onTakeIt,
  onLater,
}: IntroversionTestPromptProps) {
  if (!visible) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.title}>Take your introversion test</Text>
        <Text style={styles.description}>
          Answer a few quick questions to calculate your score.
        </Text>

        <View style={styles.buttonsRow}>
          <Pressable style={styles.laterButton} onPress={onLater}>
            <Text style={styles.laterButtonText}>Later</Text>
          </Pressable>

          <Pressable style={styles.takeItButton} onPress={onTakeIt}>
            <Text style={styles.takeItButtonText}>Take it</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 10,
    zIndex: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3D3E7',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  laterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  takeItButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#D85AAF',
  },
  takeItButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});