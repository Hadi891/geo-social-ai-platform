import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
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
const INTERESTS_BY_CATEGORY = require('@/assets/interests.json') as Record<string, string[]>;
const LOOKING_FOR_OPTIONS = ['Looking 1', 'Looking 2', 'Looking 3'];

const CATEGORY_EMOJI_MAP: Record<string, any> = {
  'lifestyle.png': require('@/assets/emojis/lifestyle.png'),
  'entertainment.png': require('@/assets/emojis/entertainment.png'),
  'fitness.png': require('@/assets/emojis/fitness.png'),
  'outdoor.png': require('@/assets/emojis/outdoor.png'),
  'creative.png': require('@/assets/emojis/creative.png'),
  'intellectual.png': require('@/assets/emojis/intellectual.png'),
  'social.png': require('@/assets/emojis/social.png'),
};

const MIN_INTERESTS_REQUIRED = 3;
const MAX_TOTAL_INTERESTS = 10;
const MAX_INTERESTS_PER_CATEGORY = 3;

const MINIMUM_AGE = 18;

const formatCategoryName = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const parseCategory = (categoryKey: string) => {
  const [rawName = '', rawImage = ''] = categoryKey.split(',').map((item) => item.trim());

  return {
    rawKey: categoryKey,
    name: formatCategoryName(rawName),
    imageName: rawImage,
    imageSource: CATEGORY_EMOJI_MAP[rawImage],
  };
};

const INTEREST_CATEGORIES = Object.entries(INTERESTS_BY_CATEGORY).map(
  ([categoryKey, options]) => ({
    ...parseCategory(categoryKey),
    options,
  })
);

const INTEREST_CATEGORY_BY_OPTION = INTEREST_CATEGORIES.reduce((acc, category) => {
  category.options.forEach((option) => {
    acc[option] = category.rawKey;
  });
  return acc;
}, {} as Record<string, string>);

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function parseDateString(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;

  const [dd, mm, yyyy] = value.split('/');
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getAgeFromDate(date: Date) {
  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() &&
      today.getDate() >= date.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export default function SignupStep3Screen() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [gender, setGender] = useState('');
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [interestsModalVisible, setInterestsModalVisible] = useState(false);

  const [lookingFor, setLookingFor] = useState('');
  const [lookingForModalVisible, setLookingForModalVisible] = useState(false);

  const [error, setError] = useState<{
    dateOfBirth?: string;
    gender?: string;
    interests?: string;
    lookingFor?: string;
  }>({});

  const [interestSheetError, setInterestSheetError] = useState('');

  const parsedDate = useMemo(() => {
    return parseDateString(dateOfBirth) ?? new Date(2000, 0, 1);
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

  const toggleInterest = (value: string) => {
    const alreadySelected = interests.includes(value);

    if (alreadySelected) {
      setInterests((prev) => prev.filter((item) => item !== value));
      setInterestSheetError('');
      setError((prev) => ({
        ...prev,
        interests: '',
      }));
      return;
    }

    if (interests.length >= MAX_TOTAL_INTERESTS) {
      setInterestSheetError(`You can select up to ${MAX_TOTAL_INTERESTS} interests`);
      return;
    }

    const categoryKey = INTEREST_CATEGORY_BY_OPTION[value];
    const selectedInSameCategory = interests.filter(
      (item) => INTEREST_CATEGORY_BY_OPTION[item] === categoryKey
    ).length;

    if (selectedInSameCategory >= MAX_INTERESTS_PER_CATEGORY) {
      const { name } = parseCategory(categoryKey);

      setInterestSheetError(
        `You can select up to ${MAX_INTERESTS_PER_CATEGORY} interests from ${name}`
      );
      return;
    }

    setInterests((prev) => [...prev, value]);
    setInterestSheetError('');
    setError((prev) => ({
      ...prev,
      interests: '',
    }));
  };

  const selectLookingFor = (value: string) => {
    setLookingFor(value);
    setError((prev) => ({
      ...prev,
      lookingFor: '',
    }));
    setLookingForModalVisible(false);
  };

  const handleNext = () => {
      const newError: {
          dateOfBirth?: string;
          gender?: string;
          interests?: string;
          lookingFor?: string;
        } = {};

        const parsedDobValue = parseDateString(dateOfBirth.trim());

        if (!dateOfBirth.trim()) {
          newError.dateOfBirth = 'Date of birth is required';
        } else if (!parsedDobValue) {
          newError.dateOfBirth = 'Enter a valid date in DD/MM/YYYY';
        } else if (getAgeFromDate(parsedDobValue) < MINIMUM_AGE) {
          newError.dateOfBirth = `You must be at least ${MINIMUM_AGE} years old`;
        }

        if (!gender) {
          newError.gender = 'Gender is required';
        }

        if (interests.length < MIN_INTERESTS_REQUIRED) {
          newError.interests = `Select at least ${MIN_INTERESTS_REQUIRED} interests`;
        }

        if (!lookingFor) {
          newError.lookingFor = 'Please select what you are looking for';
        }

        setError(newError);

        if (Object.keys(newError).length > 0) return;

        router.push('/signup/step4');
  }

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
                onChangeText={(text) => {
                  setDateOfBirth(text);
                  setError((prev) => ({
                    ...prev,
                    dateOfBirth: '',
                  }));
                }}
                keyboardType="numbers-and-punctuation"
              />

              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={styles.actionButton}
              >
                <Ionicons name="calendar-outline" size={18} color="#6F6F6F" />
              </Pressable>
            </View>

            {error.dateOfBirth ? (
                            <Text style={styles.errorText}>{error.dateOfBirth}</Text>
            ) : null}
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

            {error.gender ? (
              <Text style={styles.errorText}>{error.gender}</Text>
            ) : null}
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
                {interests.length === 0
                  ? `Choose at least ${MIN_INTERESTS_REQUIRED}`
                  : `${interests.length}/${MAX_TOTAL_INTERESTS} selected`}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="#7A7A7A" />
            </Pressable>

            {error.interests ? (
                <Text style={styles.errorText}>{error.interests}</Text>
              ) : null}
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
                {lookingFor || 'Choose an option ..'}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color="#7A7A7A" />
            </Pressable>

            {error.lookingFor ? (
              <Text style={styles.errorText}>{error.lookingFor}</Text>
            ) : null}
          </View>
        </View>

        <Pressable
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>Next</Text>
          <Text style={styles.nextArrow}>→</Text>
        </Pressable>

        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
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
              setError((prev) => ({
                ...prev,
                dateOfBirth: '',
              }));
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
              setError((prev) => ({
                ...prev,
                gender: '',
              }));
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

      <InterestBottomSheet
        visible={interestsModalVisible}
        selectedInterests={interests}
        sheetError={interestSheetError}
        onClose={() => {
          setInterestsModalVisible(false);
          setInterestSheetError('');
        }}
        onToggle={toggleInterest}
      />

      <SelectionModal
        visible={lookingForModalVisible}
        title="Select What You Want"
        onClose={() => setLookingForModalVisible(false)}
      >
        {LOOKING_FOR_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={styles.optionRow}
            onPress={() => selectLookingFor(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
            {lookingFor === option && (
              <Ionicons name="checkmark" size={18} color="#7C57C8" />
            )}
          </Pressable>
        ))}

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

function InterestBottomSheet({
      visible,
      selectedInterests,
      sheetError,
      onClose,
      onToggle,
    }: {
      visible: boolean;
      selectedInterests: string[];
      sheetError: string;
      onClose: () => void;
      onToggle: (value: string) => void;
    }) {

        return (
          <Modal
            transparent
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
            navigationBarTranslucent
          >
            <Pressable style={styles.sheetOverlay} onPress={onClose}>
              <Pressable style={styles.sheetCard} onPress={() => {}}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Select Interests</Text>

                  <Pressable onPress={onClose}>
                    <Text style={styles.sheetDoneText}>Done</Text>
                  </Pressable>
                </View>

                {sheetError ? <Text style={styles.sheetErrorText}>{sheetError}</Text> : null}

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.sheetScrollContent}
                >
                  {INTEREST_CATEGORIES.map((category) => (
                    <View key={category.rawKey} style={styles.categorySection}>
                      <View style={styles.categoryHeader}>
                        {category.imageSource && (
                          <Image
                            source={category.imageSource}
                            style={styles.categoryEmoji}
                            contentFit="contain"
                          />
                        )}

                        <Text style={styles.categoryTitle}>
                          {category.name}
                        </Text>
                      </View>

                      <View style={styles.chipsContainer}>
                        {category.options.map((option) => {
                          const selected = selectedInterests.includes(option);

                          return (
                            <Pressable
                              key={option}
                              onPress={() => onToggle(option)}
                              style={[
                                styles.interestChip,
                                selected && styles.interestChipSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.interestChipText,
                                  selected && styles.interestChipTextSelected,
                                ]}
                              >
                                {option}
                              </Text>

                              {selected && (
                                <Ionicons
                                  name="close"
                                  size={12}
                                  color="#FFF"
                                  style={styles.interestChipIcon}
                                />
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
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
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },

  sheetCard: {
    height: '72%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D0D0D0',
    alignSelf: 'center',
    marginBottom: 14,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4C2376',
  },

  sheetDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D85BC7',
  },

  sheetScrollContent: {
    paddingBottom: 20,
  },

  categorySection: {
    marginBottom: 20,
  },

  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#242424',
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },

  interestChipSelected: {
    backgroundColor: '#D85BC7',
    borderColor: '#D85BC7',
  },

  interestChipText: {
    fontSize: 12,
    color: '#5F5F5F',
  },

  interestChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  interestChipIcon: {
    marginLeft: 4,
  },

  errorText: {
    marginTop: 6,
    marginLeft: 6,
    fontSize: 12,
    color: '#D94B4B',
  },

  sheetErrorText: {
    fontSize: 12,
    color: '#D94B4B',
    marginBottom: 10,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  categoryEmoji: {
    width: 16,
    height: 16,
    marginRight: 6,
  },

});