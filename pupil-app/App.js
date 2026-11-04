import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SubjectsScreen from './src/screens/SubjectsScreen';
import TopicsScreen from './src/screens/TopicsScreen';
import FlashcardScreen from './src/screens/FlashcardScreen';
import CompleteScreen from './src/screens/CompleteScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Subjects" component={SubjectsScreen} />
          <Stack.Screen name="Topics" component={TopicsScreen} />
          <Stack.Screen name="Flashcard" component={FlashcardScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Complete" component={CompleteScreen} options={{ gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
