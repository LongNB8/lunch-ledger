import { describe, expect, it } from 'vitest';
import { loginEmail } from '../components/lunchdebt/login-identity';

describe('special management login', () => {
  it('accepts the requested admin username without email entry', () => {
    expect(loginEmail('admin')).toBe('admin@lunchdebt.local');
    expect(loginEmail(' ADMIN ')).toBe('admin@lunchdebt.local');
  });
  it('keeps regular email accounts separate from the special account', () => {
    expect(loginEmail('person@example.com')).toBe('person@example.com');
    expect(loginEmail('other')).toBe('other');
  });
});