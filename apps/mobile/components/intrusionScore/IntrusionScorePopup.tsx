import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type IntrusionQuestion = {
  id: number | string;
  question: string;
  options: Record<string, string>;
};

interface IntrusionScorePopupProps {
  visible: boolean;
  onClose: () => void;
  questions: IntrusionQuestion[];
}

const ORDERED_OPTION_KEYS = ['A', 'B', 'C', 'D'];

function getOrderedOptions(options: Record<string, string>) {
  const knownKeys = ORDERED_OPTION_KEYS.filter((key) => options[key] != null);
  const extraKeys = Object.keys(options).filter(
    (key) => !knownKeys.includes(key)
  );

  return [...knownKeys, ...extraKeys].map((key) => ({
    key,
    label: options[key],
  }));
}

function getOptionScore(
  question: IntrusionQuestion,
  selectedOptionKey?: string
): number {
  if (!selectedOptionKey) return 0;

  const orderedKeys = getOrderedOptions(question.options).map((item) => item.key);
  const optionIndex = orderedKeys.indexOf(selectedOptionKey);

  return optionIndex >= 0 ? optionIndex : 0;
}

export default function IntrusionScorePopup({
  visible,
  onClose,
  questions,
}: IntrusionScorePopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const resetState = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const currentQuestion = questions[currentIndex];
  const currentQuestionId = String(currentQuestion?.id ?? '');
  const selectedAnswer = answers[currentQuestionId];

  const answeredCount = useMemo(() => {
    return questions.filter((question) => answers[String(question.id)]).length;
  }, [answers, questions]);

  const rawScore = useMemo(() => {
    return questions.reduce((sum, question) => {
      return sum + getOptionScore(question, answers[String(question.id)]);
    }, 0);
  }, [answers, questions]);

  const finalScore = Math.round((rawScore / 45) * 100);

  const resultLabel =
    finalScore <= 25
      ? 'Strongly extroverted'
      : finalScore <= 50
      ? 'Moderately extroverted / balanced'
      : finalScore <= 75
      ? 'Moderately introverted'
      : 'Strongly introverted';

  const handleSelectOption = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: optionKey,
    }));
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    if (currentIndex === questions.length - 1) {
      setShowResult(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  if (!questions?.length) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Intrusion Score</Text>
            <Text style={styles.emptyText}>No questions found.</Text>
            <Pressable style={styles.primaryButton} onPress={handleClose}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Intrusion Score</Text>

            <Pressable onPress={handleClose} hitSlop={10}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {!showResult ? (
            <>
              <Text style={styles.progressText}>
                Question {currentIndex + 1} / {questions.length}
              </Text>

              <Text style={styles.answeredText}>
                Answered: {answeredCount} / {questions.length}
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                <Text style={styles.questionText}>{currentQuestion.question}</Text>

                <View style={styles.optionsContainer}>
                  {getOrderedOptions(currentQuestion.options).map((option) => {
                    const isSelected = selectedAnswer === option.key;

                    return (
                      <Pressable
                        key={option.key}
                        style={[
                          styles.optionButton,
                          isSelected && styles.optionButtonSelected,
                        ]}
                        onPress={() => handleSelectOption(option.key)}
                      >
                        <Text
                          style={[
                            styles.optionKey,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option.key}
                        </Text>

                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.footerRow}>
                <Pressable
                  style={[styles.secondaryButton, currentIndex === 0 && styles.buttonDisabled]}
                  onPress={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <Text style={styles.secondaryButtonText}>Previous</Text>
                </Pressable>

                <Pressable
                  style={[styles.primaryButton, !selectedAnswer && styles.buttonDisabled]}
                  onPress={handleNext}
                  disabled={!selectedAnswer}
                >
                  <Text style={styles.primaryButtonText}>
                    {currentIndex === questions.length - 1 ? 'See result' : 'Next'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
             <View style={styles.resultBox}>
               <Text style={styles.resultTitle}>Your intrusion score</Text>
               <Text style={styles.resultScore}>{finalScore}%</Text>
               <Text style={styles.resultLabel}>{resultLabel}</Text>
             </View>

             <Text style={styles.resultDescription}>
               A possible interpretation of the resulting score is:
               {'\n'}• 0–25: strongly extroverted
               {'\n'}• 26–50: moderately extroverted / balanced
               {'\n'}• 51–75: moderately introverted
               {'\n'}• 76–100: strongly introverted
             </Text>


              <View style={styles.footerRow}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    setCurrentIndex(0);
                    setShowResult(false);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Review answers</Text>
                </Pressable>

                <Pressable
                  style={styles.primaryButton}
                  onPress={handleClose}
                >
                  <Text style={styles.primaryButtonText}>Done</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  closeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
  },
  progressText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#D85AAF',
  },
  answeredText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  contentContainer: {
    paddingVertical: 18,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F9FAFB',
  },
  optionButtonSelected: {
    borderColor: '#D85AAF',
    backgroundColor: '#FCE7F3',
  },
  optionKey: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D85AAF',
    minWidth: 18,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#9D174D',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#D85AAF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  resultBox: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    borderRadius: 20,
    padding: 22,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9D174D',
  },
  resultScore: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: '900',
    color: '#111827',
  },
  resultPercent: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#D85AAF',
  },
  resultLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: '#9D174D',
  },
  resultDescription: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#4B5563',
  },
});