import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

export default function SignUpStep5Screen() {
  return (
    <View style={styles.container}>
        <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/signup/step4')}
          >
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>

      <Text style={styles.text}>This should be the page to choose stuff before Sign Up</Text>

      <Pressable
        style={styles.signupButton}
        onPress={() => router.replace('/signup/step5')}
      >
        <Text style={styles.signupButtonText}>Sign up →</Text>
      </Pressable>

      <View style={styles.pagination}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.activeDot]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingLeft: 15,
  },
  text: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
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

  signupButton: {
      alignSelf: 'center',
      marginTop: 10,
      backgroundColor: '#D85BC7',
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
      backgroundColor: '#7C57C8',
    },
});