'use server';

import { revalidatePath } from 'next/cache';
import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';
import { datosBancariosSchema, type DatosBancariosInput } from '@/src/features/configuracion-pagos/utils/datosBancariosSchema';
import type { Database } from '@/src/types/supabase';

export async function actionGuardarDatosBancarios(
    input: DatosBancariosInput,
): Promise<Database['public']['Tables']['tenants']['Row']> {
    const parsed = datosBancariosSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message ?? 'Datos bancarios inválidos');
    }

    const update: Database['public']['Tables']['tenants']['Update'] = {
        cbu: parsed.data.cbu || null,
        alias_bancario: parsed.data.alias_bancario || null,
        banco: parsed.data.banco || null,
        titular_cuenta: parsed.data.titular_cuenta || null,
        meta_pixel_id: parsed.data.meta_pixel_id || null,
    };

    const supabase = await verificarAdministrador('configurar métodos de pago');
    const tenantId = await obtenerTenantIdAdmin();
    if (!tenantId) {
        throw new Error('Solo los admins de tenant pueden guardar datos bancarios');
    }

    const { data, error } = await supabase
        .from('tenants')
        .update(update)
        .eq('id', tenantId)
        .select()
        .single();

    if (error) {
        throw new Error(`No se pudieron guardar los datos bancarios: ${error.message}`);
    }

    revalidatePath('/admin/configuracion');

    return data as Database['public']['Tables']['tenants']['Row'];
}
