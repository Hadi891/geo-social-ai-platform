import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { updateLocation } from '@repo/api';

export default function LoginScreen() {
  const { doSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async () => {
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const newErrors = { email: '', password: '' };

    if (!emailTrimmed) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!passwordTrimmed) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      const token = await doSignIn(emailTrimmed, passwordTrimmed);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          await updateLocation(token, { latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch {}
      router.replace('/home');
    } catch (e: any) {
      setApiError(e.message ?? 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
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

      <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>

      <View style={styles.content}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />

        <Text style={styles.title}>Login</Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Email <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <Text style={styles.label}>
            Password <Text style={styles.required}>*</Text>
          </Text>
          <View
            style={[
              styles.passwordContainer,
              errors.password ? styles.inputError : null,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              secureTextEntry={!showPassword}
            />

            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#777"
              />
            </Pressable>

          </View>
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <Pressable
            style={styles.forgotPasswordButton}
            onPress={() => router.push('/login/forgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          {apiError ? <Text style={styles.apiErrorText}>{apiError}</Text> : null}
          <Pressable style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Login'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    width: 130,
    height: 130,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#8E1C62',
    marginBottom: 30,
  },
  form: {
    width: '100%',
    maxWidth: 320,
  },
  label: {
    fontSize: 14,
    color: '#8E1C62',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: 'red',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#EFEFEF',
    borderRadius: 999,
    paddingHorizontal: 18,
    marginBottom: 6,
    fontSize: 14,
    color: '#222',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordContainer: {
    width: '100%',
    height: 48,
    backgroundColor: '#EFEFEF',
    borderRadius: 999,
    paddingHorizontal: 18,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
    marginRight: 10,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 12,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginRight: 4,
  },
  forgotPasswordText: {
    color: '#D3327C',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#D3327C',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  apiErrorText: {
    color: '#D93025',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
});