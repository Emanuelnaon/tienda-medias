import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { SelectorProducto } from '@/src/features/productos/components/SelectorProducto';
import { SliderProducto } from '@/src/features/productos/components/SliderProducto';
import ProductoSugeridos from '@/src/features/productos/components/ProductoSugeridos';
import { FormularioListaEspera } from '@/src/features/productos/components/FormularioListaEspera';
import { calcularEtiquetasInventario } from '@/src/features/catalogo/utils';
import { EtiquetaInventario } from '@/src/features/catalogo/components/EtiquetaInventario';
import type { Database } from '@/src/types/supabase';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;

type VarianteRow = Database['public']['Tables']['producto_variantes']['Row'];

type ProductoConVariantes = Database['public']['Tables']['productos']['Row'] & {
    categorias: CategoriaResumen | null;
    producto_variantes: VarianteRow[];
};

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ProductoPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from('productos')
        .select('*, categorias:categorias(id,nombre,slug), producto_variantes(id,talle,stock)')
        .eq('id', id)
        .single();

    if (error || !data) {
        return (
            <div className="p-8 text-center bg-background text-foreground flex-1 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">No se pudo cargar el producto</h2>
                <p>Verifica que el producto exista en la base de datos.</p>
            </div>
        );
    }

    const producto = data as ProductoConVariantes;

    const { primary, secondary } = calcularEtiquetasInventario({
        stock: producto.stock,
        created_at: producto.created_at,
        producto_variantes: producto.producto_variantes,
    });

    const esAgotado = primary === 'agotado';

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-8 bg-background flex-1">
            <div className="flex flex-col md:flex-row gap-8">
                <SliderProducto producto={producto} />

                <div className="w-full md:w-1/2 flex flex-col">
                    <h1 className="text-3xl font-bold text-foreground">{producto.nombre}</h1>
                    <p className="text-2xl font-extrabold text-blue-600 mt-4">
                        ${Number(producto.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {primary && <EtiquetaInventario tipo={primary} />}
                        {secondary && <EtiquetaInventario tipo={secondary} />}
                    </div>

                    <p className="text-zinc-800 dark:text-zinc-600 mt-4 flex-1">
                        {producto.descripcion || 'Sin descripción disponible.'}
                    </p>

                    {esAgotado ? (
                        <FormularioListaEspera
                            productoId={producto.id}
                            tenantId={producto.tenant_id}
                            productoNombre={producto.nombre}
                            variantes={producto.producto_variantes}
                        />
                    ) : (
                        <SelectorProducto producto={producto} />
                    )}
                </div>
            </div>

            <ProductoSugeridos categoria={producto.categorias?.nombre ?? null} productoId={producto.id} />
        </div>
    );
}
