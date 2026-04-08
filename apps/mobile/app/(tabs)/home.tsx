import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import TopBar from '@/components/TopBar';
import StoryAvatar from '@/components/home/StoryAvatar';
import MyStoryAvatar from '@/components/home/MyStoryAvatar';
import PostCard from '@/components/home/PostCard';
import StoryViewerModal, { type StoryGroup, type StoryItem } from '@/components/home/StoryViewerModal';
import AddPostModal from '@/components/home/AddPostModal';
import CommentsModal from '@/components/home/CommentsModal';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  getPosts,
  likePost,
  unlikePost,
  getMyProfile,
  getStoriesFeed,
  getMyStories,
  createStory,
  markStoryViewed,
  getUploadUrl,
  uploadToS3,
  type Post,
  type Story,
} from '@repo/api';

import IntroversionScorePopup, {
  IntroversionQuestion,
} from '@/components/introversionScore/IntroversionScorePopup';
import introversionQuestions from '@/assets/introversion.json';
import IntroversionTestPrompt from '@/components/introversionScore/IntroversionTestPrompt';

const LOGO_IMAGE = require('@/assets/images/logo.png');
const PAGE_SIZE = 20;

export default function HomeScreen() {
  const { getToken } = useAuth();
  const { colors } = useTheme();

  // ── Posts ──────────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [addPostVisible, setAddPostVisible] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [myProfilePhotoUri, setMyProfilePhotoUri] = useState<string | null>(null);

  // ── Stories ────────────────────────────────────────────────────────────────
  const [feedStories, setFeedStories] = useState<Story[]>([]);
  const [myStoryItems, setMyStoryItems] = useState<StoryItem[]>([]);
  // Track which story IDs have been viewed in this session (to show grey ring)
  const viewedIdsRef = useRef<Set<string>>(new Set());
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [startGroupIndex, setStartGroupIndex] = useState(0);

  // ── Introversion score ────────────────────────────────────────────────────────
  const [isIntroversionPopupVisible, setIsIntroversionPopupVisible] = useState(false);
  const [hasDismissedIntroversionPrompt, setHasDismissedIntroversionPrompt] = useState(false);
  const shouldShowIntroversionPrompt = !hasDismissedIntroversionPrompt && !isIntroversionPopupVisible;

  // ── Fetch posts ────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (offset = 0, append = false) => {
    try {
      const token = await getToken();
      const res = await getPosts(token, { limit: PAGE_SIZE, offset });
      if (append) {
        setPosts((prev) => [...prev, ...res.posts]);
      } else {
        setPosts(res.posts);
      }
      setHasMore(res.posts.length >= PAGE_SIZE);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    }
  }, [getToken]);

  // ── Fetch stories ──────────────────────────────────────────────────────────
  const fetchStories = useCallback(async () => {
    try {
      const token = await getToken();
      const [feed, mine] = await Promise.all([
        getStoriesFeed(token),
        getMyStories(token),
      ]);
      setFeedStories(feed.stories);
      setMyStoryItems(mine.stories.map((s) => ({ id: s.id, uri: s.media_url ?? '' })));
    } catch (err) {
      console.error('Failed to fetch stories', err);
    }
  }, [getToken]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [, profile] = await Promise.all([
          fetchPosts(),
          getMyProfile(token),
        ]);
        setMyProfilePhotoUri(profile.profile_photo_url ?? null);
        await fetchStories();
      } catch (err) {
        console.error('Init error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchPosts, fetchStories, getToken]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(0, false), fetchStories()]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPosts(posts.length, true);
    setLoadingMore(false);
  };

  // ── Likes ──────────────────────────────────────────────────────────────────
  const handleLike = async (post: Post) => {
    const wasLiked = post.liked_by_me;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !wasLiked, like_count: wasLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    );
    try {
      const token = await getToken();
      if (wasLiked) await unlikePost(token, post.id);
      else await likePost(token, post.id);
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, liked_by_me: wasLiked, like_count: wasLiked ? p.like_count + 1 : p.like_count - 1 }
            : p
        )
      );
      console.error('Like failed', err);
    }
  };

  // ── Comments ───────────────────────────────────────────────────────────────
  const handleOpenComments = (postId: string) => {
    setCommentsPostId(postId);
    setCommentsVisible(true);
  };

  const handleCommentAdded = () => {
    if (commentsPostId) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === commentsPostId ? { ...p, comment_count: p.comment_count + 1 } : p
        )
      );
    }
  };

  // ── Story groups ───────────────────────────────────────────────────────────
  // Group feed stories by author
  const feedGroups = useMemo<StoryGroup[]>(() => {
    const grouped = new Map<string, StoryGroup>();
    for (const story of feedStories) {
      if (!story.author) continue;
      const authorId = story.author.id;
      if (!grouped.has(authorId)) {
        grouped.set(authorId, {
          id: authorId,
          name: story.author.name,
          avatar: story.author.profile_photo_url ? { uri: story.author.profile_photo_url } : LOGO_IMAGE,
          items: [],
        });
      }
      grouped.get(authorId)!.items.push({ id: story.id, uri: story.media_url ?? '' });
    }
    return Array.from(grouped.values());
  }, [feedStories]);

  const myStoryGroup = useMemo<StoryGroup>(() => ({
    id: 'me',
    name: 'Your story',
    avatar: myProfilePhotoUri ? { uri: myProfilePhotoUri } : LOGO_IMAGE,
    items: myStoryItems,
  }), [myProfilePhotoUri, myStoryItems]);

  // All groups for the viewer: my story first (only if I have stories), then feed
  const allStoryGroups = useMemo<StoryGroup[]>(() => {
    const groups: StoryGroup[] = [];
    if (myStoryItems.length > 0) groups.push(myStoryGroup);
    groups.push(...feedGroups);
    return groups;
  }, [myStoryGroup, feedGroups, myStoryItems]);

  const openStoryViewer = (groupId: string) => {
    const idx = allStoryGroups.findIndex((g) => g.id === groupId);
    setStartGroupIndex(idx >= 0 ? idx : 0);
    setStoryViewerVisible(true);
  };

  const handleStoryViewed = async (storyId: string) => {
    if (viewedIdsRef.current.has(storyId)) return;
    viewedIdsRef.current.add(storyId);
    try {
      const token = await getToken();
      await markStoryViewed(token, storyId);
    } catch {
      // non-critical
    }
  };

  // ── Add story ──────────────────────────────────────────────────────────────
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

    const asset = result.assets[0];
    const contentType = 'image/jpeg';

    try {
      const token = await getToken();
      const { upload_url, key } = await getUploadUrl(token, 'stories', contentType);
      await uploadToS3(upload_url, asset.uri, contentType);
      await createStory(token, { media_url: key, media_type: 'image' });
      // Optimistically add to local story items
      setMyStoryItems((prev) => [...prev, { id: null, uri: asset.uri }]);
    } catch (err) {
      Alert.alert('Failed to upload story', String(err));
    }
  };

  // ── Check if all stories from a group are viewed ───────────────────────────
  const isGroupAllSeen = (group: StoryGroup) =>
    group.items.every((item) => item.id === null || viewedIdsRef.current.has(item.id));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 14,
    },
    storiesScroll: {
      marginTop: 10,
      marginBottom: 10,
    },
    storiesRow: {
      paddingHorizontal: 4,
      paddingVertical: 8,
      alignItems: 'center',
    },
    addPostButton: {
      width: '100%',
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.pinkBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.pinkLight,
    },
    addPostButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.pink,
    },

    postsContent: {
      paddingBottom: 18,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 40,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.subText,
      marginTop: 6,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <TopBar title="Mingle Home" onLeftPress={() => router.navigate('/settings')} />
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Mingle Home" onLeftPress={() => router.navigate('/settings')} />

      <View style={styles.content}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.postsContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.pink} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesRow}
                style={styles.storiesScroll}
              >
                <MyStoryAvatar
                  imageSource={myProfilePhotoUri ? { uri: myProfilePhotoUri } : LOGO_IMAGE}
                  name="Your story"
                  storyImages={[]}
                  onOpenStories={myStoryItems.length > 0 ? () => openStoryViewer('me') : undefined}
                  onAddStory={handleAddStory}
                />

                {feedGroups.map((group) => (
                  <StoryAvatar
                    key={group.id}
                    imageSource={group.avatar ?? LOGO_IMAGE}
                    name={group.name}
                    storyImages={[]}
                    seen={isGroupAllSeen(group)}
                    onOpenStories={() => openStoryViewer(group.id)}
                  />
                ))}
              </ScrollView>

              <Pressable
                style={styles.addPostButton}
                onPress={() => setAddPostVisible(true)}
              >
                <Text style={styles.addPostButtonText}>+ Add a post</Text>
              </Pressable>


            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              profileImageUri={item.author.profile_photo_url}
              name={item.author.name ?? 'User'}
              age={item.author.age}
              distance={item.distance_m}
              postImageUri={item.media_url}
              caption={item.content ?? ''}
              tags={item.tags}
              likeCount={item.like_count}
              commentCount={item.comment_count}
              likedByMe={item.liked_by_me}
              onLike={() => handleLike(item)}
              onComment={() => handleOpenComments(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts nearby yet.</Text>
              <Text style={styles.emptySubtext}>Be the first to share something!</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.pink} style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      </View>

      <StoryViewerModal
        visible={storyViewerVisible}
        groups={allStoryGroups}
        startGroupIndex={startGroupIndex}
        onClose={() => setStoryViewerVisible(false)}
        onStoryViewed={handleStoryViewed}
      />

      <AddPostModal
        visible={addPostVisible}
        onClose={() => setAddPostVisible(false)}
        onPostCreated={() => fetchPosts(0, false)}
        profileImageUri={myProfilePhotoUri}
      />

      <CommentsModal
        visible={commentsVisible}
        postId={commentsPostId}
        onClose={() => setCommentsVisible(false)}
        onCommentAdded={handleCommentAdded}
      />

      <IntroversionTestPrompt
        visible={shouldShowIntroversionPrompt}
        onTakeIt={() => {
          setHasDismissedIntroversionPrompt(true);
          setIsIntroversionPopupVisible(true);
        }}
        onLater={() => {
          setHasDismissedIntroversionPrompt(true);
        }}
      />

      <IntroversionScorePopup
        visible={isIntroversionPopupVisible}
        onClose={() => setIsIntroversionPopupVisible(false)}
        questions={introversionQuestions as introversionQuestion[]}
      />
    </View>
  );
}
