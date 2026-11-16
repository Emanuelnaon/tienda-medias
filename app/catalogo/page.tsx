'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import Link from 'next/link';
import { Grid } from 'lucide-react';
import type { Database } from '@/src/types/supabase';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;
type ProductoConCategoria = Database['public']['Tables']['productos']['Row'] & {
    categorias: CategoriaResumen | null;
};
type CategoriaDisponible = {
    readonly nombre: string;
    readonly imagenUrl: string | null;
};

export default function CatalogoPage() {
    const [categorias, setCategorias] = useState<CategoriaDisponible[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const supabase = createClient();
        const fetchProductos = async () => {
            try {
                const { data, error } = await supabase.from('productos').select('*, categorias:categorias(id,nombre,slug)');

                if (error) throw error;

                if (data) {
                    const productosData = data as ProductoConCategoria[];
                    const categoriasPorNombre = new Map<string, CategoriaDisponible>();
                    for (const producto of productosData) {
                        const nombre = producto.categorias?.nombre;
                        if (!nombre) continue;

                        const categoriaExistente = categoriasPorNombre.get(nombre);
                        if (!categoriaExistente || (!categoriaExistente.imagenUrl && producto.imagen_url)) {
                            categoriasPorNombre.set(nombre, {
                                nombre,
                                imagenUrl: categoriaExistente?.imagenUrl ?? producto.imagen_url,
                            });
                        }
                    }
                    setCategorias(Array.from(categoriasPorNombre.values()));
                }
            } catch (error) {
                console.error('Error al cargar productos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <header className="mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">Categorías</h1>
                    <p className="text-muted-foreground mt-1">Explora nuestros productos por categoría</p>
                </div>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-100 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : categorias.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {categorias.map((categoria) => (
                        <Link
                            key={categoria.nombre}
                            href={`/?categoria=${encodeURIComponent(categoria.nombre)}`}
                            className="group overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                        >
                            <div className="relative aspect-square overflow-hidden bg-muted">
                                {categoria.imagenUrl && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={categoria.imagenUrl}
                                        alt=""
                                        onError={(event) => {
                                            event.currentTarget.style.display = 'none';
                                            event.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                                    />
                                )}
                                <div className={`${categoria.imagenUrl ? 'hidden ' : ''}absolute inset-0 flex items-center justify-center`}>
                                    <Grid aria-hidden="true" className="h-12 w-12 text-muted-foreground/40" />
                                </div>
                            </div>
                            <h2 className="px-4 py-4 text-lg font-bold text-foreground">{categoria.nombre}</h2>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Grid className="w-16 h-16 text-muted-foreground/20 mb-4" />
                    <h2 className="text-2xl font-bold text-foreground">No hay categorías disponibles</h2>
                    <p className="text-muted-foreground mt-1">Vuelve más tarde para explorar nuestros productos.</p>
                </div>
            )}
        </div>
    );
}
