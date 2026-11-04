# Pupil app (Expo / React Native)

Runs on dummy data (src/data/dummyData.js). No backend needed yet.

## Run it
1. Install Node.js LTS (https://nodejs.org).
2. Install the "Expo Go" app on your phone (Play Store / App Store).
3. In this folder:
       npm install
       npx expo start
4. Scan the QR code with Expo Go (Android) or the Camera app (iPhone).
   Phone and computer must be on the same Wi-Fi.

## If it won't connect
- Different networks / blocked Wi-Fi:   npx expo start --tunnel   (it will offer to install @expo/ngrok, say yes)
- Stale cache or odd errors:            npx expo start -c
- Android emulator: install Android Studio, start an emulator, then press "a" in the terminal.
- Reset a pupil's saved progress while testing: clear Expo Go's storage, or reinstall Expo Go.

## Where things are
src/data/dummyData.js      subjects, topics and flashcards (edit this to change content)
src/screens/               Subjects, Topics, Flashcard, Complete
src/components/            DuolingoButton
src/styles.js              shared styles
src/api/mapQuestion.js     converts the Laravel admin's question shape into the shape the screens use (for later)
