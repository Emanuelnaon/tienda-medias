import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { validateE2EEnvironment } from './tests/e2e/support/environment';

const projectRoot = __dirname;
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
    throw new Error('Playwright local requiere NODE_ENV=development o sin definir.');
}
loadEnvConfig(projectRoot, true);
validateE2EEnvironment('smoke');

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
    testDir: './tests/e2e/smoke',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120 * 1000,
        cwd: projectRoot,
        env: {
            NODE_ENV: 'development',
        },
    },
});
