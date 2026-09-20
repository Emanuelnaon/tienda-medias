import { createSupabaseServerClient } from '@/src/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function verificarAdministrador(
    context: string = 'realizar esta operación',
): Promise<SupabaseClient> {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(`Debes iniciar sesión para ${context}.`);
    }

    const { data: administrador, error } =
        await supabase.from('admin_users').select('id').eq('id', user.id).single();

    if (error || !administrador) {
        throw new Error(`No tienes permisos para ${context}.`);
    }

    return supabase;
}

export async function obtenerTenantIdAdmin(): Promise<string> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_my_tenant_id');

    if (error) {
        throw new Error(`Error al obtener el tenant del administrador: ${error.message}`);
    }

    if (!data) {
        throw new Error('El administrador no tiene un tenant asignado.');
    }

    return data;
}
