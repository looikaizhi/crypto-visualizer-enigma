import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  timeout: 45_000,
  expect: {
    timeout: 7_500,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 1600 },
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command:
        '.venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: path.resolve(__dirname, '../../services/enigma-api'),
      url: 'http://127.0.0.1:8000/rotors',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm start',
      cwd: __dirname,
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        BROWSER: 'none',
        HOST: '127.0.0.1',
        PORT: '3000',
      },
    },
  ],
});
