import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import NewMatchItem from './NewMatchItem';
import { NewMatch } from './types';

type Props = {
  matches: NewMatch[];
  onMatchPress?: (match: NewMatch) => void;
};

export default function NewMatchesSection({ matches, onMatchPress }: Props) {
  if (matches.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>New Matches</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{matches.length} Matches</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {matches.map((item) => (
          <NewMatchItem
            key={item.id}
            item={item}
            onPress={() => onMatchPress?.(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
  },
  headerRow: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1A1D',
  },
  badge: {
    backgroundColor: '#F7D7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C05AA8',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
});
