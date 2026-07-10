import { defineConfig } from "vitest/config";
import path from "node:path";

// Alias @ → racine (comme jsconfig.json).
// include/exclude : les tests unitaires vitest sont tests/*.test.js ;
// tests/e2e/ contient les specs Playwright (*.spec.js) qui ne doivent
// jamais être chargées par vitest (test.describe de @playwright/test explose).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["tests/**/*.test.js"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
