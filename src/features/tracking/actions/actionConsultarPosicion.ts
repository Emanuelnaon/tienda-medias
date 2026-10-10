'use server';

import { obtenerPosicionRepartidor } from '@/src/features/tracking/api/queries';
import type { PosicionRepartidor } from '@/src/features/tracking/types';

/**
 * Última posición reportada por el repartidor, para el polling del mapa.
 * `null` = todavía no reportó posición (o el token dejó de ser válido).
 */
export async function actionConsultarPosicion(
    pedidoId: string,
    token: string,
): Promise<PosicionRepartidor | null> {
    return obtenerPosicionRepartidor(pedidoId, token);
}