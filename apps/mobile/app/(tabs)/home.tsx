import React, { useState } from 'react';
import {
  FlatList,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import TopBar from '@/components/TopBar';
import BottomNavBar from '@/components/BottomNavBar';
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

  const openStoryViewer = (images: ImageSourcePropType[]) => {
    setSelectedStoryImages(images);
    setStoryViewerVisible(true);
  };

  const closeStoryViewer = () => {
    setStoryViewerVisible(false);
    setSelectedStoryImages([]);
  };

  return (
    <View style={styles.container}>
      <TopBar />

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
                  imageSource={LOGO_IMAGE}
                  name="Me"
                  storyImages={[LOGO_IMAGE, LOGO_IMAGE]}
                  onOpenStories={openStoryViewer}
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

      <BottomNavBar activeTab="home" />

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