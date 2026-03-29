import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ProfileField from './ProfileField';
import ProfileActionButtons from './ProfileActionButtons';

type EditValues = {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  bio: string;
  profileImage: string | number;
};

type FormErrors = {
  firstName?: string;
};

type EditProfileSectionProps = {
  imageSource: ImageSourcePropType;
  values: EditValues;
  errors: FormErrors;
  onChangeField: (field: keyof EditValues, value: string) => void;
  onChangeProfileImage: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
};

export default function EditProfileSection({
  imageSource,
  values,
  errors,
  onChangeField,
  onChangeProfileImage,
  onSave,
  onCancel,
  saving,
}: EditProfileSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.photoRow}>
        <Image source={imageSource} style={styles.avatar} />
        <View style={styles.photoTextWrap}>
          <Text style={styles.photoTitle}>Change Profile Photo</Text>
          <Text style={styles.photoCaption}>
            Choose a new image from your gallery.
          </Text>

          <Pressable style={styles.photoButton} onPress={onChangeProfileImage}>
            <Text style={styles.photoButtonText}>Choose Photo</Text>
          </Pressable>
        </View>
      </View>

      <ProfileField
        label="First Name"
        value={values.firstName}
        onChangeText={(value) => onChangeField('firstName', value)}
        placeholder="Enter first name"
        error={errors.firstName}
      />

      <ProfileField
        label="Last Name"
        value={values.lastName}
        onChangeText={(value) => onChangeField('lastName', value)}
        placeholder="Enter last name"
      />

      <ProfileField
        label="Birth Date"
        value={values.birthDate}
        onChangeText={(value) => onChangeField('birthDate', value)}
        placeholder="MM/DD/YYYY"
      />

      <ProfileField
        label="Email Address"
        value={values.email}
        onChangeText={(value) => onChangeField('email', value)}
        placeholder="Enter email"
        keyboardType="email-address"
      />

      <ProfileField
        label="Bio"
        value={values.bio}
        onChangeText={(value) => onChangeField('bio', value)}
        placeholder="Tell people about yourself"
        multiline
      />

      <ProfileActionButtons onSave={onSave} onCancel={onCancel} saving={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#251D28',
    marginBottom: 16,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6FA',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#E9D7E6',
  },
  photoTextWrap: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#251D28',
    marginBottom: 4,
  },
  photoCaption: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8A7D89',
    marginBottom: 10,
  },
  photoButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4E7F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  photoButtonText: {
    color: '#B54FA0',
    fontSize: 12,
    fontWeight: '700',
  },
});