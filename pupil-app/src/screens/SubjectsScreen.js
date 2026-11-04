import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DATA, PUPIL } from '../data/dummyData';
import { styles } from '../styles';

export default function SubjectsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>🔥 {PUPIL.streak}</Text>
        <Text style={styles.topBarText}>⭐ {PUPIL.xp} XP</Text>
        <Text style={styles.topBarText}>❤️ {PUPIL.hearts}</Text>
      </View>
      <Text style={styles.header}>Hi, {PUPIL.name}! 👋</Text>
      <Text style={styles.subHeader}>What do you want to learn today?</Text>

      <FlatList
        data={DATA}
        numColumns={2}
        keyExtractor={(i) => i.id}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ gap: 16, paddingTop: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { borderColor: item.color }]}
            onPress={() => navigation.navigate('Topics', { subject: item })}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.topics.length} Topics</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
