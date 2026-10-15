// The Vercel project stores this app's credentials with a "_2" suffix so they
// don't collide with another app's variables. Prefer the suffixed values.
const ALIASED_KEYS = [
  "SUPABASE_PROJECT_ID",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "REPORT_ADMIN_EMAIL",
] as const;

export function applyEnvAliases() {
  if (typeof process === "undefined" || !process.env) return;
  for (const key of ALIASED_KEYS) {
    const suffixed = process.env[`${key}_2`];
    if (suffixed) process.env[key] = suffixed;
  }
}

applyEnvAliases();
