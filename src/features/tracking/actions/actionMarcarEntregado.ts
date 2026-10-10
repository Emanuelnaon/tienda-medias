'use server';

import { revalidatePath } from 'next/cache';
import { traducirErrorCambioEstado } from '@/src/features/logistica/utils';
import type { EstadoPedido } from '@/src/features/logistica';
import { createSupabasePublicClient } from '@/src/lib/supabase/server';
import { validarTokenRepartidor } from '@/src/features/tracking/actions/validarTokenRepartidor';

const CODIGO_PERMISO_DENEGADO = '42501';

export type ResultadoEntrega = {
    readonly success: true;
    readonly estado: EstadoPedido;
};

/**
 * El repartidor no tiene sesión: la autorización es el `token_seguimiento` del
 * enlace. La transición `en_camino → entregado` la valida el trigger de Postgres
 * (`registrar_cambio_estado_pedido`), que además escribe el historial.
 */
export async function actionMarcarEntregado(
    pedidoId: string,
    token: string,
): Promise<ResultadoEntrega> {
    const validacion = await validarTokenRepartidor(pedidoId, token);

    if (!validacion.valido || validacion.estado === null) {
        throw new Error('El enlace de seguimiento no es válido.');
    }

    if (validacion.estado !== 'en_camino') {
        throw new Error('Este pedido ya no está en camino.');
    }

    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase
        .from('pedidos')
        .update({ estado: 'entregado' })
        .eq('id', pedidoId)
        .eq('token_seguimiento', token)
        .select('id, estado')
        .maybeSingle();

    if (error) {
        if (error.code === CODIGO_PERMISO_DENEGADO) {
            throw new Error(
                'No se pudo confirmar la entrega: la base de datos rechazó la escritura para este enlace.',
            );
        }

        throw new Error(traducirErrorCambioEstado(error.message, error.code));
    }

    if (data === null || data.estado !== 'entregado') {
        throw new Error('No se encontró el pedido para ese enlace de seguimiento.');
    }

    revalidatePath(`/pedido/${pedidoId}`);

    return { success: true, estado: 'entregado' };
}