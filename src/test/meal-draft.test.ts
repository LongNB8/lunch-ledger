import { describe, expect, it } from 'vitest';
import { draftItemTotal, presetMealName, savedDraftItem } from '../components/lunchdebt/meal-draft';

describe('meal draft', () => {
  const item = { key: 'one', name: 'Cơm', price: 35000, member_ids: ['a', 'b'] };
  it('adds the selected date to a preset', () => {
    expect(presetMealName('Cơm trưa', '2026-10-13')).toBe('Cơm trưa (13/10/2026)');
  });
  it('keeps manual dish prices as the whole dish price', () => {
    expect(draftItemTotal(item)).toBe(35000);
  });
  it('multiplies shared price by eater count and saves that total', () => {
    expect(draftItemTotal({ ...item, even: true })).toBe(70000);
    expect(savedDraftItem({ ...item, even: true })).toEqual({ name: 'Món chung (chia đều)', price: 70000, member_ids: ['a', 'b'] });
    expect(draftItemTotal({ ...item, even: true, member_ids: ['a', 'b', 'c'] })).toBe(105000);
  });
  it('has no shared total until eaters are selected', () => {
    expect(draftItemTotal({ ...item, even: true, member_ids: [] })).toBe(0);
  });
});