import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationActivity } from './types';
import { formatNotificationTime } from './formatNotificationTime';
import { getNotificationText } from './getNotificationText';

type Props = {
  item: NotificationActivity;
  onPress?: () => void;
};

export default function ActivityNotificationCard({ item, onPress }: Props) {
  const badgeIcon =
    item.type === 'like_profile' || item.type === 'like_post'
      ? 'heart'
      : item.type === 'match'
      ? 'sparkles'
      : 'chatbubble';

  const badgeStyle =
    item.type === 'like_profile' || item.type === 'like_post'
      ? styles.likeBadge
      : item.type === 'match'
      ? styles.matchBadge
      : styles.commentBadge;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatarWrapper}>
        <Image source={item.avatar} style={styles.avatar} />
        <View style={[styles.badge, badgeStyle]}>
          <Ionicons name={badgeIcon} size={10} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>
          {getNotificationText(item)}
        </Text>
        <Text style={styles.time}>{formatNotificationTime(item.createdAt)}</Text>
      </View>

      <View style={styles.dot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 82,
    borderRadius: 26,
    backgroundColor: '#F7F0F4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EADFE6',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  likeBadge: {
    backgroundColor: '#F08AA7',
  },
  matchBadge: {
    backgroundColor: '#9B59D0',
  },
  commentBadge: {
    backgroundColor: '#A86B3C',
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 19,
    color: '#2A1F26',
  },
  time: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#A09AA0',
    textTransform: 'uppercase',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#C05AA8',
    marginLeft: 10,
  },
});
