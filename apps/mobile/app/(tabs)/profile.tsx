import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ImageSourcePropType,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
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

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string;
  bio: string;
  interests: string[];
  birthDate: string;
  email: string;
  phone?: string;
  profileImage: string | number;
  matches: number;
  friends: number;
  intrusionScore: number;
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

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  const [month, day, year] = parts;
  const today = new Date();

  let age = today.getFullYear() - year;

  const hadBirthdayThisYear =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const getDisplayName = (firstName: string, lastName: string) =>
  [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const getImageSource = (
  image: string | number
): ImageSourcePropType =>
  typeof image === 'string' ? { uri: image } : image;

const SAMPLE_PROFILE: UserProfile = {
  id: '1',
  firstName: 'Mohamad',
  lastName: 'Ibrahim',
  age: calculateAgeFromBirthDate('11/07/2003') ?? 22,
  location: 'Paris, Gif-Sur-Yvette',
  bio: 'Digital curator and espresso enthusiast. Looking for someone who can debate the merits of vinyl over digital and enjoys late-night walks through the city. ☕️🎶',
  interests: ['Tennis', 'Hiking', 'Basket', 'Eating', 'Eating Again'],
  birthDate: '11/07/2003',
  email: 'mohamad.ibrahim@telecom-paris.fr',
  profileImage: require('@/assets/images/logo.png'),
  matches: 2,
  friends: 200,
  intrusionScore: 40,
};

export default function ProfileScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const [editSectionY, setEditSectionY] = useState(0);
  const [showEditSection, setShowEditSection] = useState(false);
  const [shouldScrollToEdit, setShouldScrollToEdit] = useState(false);

  const [profile, setProfile] = useState<UserProfile>(SAMPLE_PROFILE);

  const [editableProfile, setEditableProfile] = useState<EditableProfileFields>({
    firstName: SAMPLE_PROFILE.firstName,
    lastName: SAMPLE_PROFILE.lastName,
    birthDate: SAMPLE_PROFILE.birthDate,
    email: SAMPLE_PROFILE.email,
    bio: SAMPLE_PROFILE.bio,
    profileImage: SAMPLE_PROFILE.profileImage,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const displayedAge =
    calculateAgeFromBirthDate(profile.birthDate) ?? profile.age;

  const handleEditSectionLayout = (event: LayoutChangeEvent) => {
    setEditSectionY(event.nativeEvent.layout.y);
  };

  const handleEditPress = () => {
    setShowEditSection(true);
    setShouldScrollToEdit(true);
  };

  useEffect(() => {
    if (!showEditSection || !shouldScrollToEdit || editSectionY <= 0) return;

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(editSectionY - 12, 0),
        animated: true,
      });
      setShouldScrollToEdit(false);
    }, 80);

    return () => clearTimeout(timer);
  }, [showEditSection, shouldScrollToEdit, editSectionY]);

  const handleFieldChange = (
    field: keyof EditableProfileFields,
    value: string
  ) => {
    setEditableProfile((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === 'firstName') {
      setFormErrors((prev) => ({
        ...prev,
        firstName: value.trim() ? undefined : prev.firstName,
      }));
    }
  };

  const handlePickProfileImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo library access to change the profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setEditableProfile((prev) => ({
        ...prev,
        profileImage: result.assets[0].uri,
      }));
    }
  };

  const handleSaveChanges = () => {
    const trimmedFirstName = editableProfile.firstName.trim();
    const trimmedLastName = editableProfile.lastName.trim();

    if (!trimmedFirstName) {
      setFormErrors({
        firstName: 'First name is required.',
      });
      return;
    }

    const nextAge =
      calculateAgeFromBirthDate(editableProfile.birthDate) ?? profile.age;

    const updatedProfile: UserProfile = {
      ...profile,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      birthDate: editableProfile.birthDate,
      email: editableProfile.email.trim(),
      bio: editableProfile.bio,
      profileImage: editableProfile.profileImage,
      age: nextAge,
    };

    setProfile(updatedProfile);
    setEditableProfile({
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
      birthDate: updatedProfile.birthDate,
      email: updatedProfile.email,
      bio: updatedProfile.bio,
      profileImage: updatedProfile.profileImage,
    });
    setFormErrors({});
    setShowEditSection(false);
  };

  const handleCancel = () => {
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
    router.replace('/');
  };

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
          friends={profile.friends}
          intrusionScore={profile.intrusionScore}
        />

        <ProfileInfoSection
          fullName={getDisplayName(profile.firstName, profile.lastName)}
          age={displayedAge}
          location={profile.location}
          bio={profile.bio}
          relationshipLabel="Following"
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
});