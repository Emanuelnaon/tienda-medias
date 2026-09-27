import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';
import type { Database } from '@/src/types/supabase';

export type DatosBancariosTenant = Pick<
    Database['public']['Tables']['tenants']['Row'],
    'cbu' | 'alias_bancario' | 'banco' | 'titular_cuenta' | 'meta_pixel_id'
>;

export async function obtenerDatosBancariosTenant(): Promise<DatosBancariosTenant | null> {
    const supabase = await verificarAdministrador('consultar datos bancarios del tenant');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('tenants')
        .select('cbu, alias_bancario, banco, titular_cuenta, meta_pixel_id')
        .eq('id', tenantId)
        .maybeSingle();

    if (error) {
        throw new Error(`No se pudieron cargar los datos bancarios: ${error.message}`);
    }

    return data as DatosBancariosTenant | null;
}
