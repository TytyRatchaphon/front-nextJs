import { defineConfig } from "@playwright/test";

const APP_PORT = process.env.SITEMAP_APP_PORT || "3100";
const API_PORT = process.env.SITEMAP_API_PORT || "3101";
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const CACHE_KEY = process.env.SITEMAP_CACHE_KEY || `e2e-${Date.now()}`;
const DIAGNOSTIC_FILE = ".next-sitemap-e2e/sitemap-diagnostic.log";
process.env.SITEMAP_DIAGNOSTIC_FILE = DIAGNOSTIC_FILE;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "sitemap.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: { baseURL: APP_URL },
  webServer: [
    {
      command: `node e2e/fixtures/sitemap-api.mjs`,
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ...process.env,
        SITEMAP_API_PORT: API_PORT,
      },
    },
    {
      command: `${npmCommand} run dev:e2e -- --port ${APP_PORT}`,
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        API_URL,
        API_BASE_URL: API_URL,
        NEXT_PUBLIC_API_BASE_URL: API_URL,
        NEXT_PUBLIC_BASE_URL: "https://enjoybook.co",
        SITEMAP_CACHE_KEY: CACHE_KEY,
        SITEMAP_DIAGNOSTIC_FILE: DIAGNOSTIC_FILE,
        NEXT_DIST_DIR: ".next-sitemap-e2e",
      },
    },
  ],
});
