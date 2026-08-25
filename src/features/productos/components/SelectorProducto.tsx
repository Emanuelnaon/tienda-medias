'use client';

import toast from 'react-hot-toast';
import { useState } from 'react';
import { useCarritoStore } from '@/src/features/carrito/store';
import type { Database } from '@/types/supabase';
import { Share2 } from 'lucide-react';

type Producto = Database['public']['Tables']['productos']['Row'];

interface Props {
    producto: Producto;
}

export function SelectorProducto({ producto }: Props) {
    const [talleSeleccionado, setTalleSeleccionado] = useState<string>('');
    const agregarItem = useCarritoStore((state) => state.agregarItem);

    const handleAgregar = () => {
        if (producto.stock <= 0) {
            return;
        }

        if (!talleSeleccionado) {
            toast.error('Por favor, selecciona un talle');
            return;
        }
        agregarItem({
            id: producto.id,
            nombre: producto.nombre || 'Producto sin nombre',
            precio: Number(producto.precio) || 0,
            cantidad: 1,
            talle_seleccionado: talleSeleccionado,
            categoria: producto.categoria || '',
        });
        toast.success('¡Agregado al carrito!');
    };

    const handleCompartir = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: producto.nombre,
                    text: `¡Mira esto en nuestra tienda! ${producto.nombre}`,
                    url: url,
                });
            } catch (error) {
                console.log('Error al compartir', error);
            }
        } else {
            // Fallback: copiar al portapapeles
            await navigator.clipboard.writeText(url);
            toast.success('Enlace copiado al portapapeles');
        }
    };

    return (
        <div className="flex flex-col gap-6 mt-6">
            <div className="flex justify-between items-center">
                <button
                    onClick={handleCompartir}
                    className="flex items-center gap-2 text-sm text-foreground border border-border px-3 py-1.5 rounded-full hover:bg-foreground hover:text-background transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Compartir</span>
                </button>
            </div>

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
                disabled={producto.stock <= 0}
                className="w-full py-4 bg-foreground text-background font-semibold rounded-md hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
                {producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
            </button>
        </div>
    );
}
