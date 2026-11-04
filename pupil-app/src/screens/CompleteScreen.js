import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DuolingoButton from '../components/DuolingoButton';
import { styles } from '../styles';

export default function CompleteScreen({ route, navigation }) {
  const { topic, correct } = route.params;
  const total = topic.questions.length;
  const ratio = total ? correct / total : 0;
  const message = ratio === 1 ? 'Perfect score! 🌟' : ratio >= 0.6 ? 'Great work! 💪' : 'Good try! Practise again to get better.';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>{ratio >= 0.6 ? '🎉' : '🌱'}</Text>
        <Text style={styles.completeTitle}>{topic.title} complete!</Text>
        <Text style={styles.completeSub}>You got {correct} out of {total} right</Text>
        <Text style={styles.completeSub}>{message}</Text>
        <Text style={[styles.completeSub, { fontWeight: 'bold', color: '#FFC800' }]}>+{correct * 10} XP</Text>
      </View>
      {/* Flashcard was replaced by this screen, so going back lands on Topics. */}
      <DuolingoButton title="CONTINUE" onPress={() => navigation.goBack()} />
    </SafeAreaView>
  );
}
