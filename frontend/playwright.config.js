import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel:
      process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command:
        process.platform === 'win32'
          ? '..\\fluxo\\Scripts\\python.exe -m tests.serve_frontend'
          : '../fluxo/bin/python -m tests.serve_frontend',
      cwd: fileURLToPath(new URL('../backend', import.meta.url)),
      url: 'http://127.0.0.1:8001/openapi.json',
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev',
      url: 'http://127.0.0.1:5173',
      env: { API_TARGET: 'http://127.0.0.1:8001' },
      reuseExistingServer: false,
    },
  ],
});
