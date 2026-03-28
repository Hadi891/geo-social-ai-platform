import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { theme } from '@/constants/theme';
import { router } from 'expo-router';

export default function SignupStep1Screen() {
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



        <Text style={styles.title}>Welcome to Mingle</Text>

        <Text style={styles.subtitle}>
          Where your next great connection is just a tap away!
        </Text>

        <Text style={styles.paragraph}>
          We believe that dating should be{' '}
          <Text style={styles.highlight}>fun</Text>,{' '}
          <Text style={styles.highlight}>effortless</Text>, and full of{' '}
          <Text style={styles.highlight}>exciting</Text> possibilities.
        </Text>

        <Text style={styles.paragraph}>
          Whether you're searching for a deep connection, a spontaneous coffee
          date, or a weekend partner-in-crime, you're exactly where you need to
          be.
        </Text>

        <Text style={styles.paragraph}>
          Dive in, build a profile that shows off the real you, and let the
          sparks fly!
        </Text>

        <Link href="/signup/step2" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Start →</Text>
          </Pressable>
        </Link>

        <View style={styles.pagination}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
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
    paddingHorizontal: 28,
    paddingTop: 110,
    paddingBottom: 40,
  },
  logo: {
    width: 130,
    height: 130,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#44206B',
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 17,
    color: '#5A3B84',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 34,
    maxWidth: 300,
  },
  paragraph: {
    fontSize: 16,
    color: '#1F1F1F',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 22,
    maxWidth: 310,
  },
  highlight: {
    color: '#8F47C7',
    fontWeight: '600',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#D85BC7',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 999,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#BDBDBD',
  },
  activeDot: {
    backgroundColor: '#7C57C8',
  },
});