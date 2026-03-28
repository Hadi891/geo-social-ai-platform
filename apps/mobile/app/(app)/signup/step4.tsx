import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const PLAN_OPTIONS = ['Plan 1', 'Plan 2', 'Plan 3'];

export default function SignupStep4Screen() {
  const [description, setDescription] = useState('');
  const [preferredPlan, setPreferredPlan] = useState('');
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

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
            <Text style={styles.label}>Prefered Plan</Text>
            <Pressable
              style={styles.selectBox}
              onPress={() => setPlanModalVisible(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !preferredPlan && styles.placeholderText,
                ]}
              >
                {preferredPlan || 'Choose an option ..'}
              </Text>
              <Ionicons
                name="chevron-down-outline"
                size={16}
                color="#7A7A7A"
              />
            </Pressable>
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
            <Pressable
                    style={styles.signupButton}
                    onPress={() => router.replace('/home')}
                  >
                    <Text style={styles.signupButtonText}>Sign up →</Text>
            </Pressable>
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


      <SelectionModal
        visible={planModalVisible}
        title="Select Plan"
        onClose={() => setPlanModalVisible(false)}
      >
        {PLAN_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={styles.optionRow}
            onPress={() => {
              setPreferredPlan(option);
              setPlanModalVisible(false);
            }}
          >
            <Text style={styles.optionText}>{option}</Text>
            {preferredPlan === option && (
              <Ionicons name="checkmark" size={18} color="#7C57C8" />
            )}
          </Pressable>
        ))}
      </SelectionModal>
    </View>
  );
}

function SelectionModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
    color: '#4C2376',
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
    backgroundColor: '#D85BC7',
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
    backgroundColor: '#7C57C8',
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
    backgroundColor: '#D85BC7',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalVerifyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});