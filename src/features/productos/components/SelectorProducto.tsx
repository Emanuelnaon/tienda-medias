'use client';

import { useState } from 'react';
import { useCarritoStore } from '@/src/features/carrito/store';
import type { Database } from '@/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

interface Props {
    producto: Producto;
}

export function SelectorProducto({ producto }: Props) {
    const [talleSeleccionado, setTalleSeleccionado] = useState<string>('');
    const agregarItem = useCarritoStore((state) => state.agregarItem);

    const handleAgregar = () => {
        if (!talleSeleccionado) return alert('Por favor, selecciona un talle');

        agregarItem({
            id: producto.id,
            nombre: producto.nombre || 'Producto sin nombre',
            precio: Number(producto.precio) || 0,
            cantidad: 1,
            talle_seleccionado: talleSeleccionado,
        });
        alert('¡Agregado al carrito!');
    };

    return (
        <div className="flex flex-col gap-6 mt-6">
            <div className="flex flex-col gap-2">
                <span className="font-medium text-foreground">Selecciona tu talle</span>
                <div className="flex flex-wrap gap-2">
                    {producto.talles_disponibles?.map((talle) => (
                        <button
                            key={talle}
                            onClick={() => setTalleSeleccionado(talle)}
                            className={`px-4 py-2 border rounded-md transition-colors ${
                                talleSeleccionado === talle
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-background text-foreground border-border hover:border-foreground'
                            }`}>
                            {talle}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleAgregar}
                className="w-full py-4 bg-foreground text-background font-semibold rounded-md hover:opacity-90 transition-opacity">
                Agregar al Carrito
            </button>
        </div>
    );
}
