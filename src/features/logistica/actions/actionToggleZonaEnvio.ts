'use server';

import { revalidatePath } from 'next/cache';
import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';
import { traducirErrorZonaEnvio } from '@/src/features/logistica/utils/traducirErrores';

export async function actionToggleZonaEnvio(zonaId: string): Promise<{ activo: boolean }> {
    if (!zonaId || typeof zonaId !== 'string') {
        throw new Error('La zona de envío a actualizar es obligatoria.');
    }

    const supabase = await verificarAdministrador('configurar zonas de envío');
    const tenantId = await obtenerTenantIdAdmin();

    // Postgres no expone `SET activo = NOT activo` vía PostgREST:
    // el estado actual se lee del servidor y se escribe el contrario.
    const { data: zona, error: errorLectura } = await supabase
        .from('zonas_envio')
        .select('activo')
        .eq('id', zonaId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

    if (errorLectura) {
        throw new Error(traducirErrorZonaEnvio(errorLectura.message, errorLectura.code));
    }

    if (zona === null) {
        throw new Error('No se encontró la zona de envío o no pertenece a tu tienda.');
    }

    const activo = !zona.activo;

    const { error } = await supabase
        .from('zonas_envio')
        .update({ activo })
        .eq('id', zonaId)
        .eq('tenant_id', tenantId);

    if (error) {
        throw new Error(traducirErrorZonaEnvio(error.message, error.code));
    }

    revalidatePath('/admin/configuracion');

    return { activo };
}