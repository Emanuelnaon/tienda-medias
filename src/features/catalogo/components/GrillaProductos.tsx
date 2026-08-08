
import React from 'react';
import { getProductos } from '../../productos/api/queries';
import { TarjetaProducto } from './TarjetaProducto';
import type { Database } from '@/types/supabase';

// 3. Extraemos el tipo exacto de una fila de la tabla productos
type Producto = Database['public']['Tables']['productos']['Row'];

export async function GrillaProductos() {
    // Llamamos a la función con el nombre correcto
    const productos = await getProductos();

    if (!productos || productos.length === 0) {
        return <div className="p-8 text-center text-zinc-500">No hay productos disponibles por el momento.</div>;
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {/* 4. Tipamos explícitamente el parámetro (producto: Producto) para eliminar el error "any" */}
            {productos.map((producto: Producto) => (
                <TarjetaProducto key={producto.id} producto={producto} />
            ))}
        </div>
    );
}
