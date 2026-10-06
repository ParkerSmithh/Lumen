import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 60000, fullyParallel: false,
  use: { channel: 'msedge', headless: true, baseURL: 'http://127.0.0.1:5175', viewport: { width: 1366, height: 768 } },
  globalSetup: './tests/browser/server.js',
  reporter: 'list',
});
