import { describe, expect, it } from '@jest/globals';

import { answerFor, ASK_QUESTIONS, isAskTopic, suggestionsFor, type AskTopic } from './ask';

describe('isAskTopic', () => {
  it('accepts every canned topic', () => {
    for (const topic of Object.keys(ASK_QUESTIONS)) expect(isAskTopic(topic)).toBe(true);
  });

  it('rejects anything else, including route params that are arrays or missing', () => {
    expect(isAskTopic('mortgage')).toBe(false);
    expect(isAskTopic(undefined)).toBe(false);
    expect(isAskTopic(['week'])).toBe(false);
    expect(isAskTopic('toString')).toBe(false);
  });
});

describe('answerFor', () => {
  const topics = Object.keys(ASK_QUESTIONS) as AskTopic[];

  it('gives every topic one answer sentence or two, follow-ups and what it was based on', () => {
    for (const topic of topics) {
      const a = answerFor(topic);
      expect(a.answer.length).toBeGreaterThan(0);
      expect(a.followups.length).toBeGreaterThan(0);
      expect(a.basedOn.length).toBeGreaterThan(0);
      if (a.highlight) expect(a.answer).toContain(a.highlight);
    }
  });

  it('follow-ups either ask another known topic or open a screen', () => {
    for (const topic of [...topics, 'unknown' as const]) {
      for (const f of answerFor(topic).followups) {
        expect(Boolean(f.href) !== Boolean(f.topic)).toBe(true);
        if (f.topic) expect(isAskTopic(f.topic)).toBe(true);
      }
    }
  });

  it('lists each credit that resets this month as a step, with the total in the answer', () => {
    const a = answerFor('credits');
    expect(a.answer).toMatch(/^\$65 in credits reset this month\. The \$10 dining credit/);
    expect(a.steps?.map((s) => s.title)).toContain('Use your $10 Dining credit');
    expect(a.steps?.every((s) => !s.done)).toBe(true);
  });

  it('marks what is already done in the trip plan', () => {
    const steps = answerFor('japan').steps ?? [];
    expect(steps[0]).toMatchObject({ title: 'Economy is ready to book', done: true });
    expect(steps.slice(1).every((s) => !s.done)).toBe(true);
  });

  it('says plainly when it cannot answer yet', () => {
    expect(answerFor('unknown').answer).toMatch(/^I can only answer a few questions/);
    expect(answerFor('unknown').steps).toBeUndefined();
  });
});

describe('suggestionsFor', () => {
  it('starts with the topic closest to where Ask was opened', () => {
    expect(suggestionsFor('benefits')[0]).toBe('credits');
    expect(suggestionsFor('spending')[0]).toBe('dinner');
    expect(suggestionsFor(undefined)).toEqual(['week', 'dinner', 'credits', 'japan']);
  });

  it('always offers every topic once', () => {
    expect([...suggestionsFor('benefits')].sort()).toEqual(['credits', 'dinner', 'japan', 'week']);
  });
});
