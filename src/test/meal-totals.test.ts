import { describe, expect, it } from 'vitest';
import { calculateMealTotals } from '../components/lunchdebt/meal-totals';

describe('meal tax totals', () => {
  const items = [{ name: 'Cơm', price: 100000, member_ids: ['a', 'b'] }, { name: 'Trà', price: 20000, member_ids: ['a'] }];
  it('keeps untaxed meals unchanged', () => {
    const result = calculateMealTotals(items);
    expect(result.total).toBe(120000);
    expect(result.savedItems).toEqual(items);
    expect(result.shares.get('a')).toBe(70000);
  });
  it.each([8, 10, 7.5])('applies %s percent to the bill and each eater', rate => {
    const result = calculateMealTotals(items, rate);
    expect(result.total).toBe(120000 * (1 + rate / 100));
    expect(result.shares.get('a')).toBe(70000 * (1 + rate / 100));
    expect(result.shares.get('b')).toBe(50000 * (1 + rate / 100));
    expect(result.savedItems.reduce((sum, item) => sum + item.price, 0)).toBe(result.total);
  });
  it('keeps rounded tax lines reconciled, including discounts', () => {
    const result = calculateMealTotals([{ name: 'A', price: 1001, member_ids: ['a'] }, { name: 'B', price: 1001, member_ids: ['b'] }, { name: 'Giảm giá', price: -101, member_ids: ['a', 'b'] }], 8);
    expect(result.tax).toBe(152);
    expect(result.savedItems.reduce((sum, item) => sum + item.price, 0)).toBe(result.total);
    expect([...result.shares.values()].reduce((sum, share) => sum + share, 0)).toBe(result.total);
  });
  it('keeps zero and empty drafts valid for preview', () => {
    expect(calculateMealTotals([], 10).total).toBe(0);
  });
});