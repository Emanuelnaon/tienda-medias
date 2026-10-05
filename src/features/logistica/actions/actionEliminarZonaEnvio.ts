'use server';

import { revalidatePath } from 'next/cache';
import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';
import { traducirErrorZonaEnvio } from '@/src/features/logistica/utils/traducirErrores';

export async function actionEliminarZonaEnvio(zonaId: string): Promise<{ eliminado: true }> {
    if (!zonaId || typeof zonaId !== 'string') {
        throw new Error('La zona de envío a eliminar es obligatoria.');
    }

    const supabase = await verificarAdministrador('configurar zonas de envío');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('zonas_envio')
        .delete()
        .eq('id', zonaId)
        .eq('tenant_id', tenantId)
        .select('id')
        .maybeSingle();

    if (error) {
        throw new Error(traducirErrorZonaEnvio(error.message, error.code));
    }

    if (data === null) {
        throw new Error('No se encontró la zona de envío o no pertenece a tu tienda.');
    }

    revalidatePath('/admin/configuracion');

    return { eliminado: true };
}