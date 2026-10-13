import { describe, expect, it } from 'vitest';
import { parseDailySearch } from '@/components/lunchdebt/daily-search';

describe('Daily ledger filters', () => {
  it('keeps the eating date and saved meal', () => {
    const search = { date: '2026-10-09', meal: '12345678-1234-1234-1234-123456789abc' };
    expect(parseDailySearch(search)).toEqual(search);
  });
  it('keeps the all-days selection after refresh', () => {
    expect(parseDailySearch({ date: 'all' })).toEqual({ date: 'all' });
  });
  it('ignores invalid dates and identifiers', () => {
    expect(parseDailySearch({ date: '2026-02-30', meal: '<script>' })).toEqual({});
    expect(parseDailySearch({ date: 123 })).toEqual({});
  });
});