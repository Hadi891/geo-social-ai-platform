import React, { useEffect, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type StoryViewerModalProps = {
  visible: boolean;
  images: ImageSourcePropType[];
  onClose: () => void;
};

const STORY_DURATION = 5000;

export default function StoryViewerModal({
  visible,
  images,
  onClose,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setCurrentIndex(0);
      return;
    }

    if (images.length === 0) return;

    const timer = setTimeout(() => {
      if (currentIndex < images.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, STORY_DURATION);

    return () => clearTimeout(timer);
  }, [visible, currentIndex, images, onClose]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
    }
  }, [visible, images]);

  if (!images.length) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>

            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <Image source={images[currentIndex]} style={styles.image} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: '92%',
    alignItems: 'center',
  },
  topRow: {
    width: '100%',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 520,
    borderRadius: 20,
    resizeMode: 'cover',
    backgroundColor: '#222',
  },
});