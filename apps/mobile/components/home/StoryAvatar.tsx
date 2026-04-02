import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type StoryAvatarProps = {
  imageSource: ImageSourcePropType;
  name?: string;
  storyImages: ImageSourcePropType[];
  seen?: boolean;
  onOpenStories?: () => void;
};

export default function StoryAvatar({
  imageSource,
  name,
  storyImages: _storyImages,
  seen = false,
  onOpenStories,
}: StoryAvatarProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={() => onOpenStories?.()}
    >
      {seen ? (
        <View style={styles.seenRing}>
          <View style={styles.avatarWrapper}>
            <Image source={imageSource} style={styles.image} />
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={['#D3327C', '#EF5873', '#F89855']}
          start={{ x: 0.0, y: 1.0 }}
          end={{ x: 1.0, y: 0.0 }}
          style={styles.gradientRing}
        >
          <View style={styles.avatarWrapper}>
            <Image source={imageSource} style={styles.image} />
          </View>
        </LinearGradient>
      )}

      {name ? (
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  gradientRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  seenRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderWidth: 2,
    borderColor: '#C8C8C8',
  },
  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  image: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  name: {
    marginTop: 5,
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
  },
});
