import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type InterestChipsProps = {
  interests: string[];
};

export default function InterestChips({ interests }: InterestChipsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interests</Text>

      <View style={styles.chipsWrap}>
        {interests.map((interest) => (
          <View key={interest} style={styles.chip}>
            <Ionicons name="sparkles" size={12} color="#A85B9B" />
            <Text style={styles.chipText}>{interest}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#251D28',
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4EAF3',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#6D566B',
    fontWeight: '600',
    marginLeft: 6,
  },
});