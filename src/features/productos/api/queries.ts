import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/supabase';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;
export type ProductoConCategoria = Database['public']['Tables']['productos']['Row'] & {
    categorias: CategoriaResumen | null;
};

export async function getProductos(filtros?: { talle?: string; orden?: string; categoria?: string }): Promise<ProductoConCategoria[]> {
    const supabase = await createSupabaseServerClient();
    let categoriaId: string | undefined;

    if (filtros?.categoria) {
        const categoriaNombre = filtros.categoria.trim();
        if (!categoriaNombre) {
            return [];
        }

        const { data: categoriaData, error: categoriaError } = await supabase
            .from('categorias')
            .select('id')
            .eq('nombre', categoriaNombre)
            .maybeSingle();

        if (categoriaError) {
            throw new Error(categoriaError.message);
        }

        categoriaId = categoriaData?.id;
        if (!categoriaId) {
            return [];
        }
    }

    let query = supabase
        .from('productos')
        .select('*, categorias:categorias(id,nombre,slug)');

    if (categoriaId) {
        query = query.eq('categoria_id', categoriaId);
    }

    if (filtros?.talle) {
        query = query.contains('talles_disponibles', [filtros.talle]);
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
    return (data ?? []) as ProductoConCategoria[];
}

export async function getProductosRelacionados(
    categoriaSeleccionada?: string | null,
    productoIdExcluido?: string,
    limite = 4,
): Promise<ProductoConCategoria[]> {
    if (!categoriaSeleccionada || !productoIdExcluido) {
        return [];
    }

    const categoriaNombre = categoriaSeleccionada.trim();
    if (!categoriaNombre) {
        return [];
    }

    const supabase = await createSupabaseServerClient();
    const { data: categoriaData, error: categoriaError } = await supabase
        .from('categorias')
        .select('id')
        .eq('nombre', categoriaNombre)
        .limit(1);

    if (categoriaError) {
        throw new Error(categoriaError.message);
    }

    const categoriaId = categoriaData?.[0]?.id;
    if (!categoriaId) {
        return [];
    }

    const { data, error } = await supabase
        .from('productos')
        .select('*, categorias:categorias(id,nombre,slug)')
        .eq('categoria_id', categoriaId)
        .neq('id', productoIdExcluido)
        .limit(limite)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as ProductoConCategoria[];
}
