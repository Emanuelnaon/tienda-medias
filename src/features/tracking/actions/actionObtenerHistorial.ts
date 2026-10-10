'use server';

import { obtenerTrackingInicial } from '@/src/features/tracking/api/queries';
import type { EntradaHistorial } from '@/src/features/tracking/types';

/**
 * Historial refreshed del pedido para el fallback de polling del cliente.
 * `null` = token inválido o pedido inexistente (el RPC lanza excepción).
 */
export async function actionObtenerHistorial(
    pedidoId: string,
    token: string,
): Promise<ReadonlyArray<EntradaHistorial> | null> {
    const tracking = await obtenerTrackingInicial(pedidoId, token);

    return tracking === null ? null : tracking.historial;
}