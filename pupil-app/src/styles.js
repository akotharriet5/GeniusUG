import { StyleSheet } from 'react-native';

// One shared stylesheet for all screens.
export const colors = {
  green: '#58CC02', greenDark: '#46A302', blue: '#1CB0F6', yellow: '#FFC800',
  red: '#FF4B4B', grey: '#E5E5E5', greyDark: '#AFAFAF', ink: '#3C3C3C',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },

  // Subjects
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  topBarText: { fontSize: 16, fontWeight: 'bold', color: colors.ink },
  header: { fontSize: 28, fontWeight: 'bold', color: colors.ink, marginTop: 12 },
  subHeader: { fontSize: 16, color: '#777', marginTop: 4 },
  card: { flex: 1, borderWidth: 2, borderBottomWidth: 4, borderRadius: 16, padding: 16, alignItems: 'center' },
  iconBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  icon: { fontSize: 30 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.ink },
  cardSub: { fontSize: 13, color: '#777', marginTop: 2 },

  // Topics
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 2, borderColor: colors.grey, borderRadius: 16, marginBottom: 12 },
  topicIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { fontSize: 17, fontWeight: 'bold', color: colors.ink, marginBottom: 6 },
  progressBg: { flex: 1, height: 16, backgroundColor: colors.grey, borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.yellow, borderRadius: 10 },
  progressText: { fontWeight: 'bold', color: '#777' },

  // Flashcards
  flashHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  close: { fontSize: 24, color: colors.greyDark },
  flashTopicTitle: { fontSize: 14, color: '#777', marginTop: 12, fontWeight: 'bold' },
  questionCard: { flex: 1, justifyContent: 'center' },
  questionLabel: { fontSize: 14, color: '#777', fontWeight: 'bold' },
  questionText: { fontSize: 24, fontWeight: 'bold', color: colors.ink, marginTop: 10 },
  answerSection: { flex: 1, gap: 12 },
  optionBtn: { flex: 1, padding: 18, borderWidth: 2, borderColor: colors.grey, borderBottomWidth: 4, borderRadius: 16, alignItems: 'center' },
  optionBtnFull: { padding: 18, borderWidth: 2, borderColor: colors.grey, borderBottomWidth: 4, borderRadius: 16 },
  optionText: { fontSize: 18, color: colors.ink, fontWeight: '600' },
  selected: { backgroundColor: '#DDF4FF', borderColor: colors.blue },
  input: { borderWidth: 2, borderColor: colors.grey, borderRadius: 16, padding: 18, fontSize: 18, backgroundColor: '#F7F7F7' },
  btn: { padding: 16, borderRadius: 16, borderBottomWidth: 4, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  feedback: { margin: -20, padding: 20, paddingBottom: 28, gap: 12, marginTop: 10 },
  feedbackTitle: { fontWeight: 'bold', fontSize: 18 },
  feedbackExplain: { fontSize: 15, color: colors.ink },

  // Complete
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  bigEmoji: { fontSize: 80 },
  completeTitle: { fontSize: 28, fontWeight: 'bold', color: colors.ink, textAlign: 'center' },
  completeSub: { fontSize: 18, color: '#777', textAlign: 'center' },
});
