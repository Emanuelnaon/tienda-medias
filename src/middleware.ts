import { type NextRequest } from 'next/server';
import { updateSession } from '@/src/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // 1. Refrescamos la sesión de Supabase
    const response = await updateSession(request);

    // 2. Inyectamos las cabeceras de seguridad requeridas a la respuesta
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://adauxoedgfvaadkvvifu.supabase.co https://www.google-analytics.com https://*.googletagmanager.com",
            "connect-src 'self' https://adauxoedgfvaadkvvifu.supabase.co wss://adauxoedgfvaadkvvifu.supabase.co https://wa.me https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
            "font-src 'self' data:",
            "object-src 'none'",
        ].join('; '),
    );

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
