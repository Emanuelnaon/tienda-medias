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
                <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                    <Heart className="text-red-500 fill-red-500" />
                    Mis Favoritos
                </h1>
                <p className="text-muted-foreground mt-2">
                    Tienes {totalFavoritos} productos en tu lista de deseos.
                </p>
            </header>

            {favoritos.length === 0? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="bg-muted rounded-full p-6 mb-4">
                        <Heart className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Tu lista de favoritos está vacía</h2>
                    <p className="text-muted-foreground mb-6">
                        ¡No te pierdas nuestras novedades! Agrega productos a tu lista para verlos aquí.
                    </p>
                    <Link 
                        href="/catalogo" 
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
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