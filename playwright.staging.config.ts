import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { validateE2EEnvironment } from './tests/e2e/support/environment';

const projectRoot = __dirname;
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
    throw new Error('Playwright local requiere NODE_ENV=development o sin definir.');
}
loadEnvConfig(projectRoot, true);
validateE2EEnvironment('staging');

// H1 must not execute the legacy checkout before H2 and cleanup are validated.
throw new Error('Suite staging bloqueada: H2, referencia staging y limpieza segura pendientes de validacion.');

const baseURL = 'http://127.0.0.1:3100';

export default defineConfig({
    testDir: './tests/e2e/staging',
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    workers: 1,
    reporter: 'line',
    use: {
        baseURL,
        trace: 'off',
        screenshot: 'off',
        video: 'off',
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
