import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from '../styles';

export default function TopicsScreen({ route, navigation }) {
  const { subject } = route.params;
  const [progress, setProgress] = useState({}); // { topicId: cardsDone }

  // Reload progress every time this screen comes back into focus (shows resume state).
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const map = {};
        for (const t of subject.topics) {
          const saved = await AsyncStorage.getItem(`@progress_${t.id}`);
          map[t.id] = saved ? parseInt(saved, 10) : 0;
        }
        setProgress(map);
      })();
    }, [subject])
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ fontSize: 16, color: '#1CB0F6', fontWeight: 'bold' }}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={[styles.header, { marginBottom: 16 }]}>{subject.title}</Text>

      <FlatList
        data={subject.topics}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const total = item.questions.length;
          const done = Math.min(progress[item.id] || 0, total);
          const isComplete = total > 0 && done >= total;
          return (
            <TouchableOpacity style={styles.topicRow} onPress={() => navigation.navigate('Flashcard', { topic: item })}>
              <View style={[styles.topicIcon, { backgroundColor: isComplete ? '#58CC02' : subject.color }]}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>{isComplete ? '✓' : item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topicTitle}>{item.title}</Text>
                <View style={[styles.progressBg, { flex: 0 }]}>
                  <View style={[styles.progressFill, { width: `${total ? (done / total) * 100 : 0}%` }]} />
                </View>
              </View>
              <Text style={styles.progressText}>{done}/{total}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
