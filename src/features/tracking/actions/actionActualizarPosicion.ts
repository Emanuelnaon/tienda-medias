'use server';

import { createSupabasePublicClient } from '@/src/lib/supabase/server';
import { validarTokenRepartidor } from '@/src/features/tracking/actions/validarTokenRepartidor';

export type ResultadoPosicion = {
    readonly success: true;
    readonly lat: number;
    readonly lng: number;
};

function esCoordenadaValida(valor: number, minimo: number, maximo: number): boolean {
    return Number.isFinite(valor) && valor >= minimo && valor <= maximo;
}

/**
 * El repartidor escribe su ubicación vía `upsert_delivery_position`, que valida
 * el token y exige que el pedido siga `en_camino`.
 */
export async function actionActualizarPosicion(
    pedidoId: string,
    token: string,
    lat: number,
    lng: number,
): Promise<ResultadoPosicion> {
    if (!esCoordenadaValida(lat, -90, 90) || !esCoordenadaValida(lng, -180, 180)) {
        throw new Error('La ubicación reportada no es válida.');
    }

    const validacion = await validarTokenRepartidor(pedidoId, token);

    if (!validacion.valido || validacion.estado === null) {
        throw new Error('El enlace de seguimiento no es válido.');
    }

    if (validacion.estado !== 'en_camino') {
        throw new Error('Este pedido ya no está en camino.');
    }

    const supabase = createSupabasePublicClient();

    const { error } = await supabase.rpc('upsert_delivery_position', {
        p_pedido_id: pedidoId,
        p_token: token,
        p_lat: lat,
        p_lng: lng,
    });

    if (error) {
        console.error('Error al actualizar la posición del repartidor:', error.message);
        throw new Error('No se pudo actualizar la ubicación.');
    }

    return { success: true, lat, lng };
}