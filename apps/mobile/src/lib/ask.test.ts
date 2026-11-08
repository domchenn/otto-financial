import { describe, expect, it } from '@jest/globals';

import { ASK_QUESTIONS, isAskTopic } from './ask';

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
