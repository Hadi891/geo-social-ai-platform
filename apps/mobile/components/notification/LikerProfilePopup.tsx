import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LikerProfile } from '@repo/api';

const LOGO = require('@/assets/images/logo.png');

type Props = {
  visible: boolean;
  loading: boolean;
  profile: LikerProfile | null;
  onPass: () => void;
  onLike: () => void;
  onClose: () => void;
};

function formatDistance(meters: number | null): string {
  if (meters == null) return 'Unknown distance';
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
}

export default function LikerProfilePopup({ visible, loading, profile, onPass, onLike, onClose }: Props) {
  const avatarSource = profile?.avatar_url ? { uri: profile.avatar_url } : LOGO;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          {loading || !profile ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#D85AAF" />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {/* Avatar */}
              <View style={styles.avatarBox}>
                <Image source={avatarSource} style={styles.avatar} />
              </View>

              {/* Name + age */}
              <Text style={styles.nameText}>
                {profile.name ?? 'User'}{profile.age ? `, ${profile.age}` : ''}
              </Text>

              {/* Distance */}
              <Text style={styles.distanceText}>
                {formatDistance(profile.distance_m)}
              </Text>

              {/* Compatibility */}
              <View style={styles.compatRow}>
                <Ionicons name="heart" size={16} color="#D85AAF" />
                <Text style={styles.compatText}>
                  {profile.compatibility}% compatibility
                </Text>
              </View>

              {/* Common interests */}
              {profile.common_interests.length > 0 && (
                <View style={styles.interestsSection}>
                  <Text style={styles.interestsTitle}>Common Interests</Text>
                  <View style={styles.tagsRow}>
                    {profile.common_interests.map((i) => (
                      <View key={i} style={[styles.tag, styles.tagCommon]}>
                        <Text style={styles.tagCommonText}>{i}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Other interests */}
              {profile.other_interests.length > 0 && (
                <View style={styles.interestsSection}>
                  <Text style={styles.interestsTitle}>Other Interests</Text>
                  <View style={styles.tagsRow}>
                    {profile.other_interests.map((i) => (
                      <View key={i} style={[styles.tag, styles.tagOther]}>
                        <Text style={styles.tagOtherText}>{i}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Bio */}
              {profile.bio ? (
                <Text style={styles.bioText}>{profile.bio}</Text>
              ) : null}

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <Pressable style={styles.passBtn} onPress={onPass}>
                  <Ionicons name="close" size={20} color="#888" />
                  <Text style={styles.passBtnText}>PASS</Text>
                </Pressable>

                <Pressable style={styles.likeBtn} onPress={onLike}>
                  <Ionicons name="heart" size={20} color="#FFF" />
                  <Text style={styles.likeBtnText}>LIKE</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 16,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  avatarBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#D85AAF',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E1A1D',
  },
  distanceText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  compatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#FFF0F7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  compatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D85AAF',
  },
  interestsSection: {
    width: '100%',
    marginTop: 18,
  },
  interestsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagCommon: {
    backgroundColor: '#F7D7EB',
  },
  tagCommonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C05AA8',
  },
  tagOther: {
    backgroundColor: '#F0F0F0',
  },
  tagOtherText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  bioText: {
    marginTop: 18,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 28,
    width: '100%',
  },
  passBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  passBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888',
  },
  likeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#D85AAF',
  },
  likeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
