'use server';

import { revalidatePath } from 'next/cache';
import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';

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

export async function listarPedidosPendientes(): Promise<PedidoPendiente[]> {
    const supabase = await verificarAdministrador('gestionar pedidos');
    const tenantId = await obtenerTenantIdAdmin();
    const { data, error } = await supabase
        .from('pedidos')
        .select(
            'id, created_at, total, comprobante_url, cliente:clientes(nombre_completo, telefono, estado), items:pedidos_items(id, nombre_producto, talle, cantidad, precio_unitario)',
        )
        .eq('tenant_id', tenantId)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
    }

    return (data ?? []) as unknown as PedidoPendiente[];
}

/**
 * Confirmar Acreditación del Pedido
 * Ejecuta la RPC transaccional en PostgreSQL.
 */
export async function confirmarPedido(pedidoId: string): Promise<{ success: boolean; mensaje: string }> {
    if (!pedidoId || typeof pedidoId !== 'string') {
        throw new Error('El ID del pedido es requerido y debe ser válido.');
    }

    try {
        const clienteBase = await verificarAdministrador('gestionar pedidos');

        const { error } = await clienteBase.rpc('confirmar_pedido_transaccion', {
            pedido_id: pedidoId,
        });

        if (error) {
            throw new Error(`Error en base de datos: ${error.message}`);
        }

        revalidatePath('/admin/pedidos');
        revalidatePath('/admin/clientes');
        revalidatePath('/admin/crm');
        revalidatePath('/catalogo');

        return { success: true, mensaje: 'Venta confirmada y CRM actualizado.' };
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
