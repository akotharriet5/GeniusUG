// Converts a question from the Laravel admin API into the shape the screens use.
// Not used yet (the app runs on dummyData.js), but this is the one place to change when you connect the backend.
//
// Laravel: { id, stem, type: 'mcq'|'true_false'|'text_input', options:[{text,is_correct}], explanation }
// Screens: { id, question, type, options?, correctAnswer, acceptedAnswers?, explanation }
export function mapQuestion(q) {
  const correct = (q.options || []).filter((o) => o.is_correct).map((o) => o.text);
  const base = { id: String(q.id), question: q.stem, explanation: q.explanation || null, hint: q.hint || null };

  if (q.type === 'true_false') {
    return { ...base, type: 'boolean', correctAnswer: correct[0]?.toLowerCase() === 'true' };
  }
  if (q.type === 'text_input') {
    return { ...base, type: 'text-input', correctAnswer: correct[0] || '', acceptedAnswers: correct };
  }
  return { ...base, type: 'multiple-choice', options: q.options.map((o) => o.text), correctAnswer: correct[0] };
}
