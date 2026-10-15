// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { applyEnvAliases, isRealValue } from "./src/lib/env-aliases";

// Expose the *_2 project variables to the browser bundle as VITE_* at build time.
applyEnvAliases();
const browserEnv: Record<string, string | undefined> = {
  VITE_SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,
  VITE_SUPABASE_URL: process.env.SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
};
for (const [key, value] of Object.entries(browserEnv)) {
  if (isRealValue(value) && !isRealValue(process.env[key])) process.env[key] = value;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ...(process.env.VERCEL ? { nitro: { preset: "vercel" } } : {}),
});
