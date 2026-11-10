import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { TablaProductos } from '@/src/features/admin/components/TablaProductos';

export default async function AdminPage() {
    const supabase = await createSupabaseServerClient();

    const { data: productos, error } = await supabase
        .from('productos')
        .select('*, categorias:categorias(id,nombre,slug)')
        .order('created_at', { ascending: false });

    if (error) {
        return (
            <div className="min-w-0 rounded-2xl border border-danger bg-danger p-4 text-danger-foreground md:p-6">
                <h3 className="font-bold">Error de conexión</h3>
                <p className="mt-1 break-words text-sm">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="min-w-0 w-full space-y-6">
            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Catálogo de Productos</h2>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground md:text-sm">Gestiona el inventario, precios y detalles de tu tienda.</p>
                </div>
            </div>

            <TablaProductos productosIniciales={productos || []} />
        </div>
    );
}
