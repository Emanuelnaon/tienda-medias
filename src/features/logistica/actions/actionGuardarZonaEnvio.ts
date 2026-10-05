'use server';

import { revalidatePath } from 'next/cache';
import { verificarAdministrador, obtenerTenantIdAdmin } from '@/src/lib/auth/admin';
import { METODOS_ENVIO, type ZonaEnvio } from '@/src/features/logistica/types';
import { zonaEnvioSchema, type ZonaEnvioInput } from '@/src/features/logistica/utils/zonaEnvioSchema';
import { traducirErrorZonaEnvio } from '@/src/features/logistica/utils/traducirErrores';

export async function actionGuardarZonaEnvio(input: ZonaEnvioInput): Promise<ZonaEnvio> {
    const parsed = zonaEnvioSchema.safeParse(input);

    if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message ?? 'Datos de zona de envío inválidos');
    }

    const zona = parsed.data;

    const supabase = await verificarAdministrador('configurar zonas de envío');
    const tenantId = await obtenerTenantIdAdmin();

    const { data, error } = await supabase
        .from('zonas_envio')
        .insert({
            tenant_id: tenantId,
            nombre: zona.nombre,
            codigo_postal_desde: zona.codigo_postal_desde === '' ? null : zona.codigo_postal_desde,
            codigo_postal_hasta: zona.codigo_postal_hasta === '' ? null : zona.codigo_postal_hasta,
            metodo: zona.metodo,
            costo: zona.metodo === METODOS_ENVIO.retiro ? 0 : (zona.costo ?? 0),
            minimo_envio_gratis:
                zona.minimo_envio_gratis === '' ? null : Number(zona.minimo_envio_gratis),
            activo: true,
        })
        .select()
        .single();

    if (error) {
        throw new Error(traducirErrorZonaEnvio(error.message, error.code));
    }

    revalidatePath('/admin/configuracion');

    return data as ZonaEnvio;
}