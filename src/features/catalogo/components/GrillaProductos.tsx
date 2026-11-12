import React from 'react';
import { getProductos } from '../../productos/api/queries';
import { TarjetaProducto } from './TarjetaProducto';
import { DrawerFiltros } from './DrawerFiltros'; // <-- Importamos el nuevo componente
import type { Database } from '@/src/types/supabase';

// Extraemos el tipo exacto de una fila de la tabla productos
type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;
type Producto = Database['public']['Tables']['productos']['Row'] & {
    categorias?: CategoriaResumen | null;
};

interface GrillaProductosProps {
    parametros?: {
        [key: string]: string | string[] | undefined;
    };
}

import { MenuCategorias } from './MenuCategorias';

export async function GrillaProductos({ parametros }: GrillaProductosProps) {
    const filtros = {
        talle: typeof parametros?.talle === 'string' ? parametros?.talle : undefined,
        orden: typeof parametros?.orden === 'string' ? parametros?.orden : undefined,
        categoria: typeof parametros?.categoria === 'string' ? parametros?.categoria : undefined,
    };

    // Llamamos a la API para obtener el catálogo
    const productos = await getProductos(filtros);

    // Obtener la lista de categorías dinámicas únicas de todos los productos de la BD (sin filtros de categoría)
    const todosLosProductos = (await getProductos({ orden: 'recientes' })) as Producto[];
    const categoriasUnicas = Array.from(
        new Set(
            todosLosProductos
                ?.map((p) => p.categorias?.nombre)
                .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
        )
    );

    return (
        <div className="flex min-w-0 flex-col gap-6">
            {/* Cabecera: Título y Botón de Filtros */}
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Encuntra algo especial</h1>
                <DrawerFiltros />
            </div>

            {/* Menú de categorías directas */}
            <MenuCategorias categorias={categoriasUnicas} />

            {/* Renderizado condicional: Mensaje de vacío o Grilla */}
            {!productos || productos.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center text-muted-foreground">
                    No encontramos medias con esos filtros.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {productos.map((producto: Producto) => (
                        <TarjetaProducto key={producto.id} producto={producto} />
                    ))}
                </div>
            )}
        </div>
    );
}
