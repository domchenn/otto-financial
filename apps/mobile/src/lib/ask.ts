/**
 * Canned Ask Otto topics. The real assistant arrives in M6; until then the Ask tab answers
 * these from sample data and explains that free-form questions aren't supported yet.
 */
export type AskTopic = 'dinner' | 'week' | 'japan' | 'credits';

export const ASK_QUESTIONS: Record<AskTopic, string> = {
  dinner: 'Which card for a $60 dinner tonight?',
  week: 'Summarize my week',
  japan: 'How close am I to Japan?',
  credits: 'What credits expire this month?',
};

export function isAskTopic(value: unknown): value is AskTopic {
  return typeof value === 'string' && value in ASK_QUESTIONS;
}
