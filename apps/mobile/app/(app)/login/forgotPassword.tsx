import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

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
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>

      <View style={styles.content}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />

        <Text style={styles.title}>Forgot Password</Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Email <Text style={styles.required}>*</Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Pressable style={styles.button} onPress={() => {}}>
            <Text style={styles.buttonText}>Continue</Text>
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
    color: '#4C2376',
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
    marginBottom: 18,
    fontSize: 14,
    color: '#222',
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
});