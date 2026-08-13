import { type NextRequest } from 'next/server';
import { updateSession } from '@/src/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // En cada navegación, interceptamos la petición y refrescamos la sesión de Supabase
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Aplica a todas las rutas excepto:
         * - _next/static (archivos estáticos)
         * - _next/image (imágenes optimizadas)
         * - favicon.ico (ícono del sitio)
         * - Imágenes y recursos estáticos (.svg, .png, .jpg, .jpeg, .gif, .webp)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
