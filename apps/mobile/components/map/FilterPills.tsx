import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Filter = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

interface FilterPillsProps {
  filters: Filter[];
}

export default function FilterPills({ filters }: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => (
        <TouchableOpacity key={filter.id} style={styles.pill}>
          <Ionicons name={filter.icon} size={16} color="#2F2632" style={styles.icon} />
          <Text style={styles.text}>{filter.label}</Text>
          <Ionicons name="chevron-down" size={14} color="#8E8291" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#EFE7EC',
    shadowColor: '#2F2632',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: { marginRight: 6 },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F2632',
    marginRight: 4,
  },
});