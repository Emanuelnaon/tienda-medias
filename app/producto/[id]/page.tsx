import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { SelectorProducto } from '../../../src/features/productos/components/SelectorProducto';
import type { Database } from '../../../src/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProductoPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    // 1. Llamamos a Supabase dejando la variable como "data"
    const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();

    if (error || !data) {
        return (
            <div className="p-8 text-center bg-background text-foreground flex-1 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">No se pudo cargar el producto</h2>
                <p>Verifica que el producto exista en la base de datos.</p>
            </div>
        );
    }

    // 2. MATAMOS EL ERROR 'NEVER': Le decimos a TypeScript exactamente qué es esta data
    const producto = data as Producto;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 bg-background flex-1">
            <div className="w-full md:w-1/2 aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                {producto.imagen_url ? (
                    /* 3. APAGAMOS ESLINT: Le decimos a Next.js que nos deje usar la etiqueta img normal */
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={producto.imagen_url} alt={producto.nombre} className="object-cover w-full h-full" />
                ) : (
                    <span className="text-zinc-400">Sin imagen</span>
                )}
            </div>

            <div className="w-full md:w-1/2 flex flex-col">
                <h1 className="text-3xl font-bold text-foreground">{producto.nombre}</h1>
                <p className="text-2xl font-extrabold text-blue-600 mt-4">
                    ${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mt-4 flex-1">
                    {producto.descripcion || 'Sin descripción disponible.'}
                </p>

                <SelectorProducto producto={producto} />
            </div>
        </div>
    );
}
