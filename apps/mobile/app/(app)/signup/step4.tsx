import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { createUserProfile, updateLocation } from '@repo/api';


function ageFromDOB(dob: string): number | undefined {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) return undefined;
  const [dd, mm, yyyy] = dob.split('/');
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const had =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  return had ? age : age - 1;
}

export default function SignupStep4Screen() {
  const { signupData, updateSignupData, doSignUp, doConfirmSignUp, doSignIn, doResendCode } = useAuth();
  const [description, setDescription] = useState(signupData.description ?? '');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Start 60s cooldown when OTP modal opens
  useEffect(() => {
    if (otpVisible) setResendCooldown(60);
  }, [otpVisible]);

  // Count down every second
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    const { email } = signupData;
    if (!email) return;
    setResendLoading(true);
    setOtpError('');
    try {
      await doResendCode(email);
      setResendCooldown(60);
    } catch (e: any) {
      setOtpError(e.message ?? 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignUp = async () => {
    const { email, password } = signupData;
    if (!email || !password) {
      setApiError('Email or password missing. Please go back to step 2.');
      return;
    }
    updateSignupData({ description });
    setLoading(true);
    setApiError('');
    try {
      await doSignUp(email, password);
      setOtpVisible(true);
    } catch (e: any) {
      if (e.code === 'UsernameExistsException' || e.name === 'UsernameExistsException') {
        setOtpVisible(true);
      } else {
        setApiError(e.message ?? 'Sign up failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    const { email, password, firstName, lastName, dateOfBirth, gender, interests, lookingFor } = signupData;
    if (!email || !password) return;
    if (!otpCode.trim()) { setOtpError('Please enter the verification code'); return; }
    setLoading(true);
    setOtpError('');
    try {
      await doConfirmSignUp(email, otpCode.trim());
      const token = await doSignIn(email, password);
      const age = dateOfBirth ? ageFromDOB(dateOfBirth) : undefined;
      await createUserProfile(token, {
        name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
        age,
        bio: description || undefined,
        gender: gender || undefined,
        sexual_orientation: lookingFor || undefined,
        interests: interests?.length ? interests : undefined,
      });
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          await updateLocation(token, { latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (locErr: any) {
        console.warn('Location error:', locErr?.message ?? locErr);
      }
      router.replace('/home');
    } catch (e: any) {
      setOtpError(e.message ?? 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
      setIsVerified(false);
    } else {
      Alert.alert('No image selected');
    }
  };


  const hasImage = !!selectedImageUri;

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/topLeftEllipse.png')}
        style={styles.topEllipse}
        contentFit="contain"
      />

      <Image
        source={require('@/assets/images/bottomLeftEllipse.png')}
        style={styles.bottomEllipse}
        contentFit="contain"
      />

      <Pressable
        style={styles.backButton}
        onPress={() => router.replace('/signup/step3')}
      >
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Last steps</Text>

        <View style={styles.form}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#6F6F6F"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Profile Picture</Text>

            <Pressable style={styles.imagePlaceholder} onPress={pickImage}>
              {selectedImageUri ? (
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.selectedImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="image-outline" size={34} color="#9B9B9B" />
              )}
            </Pressable>

            <Pressable
              disabled={!hasImage || isVerified}
              style={[
                styles.verifyButton,
                (!hasImage || isVerified) && styles.verifyButtonDisabled,
                isVerified && styles.verifyButtonVerified,
              ]}
              onPress={() => {
                if (!hasImage || isVerified) return;
                setVerifyModalVisible(true);
              }}
            >
              <Text
                style={[
                  styles.verifyButtonText,
                  !hasImage && styles.verifyButtonTextDisabled,
                ]}
              >
                {isVerified ? 'Verified' : 'Verification'}
              </Text>
            </Pressable>
          </View>

        </View>

        {isVerified && (
          <>
            {apiError ? <Text style={styles.apiErrorText}>{apiError}</Text> : null}
            <Pressable
              style={[styles.signupButton, loading && styles.verifyButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>{loading ? 'Please wait...' : 'Sign up →'}</Text>
            </Pressable>
          </>
        )}


        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>
      </View>


      <Modal
        transparent
        animationType="fade"
        visible={verifyModalVisible}
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVerifyModalVisible(false)}
        >
          <Pressable style={styles.verifyModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Verify</Text>
            <Text style={styles.verifyModalText}>
              Click verify to confirm this picture.
            </Text>

            <Pressable
              style={styles.modalVerifyButton}
              onPress={() => {
                setIsVerified(true);
                setVerifyModalVisible(false);
              }}
            >
              <Text style={styles.modalVerifyButtonText}>Verify</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>


      <Modal
        transparent
        animationType="fade"
        visible={otpVisible}
        onRequestClose={() => setOtpVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOtpVisible(false)}>
          <Pressable style={styles.verifyModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Check your email</Text>
            <Text style={styles.verifyModalText}>
              Enter the verification code sent to {signupData.email}.
            </Text>
            <TextInput
              style={[styles.otpInput, otpError ? styles.otpInputError : null]}
              placeholder="000000"
              placeholderTextColor="#9B9B9B"
              value={otpCode}
              onChangeText={(t) => { setOtpCode(t); setOtpError(''); }}
              keyboardType="number-pad"
              maxLength={6}
            />
            {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}
            <Pressable
              style={[styles.modalVerifyButton, loading && styles.verifyButtonDisabled]}
              onPress={handleConfirmOtp}
              disabled={loading}
            >
              <Text style={styles.modalVerifyButtonText}>
                {loading ? 'Verifying...' : 'Confirm'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.resendButton, (resendCooldown > 0 || resendLoading) && styles.resendButtonDisabled]}
              onPress={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
            >
              <Text style={[styles.resendButtonText, (resendCooldown > 0 || resendLoading) && styles.resendButtonTextDisabled]}>
                {resendLoading ? 'Sending...' : resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  topEllipse: {
    position: 'absolute',
    top: 0,
    left: -10,
    width: 170,
    height: 120,
  },
  bottomEllipse: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    width: 170,
    height: 150,
  },
  backButton: {
    position: 'absolute',
    top: 55,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 30,
    color: '#8E1C62',
    fontWeight: '900',
  },
  content: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 150,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E1C62',
    textAlign: 'center',
    marginBottom: 52,
  },
  form: {
    width: '100%',
  },
  fieldBlock: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#242424',
    marginBottom: 8,
  },
  input: {
    height: 40,
    backgroundColor: '#ECECEF',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#222',
  },
  selectBox: {
    height: 40,
    backgroundColor: '#ECECEF',
    borderRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 13,
    color: '#222',
    flex: 1,
    marginRight: 10,
  },
  placeholderText: {
    color: '#6F6F6F',
  },
  imagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  signupButton: {
    alignSelf: 'center',
    marginTop: 10,
    backgroundColor: '#D3327C',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 40,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#B9B9B9',
  },
  activeDot: {
    backgroundColor: '#8E1C62',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    maxHeight: '60%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E1C62',
    marginBottom: 14,
    textAlign: 'center',
  },
  optionRow: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 15,
    color: '#222',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  nextArrow: {
    fontSize: 18,
    color: '#111',
    fontWeight: '700',
  },
  verifyButton: {
    alignSelf: 'center',
    marginTop: 4,
    backgroundColor: '#D3327C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',

//     zIndex: 20,
//     elevation: 5,
  },
  verifyButtonDisabled: {
    backgroundColor: '#D3D3D3',
  },
  verifyButtonVerified: {
    backgroundColor: '#8E1C62',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  verifyButtonTextDisabled: {
    color: '#8A8A8A',
  },
  verifyModalCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  verifyModalText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalVerifyButton: {
    backgroundColor: '#D3327C',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalVerifyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  otpInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
    color: '#222',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  otpInputError: {
    borderColor: '#D93025',
  },
  otpErrorText: {
    color: '#D93025',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  apiErrorText: {
    color: '#D93025',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  resendButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 13,
    color: '#D3327C',
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#9B9B9B',
  },
});