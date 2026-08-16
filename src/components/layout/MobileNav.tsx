'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Grid, ShoppingCart, User, Settings, LogOut } from 'lucide-react';
import { BotonModoOscuro } from '../BotonModoOscuro';
import { createClient } from '@/src/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { useCarritoStore } from '@/src/features/carrito/store';

export function MobileNav() {
    const [usuario, setUsuario] = useState<SupabaseUser | null>(null);
    const supabase = createClient();
    const items = useCarritoStore((state) => state.items);
    const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);

    const [animateBadge, setAnimateBadge] = useState(false);

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

  useEffect(() => {
      // 1. Carga inicial del usuario
      supabase.auth.getUser().then(({ data }) => setUsuario(data.user));

      // 2. Escucha de eventos en tiempo real (login / logout)
      const {
          data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
          setUsuario(session?.user ?? null);
      });

      return () => {
          subscription.unsubscribe();
      };
  }, [supabase.auth]);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      setUsuario(null); // Actualiza la UI inmediatamente
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
                href="/catalogo"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Grid className="w-5 h-5" />
                <span className="mt-1">Categorías</span>
            </Link>
            <Link
                href="/carrito"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors relative"
            >
                <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {totalItems > 0 && (
                        <span
                            className={`absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center transition-transform duration-200 ${
                                animateBadge ? 'scale-125' : 'scale-100'
                            }`}
                        >
                            {totalItems}
                        </span>
                    )}
                </div>
                <span className="mt-1">Carrito</span>
            </Link>
            {usuario ? (
                <>
                    <Link
                        href="/admin"
                        className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <Settings className="w-5 h-5" />
                        <span className="mt-1 text-center truncate max-w-60px">Panel</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
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
