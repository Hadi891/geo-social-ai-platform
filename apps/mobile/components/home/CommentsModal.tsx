import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { getComments, addComment, type Comment } from '@repo/api';

const PLACEHOLDER = require('@/assets/images/logo.png');

type CommentsModalProps = {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
  onCommentAdded?: () => void;
};

export default function CommentsModal({
  visible,
  postId,
  onClose,
  onCommentAdded,
}: CommentsModalProps) {
  const { getToken } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    }
    if (!visible) {
      setComments([]);
      setText('');
    }
  }, [visible, postId]);

  const loadComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await getComments(token, postId);
      setComments(res.comments);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !postId || sending) return;
    setSending(true);
    try {
      const token = await getToken();
      await addComment(token, postId, content);
      setText('');
      await loadComments();
      onCommentAdded?.();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Comments</Text>

          {loading ? (
            <ActivityIndicator size="small" color="#D3327C" style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Image
                    source={
                      item.author.profile_photo_url
                        ? { uri: item.author.profile_photo_url }
                        : PLACEHOLDER
                    }
                    style={styles.avatar}
                  />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentAuthor}>
                      {item.author.name ?? 'User'}
                      <Text style={styles.commentTime}> · {formatTime(item.created_at)}</Text>
                    </Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor="#9B8F9D"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendButton, (!text.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FCF9FC',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0C8D3',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2632',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9B8F9D',
    fontSize: 14,
    marginTop: 30,
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 16,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginTop: 2,
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F2632',
  },
  commentTime: {
    fontWeight: '400',
    color: '#9B8F9D',
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    color: '#433847',
    lineHeight: 19,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFE7EC',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7EC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2F2632',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D3327C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
