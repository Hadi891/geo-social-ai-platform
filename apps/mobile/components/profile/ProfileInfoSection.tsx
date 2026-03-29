import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ProfileInfoSectionProps = {
  fullName: string;
  age: number | null;
  location: string;
  bio: string;
  onEditPress: () => void;
};

export default function ProfileInfoSection({
  fullName,
  age,
  location,
  bio,
  onEditPress,
}: ProfileInfoSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.nameText}>
            {fullName || 'Your Name'}{age ? `,\n${age}` : ''}
          </Text>
        </View>

        <Pressable onPress={onEditPress} style={styles.editButton}>
          <Ionicons name="pencil" size={18} color="#B54FA0" />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#8B7A87" />
          <Text style={styles.locationText}>{location}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.bioText}>{bio}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '800',
    color: '#251D28',
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6E7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: '#8B7A87',
    marginLeft: 4,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#251D28',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#564A56',
  },
});