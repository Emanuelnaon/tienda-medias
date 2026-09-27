'use server';

import { revalidatePath } from 'next/cache';
import type { Database } from '@/src/types/supabase';
import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';
import { calcularEtiquetaCliente } from '@/src/features/admin/utils';

type ClienteRow = Database['public']['Tables']['clientes']['Row'];

type PedidoResumen = Pick<
    Database['public']['Tables']['pedidos']['Row'],
    'id' | 'created_at' | 'total' | 'estado' | 'comprobante_numero'
>;

type EtiquetaCliente = {
    readonly texto: string;
    readonly estilos: string;
};

export type ClienteConEtiqueta = ClienteRow & {
    readonly etiqueta: EtiquetaCliente | null;
};

export type ClienteConPedidos = ClienteRow & {
    readonly pedidos: ReadonlyArray<PedidoResumen>;
};

export async function listarClientes(): Promise<ClienteConEtiqueta[]> {
    const supabase = await verificarAdministrador('gestionar clientes');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('total_gastado', { ascending: false });

    if (error) {
        throw new Error(`No se pudieron cargar los clientes: ${error.message}`);
    }

    return (data ?? []).map((cliente) => ({
        ...cliente,
        etiqueta: calcularEtiquetaCliente(cliente.cantidad_pedidos ?? null),
    }));
}

export async function obtenerClientePorId(id: string): Promise<ClienteConPedidos | null> {
    if (!id || typeof id !== 'string') {
        throw new Error('El ID del cliente es requerido y debe ser válido.');
    }

    const supabase = await verificarAdministrador('gestionar clientes');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('clientes')
        .select('*, pedidos(id, created_at, total, estado, comprobante_numero)')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { foreignTable: 'pedidos', ascending: false })
        .maybeSingle();

    if (error) {
        throw new Error(`No se pudo cargar el cliente: ${error.message}`);
    }

    return data as unknown as ClienteConPedidos | null;
}

export async function actualizarNotasCliente(
    id: string,
    notas: string,
): Promise<{ success: boolean; clienteId: string }> {
    if (!id || typeof id !== 'string') {
        throw new Error('El ID del cliente es requerido y debe ser válido.');
    }

    const supabase = await verificarAdministrador('gestionar clientes');
    const tenantId = await obtenerTenantIdAdmin();

    const notasTrimmed = notas.trim();
    const notasValue = notasTrimmed === '' ? null : notasTrimmed;

    const { data, error } = await supabase
        .from('clientes')
        .update({ notas: notasValue })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select('id')
        .single();

    if (error) {
        throw new Error(`Error al actualizar las notas: ${error.message}`);
    }

    revalidatePath('/admin/clientes');
    revalidatePath(`/admin/clientes/${id}`);

    return { success: true, clienteId: (data as { id: string }).id };
}