'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';

export type PedidoPendiente = {
    id: string;
    created_at: string | null;
    total: number;
    comprobante_url: string | null;
    cliente: {
        nombre_completo: string;
        telefono: string;
        estado: string | null;
    } | null;
    items: Array<{
        id: string;
        nombre_producto: string;
        talle: string | null;
        cantidad: number;
        precio_unitario: number;
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

export async function confirmarVentaYActualizarCrm(formData: FormData): Promise<void> {
    const pedidoId = formData.get('pedidoId');
    if (typeof pedidoId !== 'string' || !pedidoId) {
        throw new Error('El pedido no es válido.');
    }

    const supabase = await verificarAdministrador();
    const { error } = await supabase.rpc('confirmar_venta_y_actualizar_crm', { pedido_id: pedidoId } as never);

    if (error) {
        throw new Error(`No se pudo confirmar el pedido: ${error.message}`);
    }

    revalidatePath('/admin/pedidos');
}
