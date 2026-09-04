'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';

export type PedidoPendiente = {
    readonly id: string;
    readonly created_at: string | null;
    readonly total: number;
    readonly comprobante_url: string | null;
    readonly cliente: {
        readonly nombre_completo: string;
        readonly telefono: string;
        readonly estado: string | null;
    } | null;
    readonly items: ReadonlyArray<{
        readonly id: string;
        readonly nombre_producto: string;
        readonly talle: string | null;
        readonly cantidad: number;
        readonly precio_unitario: number;
    }>;
};

async function verificarAdministrador() {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Debes iniciar sesión para gestionar pedidos.');
    }

    const { data: administrador, error } = await supabase.from('admin_users').select('id').eq('id', user.id).single();
    if (error || !administrador) {
        throw new Error('No tienes permisos para gestionar pedidos.');
    }

    return supabase;
}

export async function listarPedidosPendientes(): Promise<PedidoPendiente[]> {
    const supabase = await verificarAdministrador();
    const { data, error } = await supabase
        .from('pedidos')
        .select(
            'id, created_at, total, comprobante_url, cliente:clientes(nombre_completo, telefono, estado), items:pedidos_items(id, nombre_producto, talle, cantidad, precio_unitario)',
        )
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
    }

    return (data ?? []) as unknown as PedidoPendiente[];
}

/**
 * Confirmar Acreditación del Pedido (Tickets 6.1 y 6.2)
 * Ejecuta la RPC transaccional 'confirmar_pedido_transaccion' en PostgreSQL.
 */
export async function confirmarPedido(pedidoId: string): Promise<{ success: boolean; mensaje: string }> {
    if (!pedidoId || typeof pedidoId !== 'string') {
        throw new Error('El ID del pedido es requerido y debe ser válido.');
    }

    try {
        const supabase = await verificarAdministrador();

        // Se define explícitamente el tipo de parámetros para la RPC creada
        const { data, error } = await (
            supabase.rpc as unknown as (fn: string, args: { p_pedido_id: string }) => ReturnType<typeof supabase.rpc>
        )('confirmar_pedido_transaccion', {
            p_pedido_id: pedidoId,
        });

        if (error) {
            throw new Error(`Error en base de datos: ${error.message}`);
        }

        const respuesta = data as { success: boolean; mensaje: string };

        revalidatePath('/admin/pedidos');
        revalidatePath('/admin/clientes');

        return respuesta;
    } catch (error) {
        const mensajeError = error instanceof Error ? error.message : 'Error desconocido al confirmar el pedido.';
        console.error('Error en confirmarPedido:', mensajeError);
        throw new Error(mensajeError);
    }
}

/**
 * Wrapper para FormData (compatibilidad con elementos interactivos de UI)
 */
export async function confirmarVentaYActualizarCrm(formData: FormData): Promise<void> {
    const pedidoId = formData.get('pedidoId');
    if (typeof pedidoId !== 'string' || !pedidoId) {
        throw new Error('El pedido no es válido.');
    }

    await confirmarPedido(pedidoId);
}
