import { createSupabasePublicClient } from '@/src/lib/supabase/server';

export interface PedidoItemConfirmacion {
    id: string;
    nombre_producto: string;
    talle: string | null;
    cantidad: number;
    precio_unitario: number;
}

export interface PedidoTenantConfirmacion {
    nombre: string;
    cbu: string | null;
    alias_bancario: string | null;
    banco: string | null;
    titular_cuenta: string | null;
    whatsapp: string | null;
    plan: string;
}

export interface PedidoConfirmacion {
    id: string;
    total: number;
    estado: string | null;
    created_at: string | null;
    tenant_id: string;
    items: PedidoItemConfirmacion[];
    tenant: PedidoTenantConfirmacion;
}

export async function obtenerPedidoConfirmacion(id: string): Promise<PedidoConfirmacion | null> {
    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase
        .from('pedidos')
        .select(
            `id, total, estado, created_at, tenant_id,
            items:pedidos_items(id, nombre_producto, talle, cantidad, precio_unitario),
            tenant:tenants!inner(nombre, cbu, alias_bancario, banco, titular_cuenta, whatsapp, plan)`,
        )
        .eq('id', id)
        .maybeSingle();

    if (error) {
        console.error('Error al obtener el pedido de confirmación:', error.message);
        return null;
    }

    return (data ?? null) as PedidoConfirmacion | null;
}

export async function tieneFeaturePago(plan: string): Promise<boolean> {
    if (!plan) {
        return false;
    }

    const supabase = createSupabasePublicClient();

    const { data, error } = await supabase
        .from('plan_features')
        .select('enabled')
        .eq('feature_key', 'payment_confirmation')
        .eq('plan', plan)
        .eq('enabled', true)
        .maybeSingle();

    if (error) {
        console.error('Error al consultar plan_features:', error.message);
        return false;
    }

    return data !== null;
}
