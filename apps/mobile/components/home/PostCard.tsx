import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_H_PADDING = 12 * 2;
const SCREEN_H_PADDING = 14 * 2;
const IMAGE_WIDTH = SCREEN_WIDTH - SCREEN_H_PADDING - CARD_H_PADDING;

type PostCardProps = {
  profileImageUri?: string | null;
  name: string;
  age?: number | null;
  distance?: string | number | null;
  postImageUri?: string | null;
  caption: string;
  tags?: string[];
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  onLike?: () => void;
  onComment?: () => void;
};

const PLACEHOLDER = require('@/assets/images/logo.png');

export default function PostCard({
  profileImageUri,
  name,
  age,
  distance,
  postImageUri,
  caption,
  tags,
  likeCount = 0,
  commentCount = 0,
  likedByMe = false,
  onLike,
  onComment,
}: PostCardProps) {
  const { colors } = useTheme();
  const [imageHeight, setImageHeight] = useState<number | null>(null);
  const hasImage = !!postImageUri;

  useEffect(() => {
    if (!postImageUri) return;
    Image.getSize(
      postImageUri,
      (w, h) => setImageHeight(Math.round((h / w) * IMAGE_WIDTH)),
      () => setImageHeight(240),
    );
  }, [postImageUri]);

  const distanceLabel =
    distance != null
      ? typeof distance === 'number'
        ? distance >= 1000
          ? `${Math.round(distance / 1000)} km away`
          : `${Math.round(distance)} m away`
        : distance
      : null;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingTop: 12,
      paddingHorizontal: 12,
      paddingBottom: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text,
    },
    distanceText: {
      fontSize: 11,
      color: colors.subText,
      marginTop: 2,
    },
    postImage: {
      width: '100%',
      borderRadius: 14,
      marginBottom: 10,
      resizeMode: 'cover',
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hasImage ? 0 : 10,
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    countText: {
      fontSize: 13,
      color: colors.text,
      marginLeft: 4,
      fontWeight: '600',
    },
    caption: {
      marginTop: 10,
      fontSize: 13,
      lineHeight: 19,
      color: colors.text,
    },
    textOnlyCaption: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      marginBottom: 2,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
    },
    tagChip: {
      backgroundColor: colors.pinkBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginRight: 8,
      marginBottom: 8,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.pink,
    },
  });

  const actionsBar = (
    <View style={styles.actionsRow}>
      <View style={styles.leftActions}>
        <Pressable style={styles.iconButton} onPress={onLike}>
          <Ionicons
            name={likedByMe ? 'heart' : 'heart-outline'}
            size={22}
            color={likedByMe ? colors.pink : colors.text}
          />
          {likeCount > 0 && (
            <Text style={[styles.countText, likedByMe && { color: colors.pink }]}>
              {likeCount}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.iconButton} onPress={onComment}>
          <Feather name="message-circle" size={20} color={colors.text} />
          {commentCount > 0 && (
            <Text style={styles.countText}>{commentCount}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={profileImageUri ? { uri: profileImageUri } : PLACEHOLDER}
            style={styles.profileImage}
          />
          <View>
            <Text style={styles.nameText}>
              {name}{age ? `, ${age}` : ''}
            </Text>
            {distanceLabel && <Text style={styles.distanceText}>{distanceLabel}</Text>}
          </View>
        </View>
      </View>

      {hasImage ? (
        <>
          <Image
            source={{ uri: postImageUri! }}
            style={[styles.postImage, { height: imageHeight ?? 240 }]}
          />
          {actionsBar}
          <Text style={styles.caption}>
            <Text style={styles.nameText}>{name} </Text>
            {caption}
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.textOnlyCaption}>{caption}</Text>
          {tags && tags.length > 0 && (
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {actionsBar}
        </>
      )}

      {hasImage && tags && tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
