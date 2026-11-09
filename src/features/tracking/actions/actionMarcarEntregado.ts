'use server';

import { revalidatePath } from 'next/cache';
import { createSupabasePublicClient } from '@/src/lib/supabase/server';

export type ResultadoEntrega =
    | { readonly ok: true }
    | { readonly ok: false; readonly error: string };

/**
 * El repartidor no tiene sesión: la autorización es el `token_seguimiento` del
 * enlace. La transición `en_camino → entregado` la valida el trigger de Postgres
 * (`registrar_cambio_estado_pedido`), que además escribe el historial.
 */
export async function actionMarcarEntregado(
    pedidoId: string,
    token: string,
): Promise<ResultadoEntrega> {
    const supabase = createSupabasePublicClient();
    const { error } = await supabase.rpc('marcar_entregado', {
        p_pedido_id: pedidoId,
        p_token: token,
    });

    if (error) {
        if (error.message.includes('TOKEN_INVALIDO')) {
            return { ok: false, error: 'El enlace no es válido.' };
        }

        if (error.message.includes('ESTADO_INVALIDO')) {
            return { ok: false, error: 'El pedido todavía no está en camino.' };
        }

        console.error('Error al marcar el pedido como entregado:', error);
        return {
            ok: false,
            error: 'No pudimos marcar el pedido como entregado. Intentá de nuevo.',
        };
    }

    revalidatePath('/pedido/' + pedidoId);

    return { ok: true };
}
