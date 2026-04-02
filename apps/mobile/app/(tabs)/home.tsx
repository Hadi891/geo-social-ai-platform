import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  ImageSourcePropType,
  Pressable,
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
import AddPostModal from '@/components/home/AddPostModal';

// INTROSION SCORE RELATED
import IntrusionScorePopup, {
  IntrusionQuestion,
} from '@/components/intrusionScore/IntrusionScorePopup';
import intrusionQuestions from '@/assets/intrusion.json';
import IntrusionTestPrompt from '@/components/intrusionScore/IntrusionTestPrompt';


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

const initialPosts = [
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

  const [allPosts, setAllPosts] = useState(initialPosts);
  const [addPostVisible, setAddPostVisible] = useState(false);

// INTROSION SCORE RELATED
  const SHOW_INTRUSION_CALCULATOR = true;
  const [isIntrusionPopupVisible, setIsIntrusionPopupVisible] = useState(false);
  const SHOW_INTRUSION_PROMPT = true;
  const [hasDismissedIntrusionPrompt, setHasDismissedIntrusionPrompt] =
    useState(false);

  const shouldShowIntrusionPrompt =
    SHOW_INTRUSION_PROMPT &&
    !hasDismissedIntrusionPrompt &&
    !isIntrusionPopupVisible;


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

  const handleAddPost = (newPost: {
    postImageSource: ImageSourcePropType;
    caption: string;
    tags: string[];
  }) => {
    setAllPosts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: 'You',
        age: 22,
        distance: 0,
        profileImageSource: LOGO_IMAGE,
        postImageSource: newPost.postImageSource,
        caption: newPost.caption,
        tags: newPost.tags,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TopBar title="Mingle Home" />

      <View style={styles.content}>
        <FlatList
          data={allPosts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsContent}
          ListHeaderComponent={
            <View>
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

              <Pressable
                style={styles.addPostButton}
                onPress={() => setAddPostVisible(true)}
              >
                <Text style={styles.addPostButtonText}>+ Add a post</Text>
              </Pressable>


               {/*INTROSION RELATED*/}
              {SHOW_INTRUSION_CALCULATOR && (
                <Pressable
                  style={styles.intrusionButton}
                  onPress={() => setIsIntrusionPopupVisible(true)}
                >
                  <Text style={styles.intrusionButtonText}>Calculate intrusion score</Text>
                </Pressable>
              )}
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

      <AddPostModal
        visible={addPostVisible}
        onClose={() => setAddPostVisible(false)}
        onSubmit={handleAddPost}
        profileImageSource={LOGO_IMAGE}
      />



{/*INTROSION RELATED*/}
<IntrusionTestPrompt
  visible={shouldShowIntrusionPrompt}
  onTakeIt={() => {
    setHasDismissedIntrusionPrompt(true);
    setIsIntrusionPopupVisible(true);
  }}
  onLater={() => {
    setHasDismissedIntrusionPrompt(true);
  }}
/>

      {SHOW_INTRUSION_CALCULATOR && (
        <IntrusionScorePopup
          visible={isIntrusionPopupVisible}
          onClose={() => setIsIntrusionPopupVisible(false)}
          questions={intrusionQuestions as IntrusionQuestion[]}
        />
      )}

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
  addPostButton: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8E5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFD4E4',
  },
  addPostButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C44A93',
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

  // INTROSION SCORE RELATED
  intrusionButton: {
    width: '100%',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D85AAF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },

  intrusionButtonText: {
    color: '#D85AAF',
    fontSize: 15,
    fontWeight: '800',
  },
});