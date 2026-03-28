import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type StoryAvatarProps = {
  imageSource: ImageSourcePropType;
  name?: string;
  storyImages: ImageSourcePropType[];
  onOpenStories?: (images: ImageSourcePropType[]) => void;
};

export default function StoryAvatar({
  imageSource,
  name,
  storyImages,
  onOpenStories,
}: StoryAvatarProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={() => onOpenStories?.(storyImages)}
    >
      <View style={styles.outerRing}>
        <View style={styles.innerRing}>
          <Image source={imageSource} style={styles.image} />
        </View>
      </View>

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
    marginRight: 14,
    width: 68,
  },
  outerRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E95AAE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  innerRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    marginTop: 6,
    fontSize: 11,
    color: '#4B3F4E',
    textAlign: 'center',
  },
});