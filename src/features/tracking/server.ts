/**
 * Contrato server-only del feature de tracking.
 *
 * Estas consultas usan el cliente público de Supabase de `next/headers`, por eso
 * NO se re-exportan desde `index.ts`: los Client Components importan el barrel
 * raíz, que debe seguir siendo compatible con el bundle del navegador.
 */
export { obtenerPosicionRepartidor, obtenerTrackingInicial } from '@/src/features/tracking/api/queries';