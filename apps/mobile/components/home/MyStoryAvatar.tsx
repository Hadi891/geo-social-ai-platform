import React from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type MyStoryAvatarProps = {
  imageSource: ImageSourcePropType;
  name?: string;
  storyImages: ImageSourcePropType[];
  onOpenStories?: (images: ImageSourcePropType[]) => void;
  onAddStory?: () => void;
};

export default function MyStoryAvatar({
  imageSource,
  name = 'Me',
  storyImages,
  onOpenStories,
  onAddStory,
}: MyStoryAvatarProps) {
  const handlePress = () => {
    Alert.alert(
      'Your story',
      'Choose an option',
      [
        {
          text: 'View story',
          onPress: () => onOpenStories?.(storyImages),
        },
        {
          text: 'Add story',
          onPress: () => onAddStory?.(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.outerRing}>
        <View style={styles.innerRing}>
          <Image source={imageSource} style={styles.image} />

          <View style={styles.plusBadge}>
            <Ionicons name="add" size={12} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
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
    position: 'relative',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  plusBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E95AAE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    marginTop: 6,
    fontSize: 11,
    color: '#4B3F4E',
    textAlign: 'center',
  },
});