'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { TarjetaProducto } from '@/src/features/catalogo/components/TarjetaProducto';
import { Grid, Filter } from 'lucide-react';
import type { Database } from '@/src/types/supabase';

type Producto = Database['public']['Tables']['productos']['Row'];

export default function CatalogoPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<string[]>(['Todas']);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const supabase = createClient();
        const fetchProductos = async () => {
            try {
                const { data, error } = await supabase.from('productos').select('*');

                if (error) throw error;

                if (data) {
                    const productosData = data as Producto[];
                    setProductos(productosData);

                    // Extraer categorías únicas
                    const categoriasUnicas = Array.from(
                        new Set(productosData.map((p) => p.categoria).filter((cat): cat is string => Boolean(cat))),
                    );
                    setCategorias(['Todas', ...categoriasUnicas]);
                }
            } catch (error) {
                console.error('Error al cargar productos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, []);

    const handleSelectCategoria = (cat: string) => {
        setCategoriaSeleccionada(cat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const productosFiltrados: Producto[] =
        categoriaSeleccionada === 'Todas'
            ? productos
            : productos.filter((p: Producto) => p.categoria === categoriaSeleccionada);

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">Catálogo de Productos</h1>
                    <p className="text-muted-foreground mt-1">Explora nuestra selección de productos</p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="w-5 h-5" />
                    <span className="text-sm font-medium">{productosFiltrados.length} productos encontrados</span>
                </div>
            </header>

            {/* Menú de Categorías */}
            <div className="flex flex-wrap gap-2 mb-8">
                {categorias.map((cat: string) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategoria(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 active:scale-95 ${
                            categoriaSeleccionada === cat
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grilla de Productos */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-100 bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : productosFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productosFiltrados.map((producto: Producto) => (
                        <TarjetaProducto key={producto.id} producto={producto} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Grid className="w-16 h-16 text-muted-foreground/20 mb-4" />
                    <h2 className="text-2xl font-bold text-foreground">No se encontraron productos</h2>
                    <p className="text-muted-foreground mt-1">Intenta con otra categoría o vuelve más tarde.</p>
                </div>
            )}
        </div>
    );
}
