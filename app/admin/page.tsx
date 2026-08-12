import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { TablaProductos } from '../../src/features/admin/components/TablaProductos';
import type { Database } from '@/src/types/supabase';

export default async function AdminPage() {
    const supabase = await createSupabaseServerClient();

    // Obtenemos los productos ordenados por fecha de creación (los más nuevos primero)
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
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

            {/* Inyectamos los datos en el componente cliente */}
            <TablaProductos productosIniciales={productos || []} />
        </div>
    );
}
