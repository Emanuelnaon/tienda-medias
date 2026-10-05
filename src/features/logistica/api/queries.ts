import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';
import { createSupabasePublicClient } from '@/src/lib/supabase/server';
import type { CoberturaEnvio, ZonaEnvio } from '@/src/features/logistica/types';

const SLUG_TENANT_PUBLICO = 'default';

const CAMPOS_ZONA_ENVIO =
    'id, nombre, codigo_postal_desde, codigo_postal_hasta, metodo, costo, minimo_envio_gratis, activo';

type ZonaEnvioRow = ZonaEnvio;

/**
 * Zonas de envío del tenant del administrador (uso exclusivo del panel admin).
 */
export async function listarZonasEnvio(): Promise<ZonaEnvio[]> {
    const supabase = await verificarAdministrador('gestionar zonas de envío');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('zonas_envio')
        .select(CAMPOS_ZONA_ENVIO)
        .eq('tenant_id', tenantId)
        .order('nombre', { ascending: true });

    if (error) {
        throw new Error(`No se pudieron cargar las zonas de envío: ${error.message}`);
    }

    return (data ?? []) as ZonaEnvioRow[];
}

/**
 * Cobertura de envío de la tienda pública para el checkout.
 * Se resuelve con el cliente anónimo: el comprador no tiene sesión.
 */
export async function consultarCoberturaEnvio(): Promise<CoberturaEnvio> {
    const supabase = createSupabasePublicClient();

    const { data: tenant, error: errorTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', SLUG_TENANT_PUBLICO)
        .maybeSingle();

    if (errorTenant || !tenant) {
        return { estaHabilitado: false, zonas: [] };
    }

    const { data: featureHabilitada, error: errorFeature } = await supabase.rpc(
        'tenant_tiene_feature',
        {
            p_feature_key: 'shipping_zones',
            p_tenant_id: tenant.id,
        },
    );

    if (errorFeature || featureHabilitada !== true) {
        return { estaHabilitado: false, zonas: [] };
    }

    const { data: zonas, error: errorZonas } = await supabase
        .from('zonas_envio')
        .select(CAMPOS_ZONA_ENVIO)
        .eq('tenant_id', tenant.id)
        .eq('activo', true);

    if (errorZonas) {
        console.error('Error al consultar las zonas de envío:', errorZonas.message);
        return { estaHabilitado: false, zonas: [] };
    }

    const listaZonas = (zonas ?? []) as ZonaEnvioRow[];

    return { estaHabilitado: listaZonas.length > 0, zonas: listaZonas };
}