import React from 'react';
import { getProductos } from '../../productos/api/queries';
import { TarjetaProducto } from './TarjetaProducto';
import { DrawerFiltros } from './DrawerFiltros'; // <-- Importamos el nuevo componente
import type { Database } from '@/types/supabase';

// Extraemos el tipo exacto de una fila de la tabla productos
type Producto = Database['public']['Tables']['productos']['Row'];

interface GrillaProductosProps {
    parametros?: {
        [key: string]: string | string[] | undefined;
    };
}

export async function GrillaProductos({ parametros }: GrillaProductosProps) {
    const filtros = {
        talle: typeof parametros?.talle === 'string' ? parametros?.talle : undefined,
        orden: typeof parametros?.orden === 'string' ? parametros?.orden : undefined,
    };

    // Llamamos a la API para obtener el catálogo
    const productos = await getProductos(filtros);

    return (
        <div className="flex flex-col gap-4">
            {/* Cabecera: Título y Botón de Filtros */}
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-extrabold text-foreground">Catálogo</h1>
                <DrawerFiltros />
            </div>

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
