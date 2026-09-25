'use server';

import { createSupabasePublicClient } from '@/src/lib/supabase/server';

export interface ListaEsperaInput {
    producto_id: string;
    tenant_id: string;
    variante_id?: string | null;
    email?: string | null;
    telefono: string;
}

/**
 * Server Action para registrar un usuario en la lista de espera de un producto/variante.
 */
export async function actionCrearListaEspera(input: ListaEsperaInput): Promise<{ success: boolean; mensaje: string }> {
    if (!input.telefono || !input.telefono.trim()) {
        throw new Error('El teléfono es requerido');
    }

    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase.rpc('crear_lista_espera', {
        p_tenant_id: input.tenant_id,
        p_producto_id: input.producto_id,
        p_telefono: input.telefono.trim(),
        p_variante_id: input.variante_id ?? undefined,
        p_email: input.email?.trim() || undefined,
    });

    if (error || !data) {
        throw new Error(error?.message || 'No se pudo registrar en la lista de espera');
    }

    return { 
        success: true, 
        mensaje: 'Te has unido con éxito. Te avisaremos cuando vuelva a haber stock disponible.' 
    };
}
