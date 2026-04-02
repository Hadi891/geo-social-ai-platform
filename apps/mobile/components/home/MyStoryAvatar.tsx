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
  onOpenStories?: () => void;
  onAddStory?: () => void;
};

export default function MyStoryAvatar({
  imageSource,
  name = 'Your story',
  storyImages: _storyImages,
  onOpenStories,
  onAddStory,
}: MyStoryAvatarProps) {
  const handlePress = () => {
    Alert.alert('Your Story', 'Choose an option', [
      { text: 'View story', onPress: () => onOpenStories?.() },
      { text: 'Add to story', onPress: () => onAddStory?.() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <View style={styles.avatarWrapper}>
        <Image source={imageSource} style={styles.image} />
        <View style={styles.plusBadge}>
          <Ionicons name="add" size={14} color="#FFFFFF" />
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
    marginRight: 16,
    width: 72,
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: '#DBDBDB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  image: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  plusBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0095F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    marginTop: 5,
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
  },
});
