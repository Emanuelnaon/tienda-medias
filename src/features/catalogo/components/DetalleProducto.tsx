'use client';

import React, { useState } from 'react';
import { SelectorTalles, Variante } from './SelectorTalles';
import { useCarritoStore } from '@/src/features/carrito/store';

export type DetalleProductoProps = Readonly<{
    producto: Readonly<{
        id: string;
        nombre: string;
        precio: number;
        imagenUrl: string | null;
        variantes: ReadonlyArray<Variante>;
    }>;
}>;

export function DetalleProducto({ producto }: DetalleProductoProps) {
    // Determinar si el producto es único (solo una variante disponible)
    const esUnico = producto.variantes.length === 1 && producto.variantes[0].talle.toLowerCase() === 'único';
    
    // Estado para el talle seleccionado, inicializado a 'Único' si es único, o null si hay varias opciones.
    const [talleSeleccionado, setTalleSeleccionado] = useState<string | null>(
        esUnico ? 'Único' : null
    );

    // Acceso al store de carrito
    const agregarAlCarrito = useCarritoStore((state) => state.agregarItem);

    // Encontrar la variante seleccionada
    const varianteActual = producto.variantes.find((v) => v.talle === talleSeleccionado);
    const estaAgotado = !varianteActual || varianteActual.stock <= 0;

    const handleAgregar = () => {
        // Solo agregar si hay un talle seleccionado y el stock es mayor a 0
        if (!talleSeleccionado || estaAgotado) return;

        agregarAlCarrito({
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenUrl: producto.imagenUrl,
            talle: talleSeleccionado,
            cantidad: 1,
            stockMaximo: varianteActual.stock,
        });
    };

    return (
        <div className="flex flex-col space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-gray-900">{producto.nombre}</h1>
            <p className="text-xl font-semibold text-gray-800">${producto.precio.toLocaleString('es-AR')}</p>

            {/* Componente Selector de Talles */}
            <SelectorTalles 
                variantes={producto.variantes} 
                talleSeleccionado={talleSeleccionado} 
                onSeleccionarTalle={setTalleSeleccionado}
            />

            {/* Botón de Agregar al Carrito */}
            <button
                type="button"
                onClick={handleAgregar}
                disabled={!talleSeleccionado || estaAgotado}
                className="w-full rounded-md bg-black py-3 px-4 text-white font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {!talleSeleccionado
                    ? 'Seleccioná un talle'
                    : estaAgotado
                    ? 'Sin Stock Disponible'
                    : 'Agregar al Carrito'}
            </button>
        </div>
    );
}

export default DetalleProducto;