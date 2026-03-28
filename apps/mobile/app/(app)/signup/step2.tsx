import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SignupStep2Screen() {
//   const [suggestPassword, setSuggestPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const randomPasswordGenerator = (length : number) => {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!$_#';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
  }

  const handleSuggestPassword = () => {
    const generated = randomPasswordGenerator(12);
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  const validateForm = () => {
    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName.trim()) {
      setErrors({ firstName: 'First name is required' });
//       Alert.alert('Error', 'First name is required');
      return false;
    }

    if (!lastName.trim()) {
      setErrors({ lastName: 'Last name is required' });
//       Alert.alert('Error', 'Last name is required');
      return false;
    }

    if (!emailTrimmed) {
      setErrors({ email: 'Email is required' });
//       Alert.alert('Error', 'Email is required');
      return false;
    }

    if (!emailRegex.test(emailTrimmed)) {
      setErrors({ email: 'Please enter a valid email address' });
//       Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      setErrors({ password: 'Password is required' });
//       Alert.alert('Error', 'Password is required');
      return false;
    }

    if (!confirmPassword.trim()) {
      setErrors({ confirmPassword: 'Please confirm your password' });
//       Alert.alert('Error', 'Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
//       Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    setErrors({});
    return true;
  };


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

      <Pressable style={styles.backButton} onPress={() => router.replace('/signup/step1')}>
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>

      <View style={styles.content}>

        <Text style={styles.title}>Login Information</Text>

        <View style={styles.form}>
            <View style={styles.nameRow}>
              <View style={styles.halfField}>
                <Text style={styles.label}>
                  First Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="First Name"
                  placeholderTextColor="#6F6F6F"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (errors.firstName) setErrors({});
                  }}
                />
                {errors.firstName ? (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                ) : null}
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>
                  Last Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Last Name"
                  placeholderTextColor="#6F6F6F"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (errors.lastName) setErrors({});
                  }}
                />
                {errors.lastName ? (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                ) : null}
              </View>
            </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              placeholderTextColor="#6F6F6F"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({});
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              New Password <Text style={styles.required}>*</Text>
            </Text>

            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Password"
                placeholderTextColor="#6F6F6F"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({});
                }}
                secureTextEntry={!showPassword}
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#6F6F6F"
                />
              </Pressable>
            </View>

            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}
          </View>


          <Pressable style={styles.suggestButton} onPress={handleSuggestPassword}>
            <Text style={styles.suggestButtonText}>Suggest a password</Text>
          </Pressable>


          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              Confirm New Password <Text style={styles.required}>*</Text>
            </Text>

            <View
              style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}
            >
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Confirm New Password"
                placeholderTextColor="#6F6F6F"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({});
                }}
                secureTextEntry={!showConfirmPassword}
              />

              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#6F6F6F"
                />
              </Pressable>
            </View>

            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          style={styles.nextButton}
          onPress={() => {
            if (validateForm()) {
              router.push('/signup/step3');
            }
          }}
        >
          <Text style={styles.nextText}>Next</Text>
          <Text style={styles.nextArrow}>→</Text>
        </Pressable>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
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
    left:-10,
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
    color: '#4C2376',
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
    color: '#4C2376',
    textAlign: 'center',
    marginBottom: 52,
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  halfField: {
    width: '48%',
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 18,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#B9B9B9',
  },
  activeDot: {
    backgroundColor: '#7C57C8',
  },
  inputWrapper: {
    height: 40,
    backgroundColor: '#ECECEF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
  },

  inputWithIcon: {
    flex: 1,
    fontSize: 13,
    color: '#222',
  },

  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 4,
  },

  suggestButton: {
    alignSelf: 'flex-start',
    marginTop: -4,
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ECECEF',
  },

  suggestButtonText: {
    fontSize: 11,
    color: '#4C2376',
    fontWeight: '600',
  },

  required: {
    color: '#D93025',
  },

  inputError: {
    borderWidth: 1,
    borderColor: '#D93025',
  },

  errorText: {
    color: '#D93025',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 6,
  },
});