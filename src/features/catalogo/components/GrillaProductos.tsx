import React from 'react';
import { getProductos } from '../../productos/api/queries';
import { TarjetaProducto } from './TarjetaProducto';
import { DrawerFiltros } from './DrawerFiltros'; // <-- Importamos el nuevo componente
import type { Database } from '@/src/types/supabase';

// Extraemos el tipo exacto de una fila de la tabla productos
type Producto = Database['public']['Tables']['productos']['Row'] & {
    categoria?: string | null;
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
                ?.map((p) => p.categoria)
                .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
        )
    );

    return (
        <div className="flex flex-col gap-4">
            {/* Cabecera: Título y Botón de Filtros */}
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-extrabold text-foreground">Catálogo</h1>
                <DrawerFiltros />
            </div>

            {/* Menú de categorías directas */}
            <MenuCategorias categorias={categoriasUnicas} />

            {/* Renderizado condicional: Mensaje de vacío o Grilla */}
            {!productos || productos.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border text-zinc-500 mt-4">
                    No encontramos medias con esos filtros.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                    {productos.map((producto: Producto) => (
                        <TarjetaProducto key={producto.id} producto={producto} />
                    ))}
                </div>
            )}
        </div>
    );
}
