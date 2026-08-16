'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Grid, ShoppingCart, User, Settings, LogOut } from 'lucide-react';
import { BotonModoOscuro } from '../BotonModoOscuro';  
import { createClient } from '@/src/lib/supabase/client';
import { BuscadorRedes } from './BuscadorRedes';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function Sidebar() {
    const [usuario, setUsuario] = useState<SupabaseUser | null>(null);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUsuario(data.user));
    }, [supabase.auth]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-background border-r border-border p-6 text-foreground">
            {/* Logo o Título */}
            <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                    Socks Store
                </h1>
            </div>

            {/* Buscador de Redes Sociales (Instagram / TikTok) */}
            <div className="mb-6">
                <BuscadorRedes />
            </div>

            {/* Menú de Navegación */}
            <nav className="flex-1 space-y-2">
                <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-muted text-foreground transition-colors">
                    <Home className="w-5 h-5 text-blue-600" />
                    <span>Inicio</span>
                </Link>
                <Link href="/categories" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Grid className="w-5 h-5" />
                    <span>Categorías</span>
                </Link>
                <Link href="/carrito" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Carrito</span>
                </Link>
                {usuario ? (
                    <>
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Settings className="w-5 h-5" />
                            <span>Panel de Control</span>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </>
                ) : (
                    <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <User className="w-5 h-5" />
                        <span>Ingresar</span>
                    </Link>
                )}
            </nav>

            {/* Footer del Sidebar */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                <BotonModoOscuro />
                <p>&copy; 2026 Socks Store</p>
            </div>
        </aside>
    );
}
