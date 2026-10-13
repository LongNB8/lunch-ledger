import { describe, expect, it } from 'vitest';
import { dishSchema } from '../components/lunchdebt/dish-schema';

describe('dish icons', () => {
  it('defaults existing clients to utensils', () => {
    expect(dishSchema.parse({ name: 'Món mới', price: 10000 }).icon).toBe('utensils');
  });
  it('accepts selected icons', () => {
    expect(dishSchema.parse({ name: 'Cà phê', price: 25000, icon: 'coffee' }).icon).toBe('coffee');
  });
  it('rejects unknown icon identifiers', () => {
    expect(dishSchema.safeParse({ name: 'Món mới', price: 0, icon: 'unknown' }).success).toBe(false);
  });
});