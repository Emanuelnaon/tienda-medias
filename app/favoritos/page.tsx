'use client';

import React from 'react';
import { useFavoritosStore } from '@/src/features/favoritos/store/useFavoritosStore';
import { TarjetaProducto } from '@/src/features/catalogo/components/TarjetaProducto';
import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function FavoritosPage() {
    const favoritos = useFavoritosStore((state) => state.favoritos);
    const totalFavoritos = favoritos.length;

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <header className="mb-8">
                <h1 className="flex items-center gap-3 text-3xl font-extrabold text-foreground">
                    <span className="inline-flex rounded-full bg-danger p-2 text-danger-foreground">
                        <Heart aria-hidden="true" className="h-5 w-5 fill-current" />
                    </span>
                    Mis Favoritos
                </h1>
                <p className="text-muted-foreground mt-2">
                    Tienes {totalFavoritos} productos en tu lista de deseos.
                </p>
            </header>

            {favoritos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-muted p-6">
                        <Heart aria-hidden="true" className="h-16 w-16 text-muted-foreground/40" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Tu lista de favoritos está vacía</h2>
                    <p className="text-muted-foreground mb-6">
                        ¡No te pierdas nuestras novedades! Agrega productos a tu lista para verlos aquí.
                    </p>
                    <Link 
                        href="/catalogo" 
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-6 py-3 font-semibold text-background transition-colors hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet motion-reduce:transition-none"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Explorar catálogo
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {favoritos.map((producto) => (
                        <TarjetaProducto key={producto.id} producto={producto} />
                    ))}
                </div>
            )}
        </div>
    );
}
