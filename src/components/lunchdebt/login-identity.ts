export function loginEmail(identity: string) {
  const normalized = identity.trim().toLowerCase();
  return normalized === 'admin' ? 'admin@lunchdebt.local' : normalized;
}