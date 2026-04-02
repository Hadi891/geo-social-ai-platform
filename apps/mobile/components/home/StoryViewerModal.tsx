import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;
const SWIPE_DOWN_THRESHOLD = 80;
const SWIPE_DOWN_VELOCITY = 0.8;

export type StoryItem = {
  /** null for locally-picked images that haven't been uploaded yet */
  id: string | null;
  uri: string;
};

export type StoryGroup = {
  id: string;
  name: string;
  avatar: ImageSourcePropType | { uri: string } | null;
  items: StoryItem[];
};

type StoryViewerModalProps = {
  visible: boolean;
  groups: StoryGroup[];
  startGroupIndex?: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
};

export default function StoryViewerModal({
  visible,
  groups,
  startGroupIndex = 0,
  onClose,
  onStoryViewed,
}: StoryViewerModalProps) {
  const insets = useSafeAreaInsets();
  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [itemIndex, setItemIndex] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const dragY = useRef(new Animated.Value(0)).current;
  const bgOpacity = dragY.interpolate({
    inputRange: [0, SCREEN_HEIGHT * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const scale = dragY.interpolate({
    inputRange: [0, SCREEN_HEIGHT * 0.4],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        animRef.current?.stop();
      },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SWIPE_DOWN_THRESHOLD || g.vy > SWIPE_DOWN_VELOCITY) {
          Animated.timing(dragY, {
            toValue: SCREEN_HEIGHT,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            dragY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start(() => startProgress());
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
        }).start(() => startProgress());
      },
    })
  ).current;

  const currentGroup = groups[groupIndex];
  const items = currentGroup?.items ?? [];

  const startProgress = () => {
    progressAnim.setValue(0);
    animRef.current?.stop();
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) advanceForward();
    });
  };

  const advanceForward = () => {
    if (itemIndex < items.length - 1) {
      setItemIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setItemIndex(0);
    } else {
      onClose();
    }
  };

  const advanceBackward = () => {
    if (itemIndex > 0) {
      setItemIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setItemIndex(0);
    }
  };

  // Mark story as viewed whenever we land on a slide
  useEffect(() => {
    if (!visible) return;
    const storyId = items[itemIndex]?.id;
    if (storyId) onStoryViewed?.(storyId);
  }, [visible, groupIndex, itemIndex]);

  useEffect(() => {
    if (visible && items.length > 0) startProgress();
    return () => animRef.current?.stop();
  }, [visible, groupIndex, itemIndex]);

  useEffect(() => {
    if (visible) {
      setGroupIndex(startGroupIndex);
      setItemIndex(0);
      dragY.setValue(0);
    } else {
      animRef.current?.stop();
      progressAnim.setValue(0);
      dragY.setValue(0);
    }
  }, [visible, startGroupIndex]);

  if (!visible || !currentGroup || items.length === 0) return null;

  const currentItem = items[itemIndex];
  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const avatarSource = currentGroup.avatar ?? require('@/assets/images/logo.png');

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]} />

      <Animated.View
        style={[styles.container, { transform: [{ translateY: dragY }, { scale }] }]}
        {...panResponder.panHandlers}
      >
        {/* Full-screen story image */}
        <Image
          source={{ uri: currentItem.uri }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Top UI */}
        <View style={[styles.topUi, { paddingTop: insets.top + 10 }]}>
          <View style={styles.progressRow}>
            {items.map((_, i) => (
              <View key={i} style={styles.progressTrack}>
                {i < itemIndex ? (
                  <View style={[styles.progressFill, { width: '100%' }]} />
                ) : i === itemIndex ? (
                  <Animated.View style={[styles.progressFill, { width: barWidth }]} />
                ) : null}
              </View>
            ))}
          </View>

          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              <Image source={avatarSource as ImageSourcePropType} style={styles.headerAvatar} />
              <Text style={styles.username}>{currentGroup.name}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Tap zones */}
        <View style={styles.tapZones}>
          <Pressable style={styles.tapLeft} onPress={advanceBackward} />
          <Pressable style={styles.tapRight} onPress={advanceForward} />
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  topUi: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  tapZones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 2,
  },
});
