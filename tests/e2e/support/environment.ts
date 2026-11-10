export const E2E_MODE = { SMOKE: 'smoke', STAGING: 'staging' } as const;
export type E2EEnvironmentMode = typeof E2E_MODE[keyof typeof E2E_MODE];

function getHostFromSupabaseUrl(url: string): string {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port ||
            parsed.pathname !== '/' || parsed.search || parsed.hash) {
            throw new Error('Invalid project URL');
        }
        return parsed.host.toLowerCase();
    } catch {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL inválida para entorno E2E.');
    }
}

export function validateE2EEnvironment(mode: E2EEnvironmentMode): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL para ejecutar Playwright.');
    }

    const expectedRef = process.env.E2E_EXPECTED_SUPABASE_PROJECT_REF?.trim().toLowerCase();
    const allowWrites = process.env.E2E_ALLOW_WRITES === 'true';

    if (!expectedRef) {
        throw new Error(
            'E2E bloqueado: falta E2E_EXPECTED_SUPABASE_PROJECT_REF (referencia no secreta del proyecto staging).'
        );
    }
    if (!/^[a-z0-9]{20}$/.test(expectedRef)) {
        throw new Error('E2E bloqueado: referencia de proyecto invalida.');
    }
    if (mode === E2E_MODE.STAGING && !allowWrites) {
        throw new Error('Suite staging bloqueada: requiere E2E_ALLOW_WRITES=true explícito.');
    }

    const host = getHostFromSupabaseUrl(supabaseUrl);
    const expectedHost = `${expectedRef}.supabase.co`;
    if (host !== expectedHost) {
        throw new Error(
            'E2E bloqueado: destino Supabase no coincide con la referencia staging esperada.'
        );
    }
}

export function getStagingAdminCredentials(): { email: string; password: string } {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!email || !password) {
        throw new Error('Faltan E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD para suite staging.');
    }
    return { email, password };
}
