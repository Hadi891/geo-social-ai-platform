import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
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

      <View style={styles.content}>

        <Link href="/home" asChild>
        <Pressable><Text>Temp Home Button</Text></Pressable>
        </Link>

        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />

        <Text style={styles.title}>Welcome to Mingle</Text>
        <Text style={styles.subtitle}>
          Find meaningful connections, beautiful moments, and the right match
          for you.
        </Text>

        <View style={styles.buttonGroup}>
          <Link href="/login/login" asChild>
            <Pressable style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Login</Text>
            </Pressable>
          </Link>

          <Link href="/signup/step1" asChild>
            <Pressable style={styles.signupButton}>
              <Text style={styles.signupButtonText}>Sign up</Text>
            </Pressable>
          </Link>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 30,
  },
  logo: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#44206B',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#5A3B84',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
    marginBottom: 40,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  loginButton: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D85BC7',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  signupButton: {
    width: '80%',
    backgroundColor: '#D85BC7',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#D85BC7',
    fontSize: 16,
    fontWeight: '700',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});