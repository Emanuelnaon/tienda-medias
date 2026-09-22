import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { TablaProductos } from '@/src/features/admin/components/TablaProductos';
import type { Database } from '@/src/types/supabase';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;
type ProductoConCategoria = Database['public']['Tables']['productos']['Row'] & {
    categorias: CategoriaResumen | null;
};

export default async function AdminPage() {
    const supabase = await createSupabaseServerClient();

    const { data: productos, error } = await supabase
        .from('productos')
        .select('*, categorias:categorias(id,nombre,slug)')
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 text-red-500 rounded-md border border-red-500/50">
                <h3 className="font-bold">Error de conexión</h3>
                <p>{error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Catálogo de Productos</h2>
                    <p className="text-sm text-zinc-500">Gestiona el inventario, precios y detalles de tu tienda.</p>
                </div>
            </div>

            <TablaProductos productosIniciales={productos || []} />
        </div>
    );
}
