'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Grid, ShoppingCart, User, Settings, LogOut } from 'lucide-react';
import { BotonModoOscuro } from '../BotonModoOscuro';
import { createClient } from '@/src/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function MobileNav() {
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
        <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border items-center justify-around text-foreground px-4 z-50">
            <Link
                href="/"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-foreground transition-colors">
                <Home className="w-5 h-5 text-blue-600" />
                <span className="mt-1">Inicio</span>
            </Link>
            <Link
                href="/categories"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Grid className="w-5 h-5" />
                <span className="mt-1">Categorías</span>
            </Link>
            <Link
                href="/carrito"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="mt-1">Carrito</span>
            </Link>
            {usuario ? (
                <>
                    <Link
                        href="/admin"
                        className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <Settings className="w-5 h-5" />
                        <span className="mt-1 text-center truncate max-w-[60px]">Panel</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span className="mt-1">Salir</span>
                    </button>
                </>
            ) : (
                <Link
                    href="/login"
                    className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <User className="w-5 h-5" />
                    <span className="mt-1">Ingresar</span>
                </Link>
            )}
            <div className="flex items-center justify-center px-1">
                <BotonModoOscuro />
            </div>
        </nav>
    );
}
