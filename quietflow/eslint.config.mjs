import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendored native-platform output. These are Capacitor and
    // Tauri build artifacts, not source — linting them buried the ~190 real
    // source findings under ~18,600 generated ones.
    "android/**",
    "ios/**",
    "src-tauri/target/**",
    "dist/**",
    "lint-raw.json",
  ]),
]);

export default eslintConfig;
