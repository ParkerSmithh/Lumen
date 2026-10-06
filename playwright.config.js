import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 60000, fullyParallel: false,
  use: { channel: 'msedge', headless: true, baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 900 } },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30000 },
  reporter: 'list',
});