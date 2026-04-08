import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActivityNotificationCard from './ActivityNotificationCard';
import { NotificationActivity } from './types';

type Props = {
  items: NotificationActivity[];
  onActivityPress?: (item: NotificationActivity) => void;
};

export default function RecentActivitySection({ items, onActivityPress }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Recent Activity</Text>

      <View style={styles.list}>
        {items.map((item) => (
          <ActivityNotificationCard
            key={item.id}
            item={item}
            onPress={() => onActivityPress?.(item)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1A1D',
    marginBottom: 16,
  },
  list: {
    marginTop: 2,
  },
});
