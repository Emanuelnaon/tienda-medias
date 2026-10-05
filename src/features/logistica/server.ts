/**
 * Contrato server-only del feature de logística.
 *
 * Estas consultas usan el cliente de Supabase del servidor (`next/headers`), por
 * eso NO se re-exportan desde `index.ts`: los Client Components importan el
 * barrel raíz, que debe seguir siendo compatible con el bundle del navegador.
 */
export { consultarCoberturaEnvio, listarZonasEnvio } from '@/src/features/logistica/api/queries';