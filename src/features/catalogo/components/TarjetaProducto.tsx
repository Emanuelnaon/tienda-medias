'use client';

import toast from 'react-hot-toast';
import React, { useState } from 'react';
import Link from 'next/link';
import { useCarritoStore } from '@/src/features/carrito/store';
import { useDrawerCarritoStore } from '@/src/features/carrito/drawerStore';
import { useFavoritosStore } from '@/src/features/favoritos/store/useFavoritosStore';
import { Heart } from 'lucide-react';
import type { Database } from '@/src/types/supabase';
import { calcularEtiquetasInventario } from '@/src/features/catalogo/utils';
import { EtiquetaInventario } from './EtiquetaInventario';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;
type Producto = Database['public']['Tables']['productos']['Row'] & {
    categorias?: CategoriaResumen | null;
};

export function TarjetaProducto({ producto }: { producto: Producto }) {
    const { nombre, precio, stock, talles_disponibles, imagen_url, id } = producto;
    const agregarItem = useCarritoStore((state) => state.agregarItem);
    const openDrawer = useDrawerCarritoStore((state) => state.openDrawer);
    const { toggleFavorito, esFavorito } = useFavoritosStore();
    const isFavorito = esFavorito(id);

    // Seleccionamos el primer talle por defecto
    const [talleSeleccionado, setTalleSeleccionado] = useState(talles_disponibles?.[0] || '');

    const handleAgregarCarrito = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!talleSeleccionado) {
            toast.error('Selecciona un talle');
            return;
        }

        agregarItem({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            talle_seleccionado: 'Único',
            categoria: producto.categorias?.nombre ?? 'General',
            imagenUrl: producto.imagen_url ?? null,
            stockMaximo: producto.stock ?? 99,
        });

        openDrawer();
    };

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!talleSeleccionado) {
            toast.error('Selecciona un talle');
            return;
        }

        agregarItem({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            talle_seleccionado: 'Único',
            categoria: producto.categorias?.nombre ?? 'General',
            imagenUrl: producto.imagen_url ?? null,
            stockMaximo: producto.stock ?? 99,
        });

        toast.success(`${nombre} agregado 🛒`, { duration: 1500 });
    };

    // Lógica para etiquetas de escasez (FOMO)
    const renderEtiqueta = () => {
        const { primary, secondary } = calcularEtiquetasInventario({
            stock: producto.stock,
            created_at: producto.created_at,
            producto_variantes: (producto as unknown as { producto_variantes?: ReadonlyArray<{ stock: number }> }).producto_variantes,
        });

        return (
            <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 pointer-events-none">
                {primary && <EtiquetaInventario tipo={primary} />}
                {secondary && <EtiquetaInventario tipo={secondary} />}
            </div>
        );
    };

    return (
        <div className="group relative flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none">
            <Link href={`/producto/${id}`} className="flex-1 flex flex-col">
                {/* Contenedor de Imagen */}
                <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border-soft bg-muted">
                    {imagen_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={imagen_url}
                            alt={nombre}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                        />
                    ) : (
                        <span className="text-xs text-muted-foreground">Sin imagen</span>
                    )}

                    {renderEtiqueta()}

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorito(producto);
                        }}
                        className={`absolute top-2 right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none cursor-pointer ${
                            isFavorito
                                ? 'bg-violet-soft text-violet-soft-foreground fill-violet-soft-foreground'
                                : 'bg-surface text-muted-foreground hover:bg-violet-soft hover:text-violet-soft-foreground'
                        }`}
                        title={isFavorito ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                        <Heart className="w-5 h-5" />
                    </button>
                </div>

                {/* Info Textual (Título y Precio) */}
                <div className="flex flex-col gap-1 pt-4">
                    <h3 className="line-clamp-2 text-lg font-bold leading-snug text-foreground">{nombre}</h3>
                    <span className="font-sans tabular-nums lining-nums text-lg font-extrabold text-foreground mt-0.5">
                        ${Number(precio).toLocaleString('es-AR')}
                    </span>
                </div>
            </Link>

            {/* Zona de Acción (Quick Add CRO + Talles) */}
            <div className="mt-auto flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                    {/* Selector de Talles (Píldoras) */}
                    {talles_disponibles && talles_disponibles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 flex-1">
                            {talles_disponibles.map((talle) => (
                                <button
                                    key={talle}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTalleSeleccionado(talle);
                                    }}
                                    className={`flex h-11 min-w-11 items-center justify-center rounded-lg border px-2 text-xs font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none cursor-pointer ${
                                        talleSeleccionado === talle
                                            ? 'bg-violet-soft text-violet-soft-foreground border-violet'
                                            : 'bg-surface text-muted-foreground border-border hover:border-violet hover:text-foreground'
                                    }`}>
                                    {talle}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Botón de Agregar Rápido (+) alineado con los talles */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleQuickAdd(e);
                        }}
                        disabled={stock <= 0}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-soft font-bold text-violet-soft-foreground transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        title={stock <= 0 ? 'Producto agotado' : 'Agregar al carrito'}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

            {/* CTA de compra */}
                <button
                    onClick={handleAgregarCarrito}
                    disabled={stock <= 0}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet px-4 py-3 text-sm font-bold text-violet-foreground transition-colors hover:bg-violet-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50">
                    {stock <= 0 ? 'Agotado' : 'Comprar'}
                </button>
            </div>
        </div>
    );
}
