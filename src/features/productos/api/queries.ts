import { createSupabaseServerClient } from '@/src/lib/supabase/server';
//import type { Database } from '@/types/supabase';

export async function getProductos(filtros?: { talle?: string; orden?: string; categoria?: string }) {
    const supabase = await createSupabaseServerClient();

    let query = supabase.from('productos').select('*');

    if (filtros?.talle) {
        query = query.contains('talles_disponibles', [filtros.talle]);
    }

    if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria);
    }

    const orden = filtros?.orden;
    switch (orden) {
        case 'menor_precio':
            query = query.order('precio', { ascending: true });
            break;
        case 'mayor_precio':
            query = query.order('precio', { ascending: false });
            break;
        case 'recientes':
        default:
            query = query.order('created_at', { ascending: false });
            break;
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data;
}
