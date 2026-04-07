import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import { NotificationActivity } from './types';

type Props = {
  visible: boolean;
  item: NotificationActivity | null;
  onClose: () => void;
  onMatch: (item: NotificationActivity) => void;
};

export default function MatchActionModal({
  visible,
  item,
  onClose,
  onMatch,
}: Props) {
  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image source={item.avatar} style={styles.avatar} />
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>Do you want to match with {item.name}?</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.matchButton]}
              onPress={() => onMatch(item)}
            >
              <Text style={styles.matchText}>Match</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F1F1F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F3F3',
  },
  matchButton: {
    backgroundColor: '#D85AAF',
  },
  cancelText: {
    color: '#333',
    fontWeight: '700',
  },
  matchText: {
    color: '#FFF',
    fontWeight: '800',
  },
});