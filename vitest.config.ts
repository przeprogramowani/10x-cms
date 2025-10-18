import {defineConfig} from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Środowisko testowe (node dla backend, jsdom dla frontend)
    environment: "node",

    // Globalne importy - nie trzeba importować describe, it, expect w każdym pliku
    globals: true,

    // Pokrycie kodu
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/db/migrations/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types.ts",
      ],
    },

    // Wzorce plików testowych
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    // Pliki do wykluczenia
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],

    // Timeout dla testów (w ms)
    testTimeout: 10000,

    // Konfiguracja watch mode
    watch: false,

    // Pool - jak testy są uruchamiane ('threads' | 'forks' | 'vmThreads')
    pool: "threads",

    // Czy pokazywać szczegółowe logi
    logHeapUsage: false,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@db": path.resolve(__dirname, "./src/db"),
    },
  },
});
