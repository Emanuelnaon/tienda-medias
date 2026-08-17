'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Grid, ShoppingCart, User, Settings, LogOut } from 'lucide-react';
import { BotonModoOscuro } from '../BotonModoOscuro';
import { createClient } from '@/src/lib/supabase/client';
import { BuscadorRedes } from './BuscadorRedes';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useCarritoStore } from '@/src/features/carrito/store';

const emptySubscribe = () => () => {};

export function Sidebar() {
    const router = useRouter();
    const [usuario, setUsuario] = useState<SupabaseUser | null>(null);

    // Detecta si estamos en el cliente de forma nativa sin setMounted en useEffect
    const mounted = useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );

    const items = useCarritoStore((state) => state.items);
    const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);
    const [animateBadge, setAnimateBadge] = useState(false);

    // Animación del badge del carrito
    useEffect(() => {
        if (totalItems > 0) {
            const timer1 = setTimeout(() => setAnimateBadge(true), 10);
            const timer2 = setTimeout(() => setAnimateBadge(false), 300);
            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [totalItems]);

    // Gestión de Autenticación en tiempo real
    useEffect(() => {
        const supabase = createClient();

        // 1. Carga inicial del usuario
        supabase.auth.getUser().then(({ data }) => setUsuario(data.user));

        // 2. Escucha de eventos en tiempo real (login / logout)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUsuario(session?.user ?? null);
            router.refresh();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setUsuario(null);
        router.refresh();
        window.location.href = '/';
    };

    if (!mounted) return null;

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-background border-r border-border p-6 text-foreground">
            {/* Logo o Título */}
            <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                    Socks Store
                </h1>
            </div>

            {/* Buscador de Redes Sociales */}
            <div className="mb-6">
                <BuscadorRedes />
            </div>

            {/* Menú de Navegación */}
            <nav className="flex-1 space-y-2">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Home className="w-5 h-5 text-blue-600" />
                    <span>Inicio</span>
                </Link>
                <Link
                    href="/catalogo"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Grid className="w-5 h-5" />
                    <span>Categorías</span>
                </Link>
                <Link
                    href="/carrito"
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Carrito</span>
                    </div>
                    {totalItems > 0 && (
                        <span
                            className={`bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center transition-transform duration-200 ${
                                animateBadge ? 'scale-125' : 'scale-100'
                            }`}>
                            {totalItems}
                        </span>
                    )}
                </Link>
                {usuario ? (
                    <>
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Settings className="w-5 h-5" />
                            <span>Panel de Control</span>
                        </Link>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors text-left">
                            <LogOut className="w-5 h-5" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <User className="w-5 h-5" />
                        <span>Ingresar</span>
                    </Link>
                )}
            </nav>

            {/* Footer del Sidebar */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                <BotonModoOscuro />
                <p className="mt-2">&copy; 2026 Socks Store</p>
            </div>
        </aside>
    );
}
