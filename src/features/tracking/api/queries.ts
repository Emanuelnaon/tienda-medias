import { createSupabasePublicClient } from '@/src/lib/supabase/server';
import type { PedidoTracking, PosicionRepartidor } from '@/src/features/tracking/types';
import {
    normalizarPosicion,
    normalizarTracking,
} from '@/src/features/tracking/utils/normalizarTracking';

/**
 * Tracking del pedido para el cliente final. El token es la única credencial:
 * si no coincide, el RPC lanza excepción y acá se devuelve `null`.
 */
export async function obtenerTrackingInicial(
    pedidoId: string,
    token: string,
): Promise<PedidoTracking | null> {
    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase.rpc('get_pedido_tracking', {
        p_pedido_id: pedidoId,
        p_token: token,
    });

    if (error) {
        console.error('Error al obtener el tracking del pedido:', error.message);
        return null;
    }

    return normalizarTracking(data);
}

/**
 * Última posición conocida del repartidor. `null` significa "todavía no
 * reportó posición", no "token inválido" (ese caso vuelve con `error`).
 */
export async function obtenerPosicionRepartidor(
    pedidoId: string,
    token: string,
): Promise<PosicionRepartidor | null> {
    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase.rpc('get_delivery_position', {
        p_pedido_id: pedidoId,
        p_token: token,
    });

    if (error) {
        console.error('Error al obtener la posición del repartidor:', error.message);
        return null;
    }

    return normalizarPosicion(data);
}