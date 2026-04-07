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
};

export default function ConversationItem({ item, onPress }: { item: ConversationItemType; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.card, borderLeftColor: colors.pink }]}
      onPress={onPress}
    >
      <View style={styles.avatarWrap}>
        <Image source={item.imageSource} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.time, { color: colors.subText }]}>{item.time}</Text>
        </View>
        <Text
          style={[styles.preview, { color: item.isTyping ? colors.pink : colors.subText }]}
          numberOfLines={1}
        >
          {item.isTyping ? 'Typing...' : item.lastMessage}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 10, borderRadius: 16, padding: 12, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  avatarWrap: { position: 'relative', marginRight: 12 },
  avatar:     { width: 52, height: 52, borderRadius: 26 },
  onlineDot:  { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#FFF' },
  body:       { flex: 1 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name:       { fontSize: 15, fontWeight: '700' },
  time:       { fontSize: 11, fontWeight: '500', textTransform: 'uppercase' },
  preview:    { fontSize: 13 },
});