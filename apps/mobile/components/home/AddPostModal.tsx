import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import PostCard from '@/components/home/PostCard';

type AddPostModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (post: {
    postImageSource: ImageSourcePropType;
    caption: string;
    tags: string[];
  }) => void;
  profileImageSource: ImageSourcePropType;
};

const DEFAULT_POST_IMAGE = require('@/assets/images/logo.png');

export default function AddPostModal({
  visible,
  onClose,
  onSubmit,
  profileImageSource,
}: AddPostModalProps) {
  const [postImageSource, setPostImageSource] =
    useState<ImageSourcePropType>(DEFAULT_POST_IMAGE);
  const [caption, setCaption] = useState('');
  const [tagInputs, setTagInputs] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setPostImageSource(DEFAULT_POST_IMAGE);
      setCaption('');
      setTagInputs([]);
    }
  }, [visible]);

  const previewTags = useMemo(() => {
    return tagInputs.map((tag) => tag.trim()).filter(Boolean);
  }, [tagInputs]);

  const handlePickImage = async () => {
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

    setPostImageSource({
      uri: result.assets[0].uri,
    });
  };

  const handleAddTagField = () => {
    const hasEmptyTag = tagInputs.some((tag) => tag.trim() === '');

    if (hasEmptyTag) return;

    setTagInputs((prev) => [...prev, '']);
  };

  const handleChangeTag = (index: number, value: string) => {
    setTagInputs((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSubmit = () => {
    const cleanCaption = caption.trim();
    const cleanTags = tagInputs.map((tag) => tag.trim()).filter(Boolean);

    if (!cleanCaption) {
      Alert.alert('Missing description', 'Please add a description.');
      return;
    }

    onSubmit({
      postImageSource,
      caption: cleanCaption,
      tags: cleanTags,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Create Post</Text>

            <PostCard
              profileImageSource={profileImageSource}
              name="You"
              distance={0}
              postImageSource={postImageSource}
              caption={caption || 'Your post description will appear here...'}
              tags={previewTags.length ? previewTags : ['Tag 1', 'Tag 2']}
            />

            <Pressable style={styles.pickButton} onPress={handlePickImage}>
              <Text style={styles.pickButtonText}>Choose image</Text>
            </Pressable>

            <TextInput
              style={[styles.input, styles.captionInput]}
              placeholder="Write a description..."
              placeholderTextColor="#9B8F9D"
              multiline
              value={caption}
              onChangeText={setCaption}
            />

            <Text style={styles.tagsLabel}>Tags</Text>

            <View style={styles.tagsEditor}>
              {tagInputs.map((tag, index) => (
                <TextInput
                  key={index}
                  style={styles.tagInput}
                  placeholder="Tag"
                  placeholderTextColor="#9B8F9D"
                  value={tag}
                  onChangeText={(value) => handleChangeTag(index, value)}
                />
              ))}

              <Pressable style={styles.addTagButton} onPress={handleAddTagField}>
                <Text style={styles.addTagButtonText}>+ Tag</Text>
              </Pressable>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.addButton} onPress={handleSubmit}>
                <Text style={styles.addButtonText}>Add Post</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: '#FCF9FC',
    borderRadius: 22,
    padding: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2632',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8E5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pickButtonText: {
    color: '#C44A93',
    fontWeight: '700',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7EC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2F2632',
    marginBottom: 10,
  },
  captionInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F2632',
    marginBottom: 8,
  },
  tagsEditor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagInput: {
    minWidth: 80,
    maxWidth: 120,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7EC',
    paddingHorizontal: 12,
    color: '#2F2632',
    fontSize: 13,
    marginRight: 8,
    marginBottom: 8,
  },
  addTagButton: {
    height: 38,
    borderRadius: 999,
    backgroundColor: '#F8E5F1',
    borderWidth: 1,
    borderColor: '#EFD4E4',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  addTagButtonText: {
    color: '#C44A93',
    fontWeight: '700',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEE8EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#5F5361',
    fontWeight: '700',
  },
  addButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D85AAF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});