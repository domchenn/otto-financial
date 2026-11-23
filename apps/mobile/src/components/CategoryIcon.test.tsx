import { describe, expect, it } from '@jest/globals';

import { categoryIcon, categoryTone } from './CategoryIcon';
import { CartIcon, TagIcon } from './icons';

describe('categoryTone', () => {
  it('gives each category its fixed tint', () => {
    expect(categoryTone('FOOD_AND_DRINK')).toBe('butter');
    expect(categoryTone('GENERAL_MERCHANDISE')).toBe('blush');
    expect(categoryTone('TRAVEL')).toBe('sky');
    expect(categoryTone('TRANSPORTATION')).toBe('sky');
  });

  it('treats unknown and missing categories as other', () => {
    expect(categoryTone('RENT_AND_UTILITIES')).toBe('lilac');
    expect(categoryTone(null)).toBe('lilac');
  });
});

describe('categoryIcon', () => {
  it('falls back to the tag icon', () => {
    expect(categoryIcon('GENERAL_MERCHANDISE')).toBe(CartIcon);
    expect(categoryIcon(null)).toBe(TagIcon);
  });
});
