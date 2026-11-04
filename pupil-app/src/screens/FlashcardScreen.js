import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DuolingoButton from '../components/DuolingoButton';
import { PUPIL } from '../data/dummyData';
import { styles, colors } from '../styles';

// Encouragement shown after answers (offline-friendly: it's just a local list).
const CHEERS = ['🎉 Excellent!', '🌟 Well done!', '💪 You can do it!', '🔥 Great job!', '👏 Super!'];
const TRY_AGAIN = ['😊 Almost there!', '💪 Keep going!', "🌈 Don't give up!"];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const normalize = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

export default function FlashcardScreen({ route, navigation }) {
  const { topic } = route.params;
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [userText, setUserText] = useState('');
  const [phase, setPhase] = useState('answering'); // 'answering' | 'feedback'
  const [isCorrect, setIsCorrect] = useState(false);
  const [cheer, setCheer] = useState('');
  const [correctCount, setCorrectCount] = useState(0);

  const q = topic.questions[index];
  const total = topic.questions.length;

  // 1. RESUME: continue where the pupil stopped.
  useEffect(() => {
    (async () => {
      const [saved, savedCorrect] = await Promise.all([
        AsyncStorage.getItem(`@progress_${topic.id}`),
        AsyncStorage.getItem(`@correct_${topic.id}`),
      ]);
      const start = saved ? parseInt(saved, 10) : 0;
      if (start >= total) {
        // Finished before: start over.
        await AsyncStorage.multiRemove([`@progress_${topic.id}`, `@correct_${topic.id}`]);
        setIndex(0);
        setCorrectCount(0);
      } else {
        setIndex(start);
        setCorrectCount(savedCorrect ? parseInt(savedCorrect, 10) : 0);
      }
      setLoaded(true);
    })();
  }, []);

  const handleCheck = () => {
    let correct = false;
    if (q.type === 'boolean' || q.type === 'multiple-choice') correct = selected === q.correctAnswer;
    if (q.type === 'text-input') {
      const accepted = q.acceptedAnswers || [q.correctAnswer];
      correct = accepted.some((a) => normalize(a) === normalize(userText));
    }
    setIsCorrect(correct);
    setCheer(correct ? pick(CHEERS) : pick(TRY_AGAIN));
    setPhase('feedback');
  };

  const handleNext = async () => {
    const nextIndex = index + 1;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(newCorrect);
    await AsyncStorage.multiSet([
      [`@progress_${topic.id}`, String(nextIndex)],
      [`@correct_${topic.id}`, String(newCorrect)],
    ]);
    if (nextIndex >= total) {
      navigation.replace('Complete', { topic, correct: newCorrect });
    } else {
      setIndex(nextIndex);
      setSelected(null);
      setUserText('');
      setPhase('answering');
    }
  };

  if (!loaded || !q) return null;

  const canCheck = q.type === 'text-input' ? userText.trim().length > 0 : selected !== null;
  const answerLabel = q.type === 'boolean' ? (q.correctAnswer ? 'True' : 'False') : q.correctAnswer;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header: X + progress bar + hearts */}
        <View style={styles.flashHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(index / total) * 100}%` }]} />
          </View>
          <Text>❤️ {PUPIL.hearts}</Text>
        </View>
        <Text style={styles.flashTopicTitle}>{topic.title}</Text>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question {index + 1} of {total}</Text>
          <Text style={styles.questionText}>{q.question}</Text>
        </View>

        {/* Answers */}
        <View style={styles.answerSection}>
          {q.type === 'boolean' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {[true, false].map((val) => (
                <TouchableOpacity
                  key={String(val)}
                  disabled={phase === 'feedback'}
                  onPress={() => setSelected(val)}
                  style={[styles.optionBtn, selected === val && styles.selected]}
                >
                  <Text style={styles.optionText}>{val ? '✓ True' : '✕ False'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {q.type === 'multiple-choice' &&
            q.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                disabled={phase === 'feedback'}
                onPress={() => setSelected(opt)}
                style={[styles.optionBtnFull, selected === opt && styles.selected]}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}

          {q.type === 'text-input' && (
            <TextInput
              style={styles.input}
              placeholder="Type your answer here..."
              value={userText}
              onChangeText={setUserText}
              editable={phase === 'answering'}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        </View>

        {/* Footer: CHECK / feedback */}
        {phase === 'answering' ? (
          <DuolingoButton title="CHECK" disabled={!canCheck} onPress={handleCheck} />
        ) : (
          <View style={[styles.feedback, { backgroundColor: isCorrect ? '#D7FFB8' : '#FFDFE0' }]}>
            <Text style={[styles.feedbackTitle, { color: isCorrect ? '#58A700' : '#EA2B2B' }]}>
              {cheer}
            </Text>
            {!isCorrect && <Text style={[styles.feedbackTitle, { color: '#EA2B2B', fontSize: 16 }]}>Correct answer: {answerLabel}</Text>}
            {!!q.explanation && <Text style={styles.feedbackExplain}>{q.explanation}</Text>}
            <DuolingoButton
              title="CONTINUE"
              color={isCorrect ? colors.green : colors.red}
              shadow={isCorrect ? colors.greenDark : '#D33131'}
              onPress={handleNext}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
