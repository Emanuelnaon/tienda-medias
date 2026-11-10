import { defineConfig, devices } from '@playwright/test';

// Destino por defecto: aplicación local (npm run dev en localhost:3000).
// webServer arranca y espera a que esté listo antes de correr los tests.
export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
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
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});

// --- Alternativa: probar la branch desplegada en Vercel ---
// Para usarla, descomenta la línea de `baseURL` y elimina o comenta el bloque `webServer`.
// Los tests navegarán al despliegue remoto y no arrancarán un servidor local.
// baseURL: 'https://tienda-medias-git-modeladoweb-emanuels-projects-fcfc95fa.vercel.app/',