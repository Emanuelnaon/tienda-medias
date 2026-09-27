import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';

export async function tieneFeature(featureKey: string): Promise<boolean> {
    if (!featureKey || typeof featureKey !== 'string') {
        return false;
    }

    const supabase = await verificarAdministrador('consultar features del plan');
    const tenantId = await obtenerTenantIdAdmin();

    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('plan')
        .eq('id', tenantId)
        .maybeSingle();

    if (tenantError || !tenant) {
        return false;
    }

    const { data, error } = await supabase
        .from('plan_features')
        .select('enabled')
        .eq('feature_key', featureKey)
        .eq('plan', tenant.plan)
        .eq('enabled', true)
        .maybeSingle();

    if (error) {
        return false;
    }

    return data !== null;
}
