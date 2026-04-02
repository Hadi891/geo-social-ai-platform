import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { createPost, getUploadUrl, uploadToS3 } from '@repo/api';
import PostCard from '@/components/home/PostCard';

type AddPostModalProps = {
  visible: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  profileImageUri?: string | null;
};

export default function AddPostModal({
  visible,
  onClose,
  onPostCreated,
  profileImageUri,
}: AddPostModalProps) {
  const { getToken } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [tagInputs, setTagInputs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setImageUri(null);
      setCaption('');
      setTagInputs([]);
    }
  }, [visible]);

  const cleanTags = tagInputs.map((t) => t.trim()).filter(Boolean);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
  };

  const handleAddTag = () => {
    if (tagInputs.some((t) => t.trim() === '')) return;
    setTagInputs((prev) => [...prev, '']);
  };

  const handleChangeTag = (index: number, value: string) => {
    setTagInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveTag = (index: number) => {
    setTagInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const content = caption.trim();
    if (!content && !imageUri) {
      Alert.alert('Missing content', 'Please add a description or an image.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      let media_url: string | undefined;

      if (imageUri) {
        const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpeg';
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const { upload_url, key } = await getUploadUrl(token, 'posts', contentType);
        await uploadToS3(upload_url, imageUri, contentType);
        media_url = key;
      }

      await createPost(token, {
        content: content || undefined,
        media_url,
        tags: cleanTags.length > 0 ? cleanTags : undefined,
      });

      onClose();
      onPostCreated();
    } catch (err: any) {
      Alert.alert('Post failed', err.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Create Post</Text>

            <PostCard
              profileImageUri={profileImageUri}
              name="You"
              postImageUri={imageUri}
              caption={caption || 'Your post description will appear here...'}
              tags={cleanTags.length > 0 ? cleanTags : undefined}
            />

            <Pressable style={styles.pickButton} onPress={handlePickImage}>
              <Text style={styles.pickButtonText}>
                {imageUri ? 'Change image' : 'Choose image'}
              </Text>
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
            <View style={styles.tagsRow}>
              {tagInputs.map((tag, index) => (
                <View key={index} style={styles.tagInputWrapper}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Tag"
                    placeholderTextColor="#9B8F9D"
                    value={tag}
                    onChangeText={(v) => handleChangeTag(index, v)}
                    autoCapitalize="none"
                  />
                  <Pressable style={styles.removeTag} onPress={() => handleRemoveTag(index)}>
                    <Text style={styles.removeTagText}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addTagButton} onPress={handleAddTag}>
                <Text style={styles.addTagText}>+ Tag</Text>
              </Pressable>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.cancelButton} onPress={onClose} disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.addButton, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.addButtonText}>Add Post</Text>
                )}
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
    fontSize: 13,
    fontWeight: '700',
    color: '#2F2632',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tagInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7EC',
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 36,
  },
  tagInput: {
    minWidth: 60,
    maxWidth: 100,
    fontSize: 13,
    color: '#2F2632',
  },
  removeTag: {
    paddingLeft: 4,
  },
  removeTagText: {
    fontSize: 16,
    color: '#9B8F9D',
    lineHeight: 18,
  },
  addTagButton: {
    height: 36,
    borderRadius: 999,
    backgroundColor: '#F8E5F1',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagText: {
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
    backgroundColor: '#D3327C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
