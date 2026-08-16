'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Database } from '@/src/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

interface SliderProductoProps {
    producto: Producto;
}

export function SliderProducto({ producto }: SliderProductoProps) {
    const imagenes = useMemo(() => {
        const galeria = Array.isArray(producto.galeria_imagenes)
            ? producto.galeria_imagenes.filter((url): url is string => Boolean(url && url.trim()))
            : [];

        if (galeria.length > 0) {
            return galeria;
        }

        return producto.imagen_url ? [producto.imagen_url] : [];
    }, [producto.galeria_imagenes, producto.imagen_url]);

    const [imagenActiva, setImagenActiva] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const irAImagen = (indice: number) => {
        if (imagenes.length === 0) return;
        setImagenActiva((indice + imagenes.length) % imagenes.length);
    };

    const manejarTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        setTouchStartX(event.touches[0]?.clientX ?? null);
    };

    const manejarTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX === null) return;

        const diferenciaX = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;

        if (Math.abs(diferenciaX) > 50) {
            if (diferenciaX < 0) {
                irAImagen(imagenActiva + 1);
            } else {
                irAImagen(imagenActiva - 1);
            }
        }

        setTouchStartX(null);
    };

    if (imagenes.length === 0) {
        return (
            <div className="w-full md:w-1/2 aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                Sin imagen disponible
            </div>
        );
    }

    return (
        <div className="w-full md:w-1/2">
            <div
                className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-zinc-100 dark:bg-zinc-900 shadow-sm"
                onTouchStart={manejarTouchStart}
                onTouchEnd={manejarTouchEnd}>
                <Image
                    src={imagenes[imagenActiva]}
                    alt={`${producto.nombre} ${imagenActiva + 1}`}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 ease-out"
                />

                {imagenes.length > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="Imagen anterior"
                            onClick={() => irAImagen(imagenActiva - 1)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-black/25 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/40">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="Imagen siguiente"
                            onClick={() => irAImagen(imagenActiva + 1)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-black/25 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/40">
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </>
                )}
            </div>

            {imagenes.length > 1 && (
                <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-5">
                    {imagenes.map((url, index) => {
                        const activo = index === imagenActiva;

                        return (
                            <button
                                key={`${url}-${index}`}
                                type="button"
                                aria-label={`Ver imagen ${index + 1}`}
                                onClick={() => setImagenActiva(index)}
                                onMouseEnter={() => setImagenActiva(index)}
                                className={`relative h-16 overflow-hidden rounded-lg border transition-all ${
                                    activo
                                        ? 'border-foreground ring-2 ring-foreground/20'
                                        : 'border-border hover:border-foreground/60'
                                }`}>
                                <Image
                                    src={url}
                                    alt={`Miniatura ${index + 1}`}
                                    fill
                                    sizes="80px"
                                    className="object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
