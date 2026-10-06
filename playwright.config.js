import { browserOptions } from './scripts/browser-options.mjs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: Number(process.env.LUMEN_TEST_TIMEOUT || 60000), fullyParallel: false,
  expect: { timeout: Number(process.env.LUMEN_EXPECT_TIMEOUT || 5000) },
  use: { channel: browserOptions.channel, launchOptions: browserOptions, headless: true, baseURL: 'http://127.0.0.1:5175', viewport: { width: 1366, height: 768 } },
  globalSetup: './tests/browser/server.js',
  reporter: 'list',
});
