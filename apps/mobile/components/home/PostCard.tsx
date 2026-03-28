import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

type PostCardProps = {
  profileImageSource: ImageSourcePropType;
  name: string;
  age?: number;
  subtitle: string;
  postImageSource: ImageSourcePropType;
  caption: string;
  tags: string[];
};

export default function PostCard({
  profileImageSource,
  name,
  age,
  distance,
  postImageSource,
  caption,
  tags,
}: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={profileImageSource} style={styles.profileImage} />

          <View>
            <Text style={styles.nameText}>
              {name}
              {age ? `, ${age}` : ''}
            </Text>
            <Text style={styles.distance}>{`${distance} km away`}</Text>
          </View>
        </View>
      </View>

      <Image source={postImageSource} style={styles.postImage} />

      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="heart-outline" size={22} color="#3E3342" />
          </Pressable>

          <Pressable style={styles.iconButton}>
            <Feather name="message-circle" size={20} color="#3E3342" />
          </Pressable>
        </View>
      </View>

      <Text style={styles.caption}>
        <Text style={styles.nameText}>{name} </Text>
        {caption}
      </Text>

      <View style={styles.tagsRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7EC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2632',
  },
  distance: {
    fontSize: 11,
    color: '#867A88',
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 12,
  },
  caption: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: '#433847',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  tagChip: {
    backgroundColor: '#F8E5F1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C44A93',
  },
});