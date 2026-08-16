import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

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

export async function getProductosRelacionados(
    categoriaSeleccionada?: string | null,
    productoIdExcluido?: string,
    limite = 4,
): Promise<Producto[]> {
    if (!categoriaSeleccionada || !productoIdExcluido) {
        return [];
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('categoria', categoriaSeleccionada)
        .neq('id', productoIdExcluido)
        .limit(limite)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data as Producto[]) ?? [];
}
