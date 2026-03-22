import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const GENDER_OPTIONS = ['Male', 'Female', 'Karen', 'Prefer not to say'];
const INTEREST_OPTIONS = ['Interest 1', 'Interest 2', 'Interest 3'];
const LOOKING_FOR_OPTIONS = ['Looking 1', 'Looking 2', 'Looking 3'];

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

export default function SignupStep3Screen() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [gender, setGender] = useState('');
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [interestsModalVisible, setInterestsModalVisible] = useState(false);

  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [lookingForModalVisible, setLookingForModalVisible] = useState(false);

  const parsedDate = useMemo(() => {
    const parts = dateOfBirth.split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(2000, 0, 1);
  }, [dateOfBirth]);

  const toggleMultiSelect = (
    value: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const renderSelectionText = (values: string[], placeholder: string) => {
    if (values.length === 0) return placeholder;
    return values.join(', ');
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

      <Pressable
        style={styles.backButton}
        onPress={() => router.replace('/signup/step2')}
      >
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Tell us about yourself</Text>

        <View style={styles.form}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Date of Birth</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputWithAction}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#6F6F6F"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                keyboardType="numbers-and-punctuation"
              />

              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={styles.actionButton}
              >
                <Ionicons name="calendar-outline" size={18} color="#6F6F6F" />
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Gender</Text>
            <Pressable
              style={styles.selectBox}
              onPress={() => setGenderModalVisible(true)}
            >
              <Text style={[styles.selectText, !gender && styles.placeholderText]}>
                {gender || 'Choose an option ..'}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="#7A7A7A" />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Interests</Text>
            <Pressable
              style={styles.selectBox}
              onPress={() => setInterestsModalVisible(true)}
            >
              <Text
                numberOfLines={1}
                style={[styles.selectText, interests.length === 0 && styles.placeholderText]}
              >
                {renderSelectionText(interests, 'Choose option(s) ..')}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="#7A7A7A" />
            </Pressable>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>What are you looking for?</Text>
            <Pressable
              style={styles.selectBox}
              onPress={() => setLookingForModalVisible(true)}
            >
              <Text
                numberOfLines={1}
                style={[styles.selectText, lookingFor.length === 0 && styles.placeholderText]}
              >
                {renderSelectionText(lookingFor, 'Choose option(s) ..')}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="#7A7A7A" />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.nextButton}
          onPress={() => router.push('/signup/step4')}
        >
          <Text style={styles.nextText}>Next</Text>
          <Text style={styles.nextArrow}>→</Text>
        </Pressable>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />

        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={parsedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            if (Platform.OS !== 'ios') setShowDatePicker(false);
            if (selectedDate) {
              setDateOfBirth(formatDate(selectedDate));
            }
          }}
        />
      )}

      <SelectionModal
        visible={genderModalVisible}
        title="Select Gender"
        onClose={() => setGenderModalVisible(false)}
      >
        {GENDER_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={styles.optionRow}
            onPress={() => {
              setGender(option);
              setGenderModalVisible(false);
            }}
          >
            <Text style={styles.optionText}>{option}</Text>
            {gender === option && (
              <Ionicons name="checkmark" size={18} color="#7C57C8" />
            )}
          </Pressable>
        ))}
      </SelectionModal>

      <SelectionModal
        visible={interestsModalVisible}
        title="Select Interests"
        onClose={() => setInterestsModalVisible(false)}
      >
        {INTEREST_OPTIONS.map((option) => {
          const selected = interests.includes(option);
          return (
            <Pressable
              key={option}
              style={styles.optionRow}
              onPress={() => toggleMultiSelect(option, interests, setInterests)}
            >
              <Text style={styles.optionText}>{option}</Text>
              <Ionicons
                name={selected ? 'checkbox-outline' : 'square-outline'}
                size={20}
                color={selected ? '#7C57C8' : '#888'}
              />
            </Pressable>
          );
        })}

        <Pressable
          style={styles.modalDoneButton}
          onPress={() => setInterestsModalVisible(false)}
        >
          <Text style={styles.modalDoneButtonText}>Done</Text>
        </Pressable>
      </SelectionModal>

      <SelectionModal
        visible={lookingForModalVisible}
        title="Select What You Want"
        onClose={() => setLookingForModalVisible(false)}
      >
        {LOOKING_FOR_OPTIONS.map((option) => {
          const selected = lookingFor.includes(option);
          return (
            <Pressable
              key={option}
              style={styles.optionRow}
              onPress={() => toggleMultiSelect(option, lookingFor, setLookingFor)}
            >
              <Text style={styles.optionText}>{option}</Text>
              <Ionicons
                name={selected ? 'checkbox-outline' : 'square-outline'}
                size={20}
                color={selected ? '#7C57C8' : '#888'}
              />
            </Pressable>
          );
        })}

        <Pressable
          style={styles.modalDoneButton}
          onPress={() => setLookingForModalVisible(false)}
        >
          <Text style={styles.modalDoneButtonText}>Done</Text>
        </Pressable>
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
  inputWrapper: {
    height: 40,
    backgroundColor: '#ECECEF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
  },
  inputWithAction: {
    flex: 1,
    fontSize: 13,
    color: '#222',
  },
  actionButton: {
    paddingLeft: 8,
    paddingVertical: 4,
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
    flex: 1,
    fontSize: 13,
    color: '#222',
    marginRight: 10,
  },
  placeholderText: {
    color: '#6F6F6F',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    maxHeight: '65%',
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
  modalDoneButton: {
    marginTop: 16,
    backgroundColor: '#D85BC7',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  modalDoneButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});