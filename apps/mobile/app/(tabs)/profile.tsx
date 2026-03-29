import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageSourcePropType,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import TopBar from '@/components/TopBar';
import ProfileHeaderCard from '@/components/profile/ProfileHeaderCard';
import ProfileInfoSection from '@/components/profile/ProfileInfoSection';
import InterestChips from '@/components/profile/InterestChips';
import EditProfileSection from '@/components/profile/EditProfileSection';
import LogoutButton from '@/components/profile/LogoutButton';
import { useAuth } from '@/context/AuthContext';
import * as Location from 'expo-location';
import { getMyProfile, createUserProfile, getUploadUrl, uploadToS3, saveProfilePhoto, getMyLocation } from '@repo/api';

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  age: number | null;
  location: string;
  bio: string;
  interests: string[];
  birthDate: string;
  email: string;
  profileImage: string | number;
  matches: number;
};

type EditableProfileFields = Pick<
  UserProfile,
  'firstName' | 'lastName' | 'birthDate' | 'email' | 'bio' | 'profileImage'
>;

type FormErrors = {
  firstName?: string;
};

const calculateAgeFromBirthDate = (birthDate: string) => {
  const parts = birthDate.split('/').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [month, day, year] = parts;
  const today = new Date();
  let age = today.getFullYear() - year;
  const hadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hadBirthday) age -= 1;
  return age >= 0 ? age : null;
};

const splitName = (name: string | null) => {
  if (!name) return { firstName: '', lastName: '' };
  const parts = name.trim().split(' ');
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') };
};

const getDisplayName = (firstName: string, lastName: string) =>
  [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const getImageSource = (image: string | number): ImageSourcePropType =>
  typeof image === 'string' ? { uri: image } : image;

export default function ProfileScreen() {
  const { getToken, doSignOut } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editSectionY, setEditSectionY] = useState(0);
  const [showEditSection, setShowEditSection] = useState(false);
  const [shouldScrollToEdit, setShouldScrollToEdit] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editableProfile, setEditableProfile] = useState<EditableProfileFields>({
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    bio: '',
    profileImage: require('@/assets/images/logo.png'),
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const [data, locationData] = await Promise.all([
        getMyProfile(token),
        getMyLocation(token).catch(() => null),
      ]);

      let locationLabel = '';
      if (locationData) {
        try {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          });
          locationLabel = [geo?.city, geo?.country].filter(Boolean).join(', ');
        } catch {
          locationLabel = `${locationData.latitude.toFixed(2)}, ${locationData.longitude.toFixed(2)}`;
        }
      }

      const { firstName, lastName } = splitName(data.name);
      const profileImage: string | number = data.profile_photo_url
        ? { uri: data.profile_photo_url } as any
        : require('@/assets/images/logo.png');

      const loaded: UserProfile = {
        id: data.id,
        firstName,
        lastName,
        age: data.age ?? null,
        location: locationLabel,
        bio: data.bio ?? '',
        interests: data.interests ?? [],
        birthDate: '',
        email: data.email,
        profileImage,
        matches: 0,
      };
      setProfile(loaded);
      setEditableProfile({
        firstName: loaded.firstName,
        lastName: loaded.lastName,
        birthDate: loaded.birthDate,
        email: loaded.email,
        bio: loaded.bio,
        profileImage: loaded.profileImage,
      });
    } catch (e: any) {
      setError(e.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!showEditSection || !shouldScrollToEdit || editSectionY <= 0) return;
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: Math.max(editSectionY - 12, 0), animated: true });
      setShouldScrollToEdit(false);
    }, 80);
    return () => clearTimeout(timer);
  }, [showEditSection, shouldScrollToEdit, editSectionY]);

  const handleEditSectionLayout = (event: LayoutChangeEvent) => {
    setEditSectionY(event.nativeEvent.layout.y);
  };

  const handleEditPress = () => {
    setShowEditSection(true);
    setShouldScrollToEdit(true);
  };

  const handleFieldChange = (field: keyof EditableProfileFields, value: string) => {
    setEditableProfile((prev) => ({ ...prev, [field]: value }));
    if (field === 'firstName') {
      setFormErrors((prev) => ({ ...prev, firstName: value.trim() ? undefined : prev.firstName }));
    }
  };

  const handlePickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to change the profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setEditableProfile((prev) => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const handleSaveChanges = async () => {
    const trimmedFirstName = editableProfile.firstName.trim();
    const trimmedLastName = editableProfile.lastName.trim();

    if (!trimmedFirstName) {
      setFormErrors({ firstName: 'First name is required.' });
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();

      // Upload photo to S3 if a new one was picked (string = local URI from picker)
      let photoUrl: string | null = null;
      if (typeof editableProfile.profileImage === 'string') {
        const { upload_url, key } = await getUploadUrl(token, 'profile-images', 'image/jpeg');
        await uploadToS3(upload_url, editableProfile.profileImage, 'image/jpeg');
        await saveProfilePhoto(token, key);
        photoUrl = key;
      }

      const age = calculateAgeFromBirthDate(editableProfile.birthDate) ?? profile?.age ?? undefined;
      const name = [trimmedFirstName, trimmedLastName].filter(Boolean).join(' ');

      await createUserProfile(token, {
        name,
        age,
        bio: editableProfile.bio || undefined,
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              firstName: trimmedFirstName,
              lastName: trimmedLastName,
              birthDate: editableProfile.birthDate,
              email: editableProfile.email.trim(),
              bio: editableProfile.bio,
              profileImage: photoUrl ?? editableProfile.profileImage,
              age: age ?? prev.age,
            }
          : prev
      );
      setFormErrors({});
      setShowEditSection(false);
    } catch (e: any) {
      Alert.alert('Save failed', e.message ?? 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setEditableProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthDate: profile.birthDate,
      email: profile.email,
      bio: profile.bio,
      profileImage: profile.profileImage,
    });
    setFormErrors({});
    setShowEditSection(false);
  };

  const handleLogout = () => {
    doSignOut();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopBar title="Mingle Profile" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C57C8" />
        </View>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.container}>
        <TopBar title="Mingle Profile" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        </View>
      </View>
    );
  }

  const displayedAge = calculateAgeFromBirthDate(profile.birthDate) ?? profile.age ?? null;

  return (
    <View style={styles.container}>
      <TopBar title="Mingle Profile" />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <ProfileHeaderCard
          imageSource={getImageSource(profile.profileImage)}
          matches={profile.matches}
        />

        <ProfileInfoSection
          fullName={getDisplayName(profile.firstName, profile.lastName)}
          age={displayedAge}
          location={profile.location}
          bio={profile.bio}
          onEditPress={handleEditPress}
        />

        <InterestChips interests={profile.interests} />

        {showEditSection && (
          <View onLayout={handleEditSectionLayout}>
            <EditProfileSection
              imageSource={getImageSource(editableProfile.profileImage)}
              values={editableProfile}
              errors={formErrors}
              onChangeField={handleFieldChange}
              onChangeProfileImage={handlePickProfileImage}
              onSave={handleSaveChanges}
              onCancel={handleCancel}
              saving={saving}
            />
          </View>
        )}

        <LogoutButton onPress={handleLogout} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9FC',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 140,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#D93025',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
