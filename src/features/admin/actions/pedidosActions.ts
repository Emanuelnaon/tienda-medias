'use server';

import { revalidatePath } from 'next/cache';
import type { Database, Json } from '@/src/types/supabase';
import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';

type ClienteResumen = Pick<
    Database['public']['Tables']['clientes']['Row'],
    'nombre_completo' | 'telefono' | 'estado'
>;

type ClienteDetalle = Database['public']['Tables']['clientes']['Row'];

type PedidoItem = Pick<
    Database['public']['Tables']['pedidos_items']['Row'],
    'id' | 'nombre_producto' | 'talle' | 'cantidad' | 'precio_unitario'
>;

export type PedidoPendiente = {
    readonly id: string;
    readonly created_at: string | null;
    readonly total: number;
    readonly estado: string | null;
    readonly comprobante_url: string | null;
    readonly comprobante_numero: string | null;
    readonly cliente: ClienteResumen | null;
    readonly items: ReadonlyArray<PedidoItem>;
};

export type PedidoDetalle = Omit<PedidoPendiente, 'cliente'> & {
    readonly cliente: ClienteDetalle | null;
    readonly cliente_id: string | null;
};

const ESTADOS_PEDIDO_WHITELIST = ['pendiente', 'confirmado', 'todos'] as const;
type EstadoPedido = (typeof ESTADOS_PEDIDO_WHITELIST)[number];

export async function listarPedidosPendientes(estado?: string): Promise<PedidoPendiente[]> {
    const supabase = await verificarAdministrador('gestionar pedidos');
    const tenantId = await obtenerTenantIdAdmin();

    if (estado && !ESTADOS_PEDIDO_WHITELIST.includes(estado as EstadoPedido)) {
        throw new Error(`Estado de pedido inválido: ${estado}.`);
    }

    let query = supabase
        .from('pedidos')
        .select(
            'id, created_at, total, estado, comprobante_url, comprobante_numero, cliente:clientes(nombre_completo, telefono, estado), items:pedidos_items(id, nombre_producto, talle, cantidad, precio_unitario)',
        )
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true });

    if (estado && estado !== 'todos') {
        query = query.eq('estado', estado);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
    }

    return (data ?? []) as unknown as PedidoPendiente[];
}

/**
 * Confirmar Acreditación del Pedido
 * Ejecuta la RPC transaccional en PostgreSQL.
 */
export async function confirmarPedido(pedidoId: string): Promise<Json> {
    if (!pedidoId || typeof pedidoId !== 'string') {
        throw new Error('El ID del pedido es requerido y debe ser válido.');
    }

    try {
        const clienteBase = await verificarAdministrador('gestionar pedidos');

        const { data, error } = await clienteBase.rpc('confirmar_pedido_transaccion', {
            p_pedido_id: pedidoId,
        });

        if (error) {
            throw new Error(`Error en base de datos: ${error.message}`);
        }

        revalidatePath('/admin/pedidos');
        revalidatePath('/admin/clientes');
        revalidatePath('/admin/crm');
        revalidatePath('/catalogo');

        return data;
    } catch (error) {
        const mensajeError = error instanceof Error ? error.message : 'Error desconocido al confirmar el pedido.';
        console.error('Error en confirmarPedido:', mensajeError);
        throw new Error(mensajeError);
    }
}

/**
 * Obtener detalle completo de un pedido por ID (con cliente e items)
 */
export async function obtenerPedidoPorId(id: string): Promise<PedidoDetalle> {
    if (!id || typeof id !== 'string') {
        throw new Error('El ID del pedido es requerido y debe ser válido.');
    }

    const supabase = await verificarAdministrador('gestionar pedidos');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('pedidos')
        .select(
            '*, cliente:clientes(*), items:pedidos_items(*)',
        )
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

    if (error) {
        throw new Error(`No se pudo cargar el pedido: ${error.message}`);
    }

    return data as unknown as PedidoDetalle;
}

/**
 * Guardar número de comprobante en un pedido
 */
export async function guardarComprobante(
    pedidoId: string,
    numero: string,
): Promise<{ success: boolean; pedidoId: string }> {
    if (!pedidoId || typeof pedidoId !== 'string') {
        throw new Error('El ID del pedido es requerido y debe ser válido.');
    }

    if (!numero || numero.trim().length === 0) {
        throw new Error('El número de comprobante no puede estar vacío.');
    }

    const supabase = await verificarAdministrador('gestionar pedidos');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('pedidos')
        .update({ comprobante_numero: numero.trim() })
        .eq('id', pedidoId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

    if (error) {
        throw new Error(`Error al guardar el comprobante: ${error.message}`);
    }

    revalidatePath('/admin/pedidos');
    revalidatePath(`/admin/pedidos/${pedidoId}`);

    return { success: true, pedidoId: (data as { id: string }).id };
}
