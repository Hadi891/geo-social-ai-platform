import React from 'react';
import { View, Text, Image, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export type ConversationItemType = {
  id: string;
  match_id?: string;
  name: string;
  imageSource: ImageSourcePropType;
  lastMessage: string;
  time: string;
  isOnline?: boolean;
  isTyping?: boolean;
  unreadCount?: number;
};

export default function ConversationItem({ item, onPress }: { item: ConversationItemType; onPress?: () => void }) {
  const { colors } = useTheme();
  const hasUnread = (item.unreadCount ?? 0) > 0;

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.card, borderLeftColor: hasUnread ? colors.pink : 'transparent' }]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        <Image source={item.imageSource} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.text, fontWeight: hasUnread ? '800' : '600' }]}>
            {item.name}
          </Text>
          <View style={styles.rightCol}>
            <Text style={[styles.time, { color: hasUnread ? colors.pink : colors.subText }]}>
              {item.time}
            </Text>
            {hasUnread && (
              <View style={[styles.badge, { backgroundColor: colors.pink }]}>
                <Text style={styles.badgeText}>
                  {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text
          style={[styles.preview, {
            color:      item.isTyping ? colors.pink : hasUnread ? colors.text : colors.subText,
            fontWeight: hasUnread ? '600' : '400',
          }]}
          numberOfLines={1}
        >
          {item.isTyping ? 'Typing...' : item.lastMessage}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:  {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 18, marginBottom: 10,
    borderRadius: 16, padding: 12, borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar:     { width: 52, height: 52, borderRadius: 26 },
  onlineDot:  {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFF',
  },
  body:     { flex: 1 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  name:     { fontSize: 15, flex: 1, marginRight: 8 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  time:     { fontSize: 11, fontWeight: '500', textTransform: 'uppercase' },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  preview:   { fontSize: 13 },
});
