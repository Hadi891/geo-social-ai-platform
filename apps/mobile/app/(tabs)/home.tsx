import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import TopBar from '@/components/TopBar';
import StoryAvatar from '@/components/home/StoryAvatar';
import MyStoryAvatar from '@/components/home/MyStoryAvatar';
import PostCard from '@/components/home/PostCard';
import StoryViewerModal from '@/components/home/StoryViewerModal';

const LOGO_IMAGE = require('@/assets/images/logo.png');

const stories = [
  {
    id: '1',
    name: 'Sarah',
    imageSource: LOGO_IMAGE,
    storyImages: [LOGO_IMAGE, LOGO_IMAGE],
  },
  {
    id: '2',
    name: 'Marcus',
    imageSource: LOGO_IMAGE,
    storyImages: [LOGO_IMAGE],
  },
  {
    id: '3',
    name: 'Chloe',
    imageSource: LOGO_IMAGE,
    storyImages: [LOGO_IMAGE, LOGO_IMAGE, LOGO_IMAGE],
  },
  {
    id: '4',
    name: 'David',
    imageSource: LOGO_IMAGE,
    storyImages: [LOGO_IMAGE],
  },
];

const posts = [
  {
    id: '1',
    name: 'Amelia',
    age: 24,
    distance: 2,
    profileImageSource: LOGO_IMAGE,
    postImageSource: LOGO_IMAGE,
    caption: 'Looking for someone who can keep up with my energy...',
    tags: ['Architecture', 'Solo'],
  },
  {
    id: '2',
    name: 'Elena',
    age: 26,
    distance: 5,
    profileImageSource: LOGO_IMAGE,
    postImageSource: LOGO_IMAGE,
    caption: 'Always looking for a new canvas or a good coffee spot.',
    tags: ['Art', 'Coffee'],
  },
  {
    id: '3',
    name: 'Karen',
    age: 22,
    distance: 20,
    profileImageSource: LOGO_IMAGE,
    postImageSource: LOGO_IMAGE,
    caption: 'Always looking for problems.',
    tags: ['Problems', 'IGR'],
  },
];

export default function HomeScreen() {
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryImages, setSelectedStoryImages] = useState<ImageSourcePropType[]>([]);
  const [myStoryImages, setMyStoryImages] = useState<ImageSourcePropType[]>([
    LOGO_IMAGE,
    LOGO_IMAGE,
  ]);

  const openStoryViewer = (images: ImageSourcePropType[]) => {
    setSelectedStoryImages(images);
    setStoryViewerVisible(true);
  };

  const closeStoryViewer = () => {
    setStoryViewerVisible(false);
    setSelectedStoryImages([]);
  };

  const handleAddStory = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled) return;

    const pickedImage: ImageSourcePropType = {
      uri: result.assets[0].uri,
    };

    setMyStoryImages((prev) => [...prev, pickedImage]);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Mingle Home" />

      <View style={styles.content}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsContent}
          ListHeaderComponent={
            <View style={styles.storiesContainer}>
              <View style={styles.storiesHeader}>
                <Text style={styles.sectionTitle}>New Matches</Text>
                <Text style={styles.seeAll}>SEE ALL</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesRow}
              >
                <MyStoryAvatar
                  imageSource={myStoryImages[myStoryImages.length - 1]}
                  name="Your story"
                  storyImages={myStoryImages}
                  onOpenStories={openStoryViewer}
                  onAddStory={handleAddStory}
                />

                {stories.map((story) => (
                  <StoryAvatar
                    key={story.id}
                    imageSource={story.imageSource}
                    name={story.name}
                    storyImages={story.storyImages}
                    onOpenStories={openStoryViewer}
                  />
                ))}
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              profileImageSource={item.profileImageSource}
              name={item.name}
              age={item.age}
              distance={item.distance}
              postImageSource={item.postImageSource}
              caption={item.caption}
              tags={item.tags}
            />
          )}
        />
      </View>

      <StoryViewerModal
        visible={storyViewerVisible}
        images={selectedStoryImages}
        onClose={closeStoryViewer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9FC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
  },
  storiesContainer: {
    backgroundColor: '#FEFEFE',
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7EC',
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storiesRow: {
    paddingTop: 12,
  },
  postsContent: {
    paddingBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2632',
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C44A93',
  },
});