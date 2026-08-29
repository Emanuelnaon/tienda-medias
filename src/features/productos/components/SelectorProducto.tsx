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
        <div className="mt-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={handleCompartir}
                    className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-foreground hover:text-background">
                    <Share2 className="h-4 w-4" />
                    <span>Compartir</span>
                </button>
            </div>

            {producto.stock > 0 && producto.stock < 5 && (
                <span className="w-fit rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-sm">
                    ¡Últimas unidades!
                </span>
            )}

            <div className="flex flex-col gap-2">
                <span className="font-medium text-foreground">Selecciona tu talle</span>
                <div className="flex flex-wrap gap-2">
                    {producto.talles_disponibles?.map((talle) => (
                        <button
                            key={talle}
                            onClick={() => setTalleSeleccionado(talle)}
                            className={`rounded-md border px-4 py-2 transition-colors ${
                                talleSeleccionado === talle
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border bg-background text-foreground hover:border-foreground'
                            }`}>
                            {talle}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleAgregar}
                disabled={producto.stock <= 0}
                className="w-full rounded-md bg-foreground py-4 font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                {producto.stock <= 0 ? 'Agotado' : 'Agregar al Carrito'}
            </button>
        </div>
    );
}
