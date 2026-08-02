import React from 'react';
import { Home, Grid, ShoppingCart, User } from 'lucide-react';

export function MobileNav() {
    return (
        <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border items-center justify-around text-foreground px-4 z-50">
            <a
                href="/ "
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-foreground transition-colors">
                <Home className="w-5 h-5 text-blue-600" />
                <span className="mt-1">Inicio</span>
            </a>
            <a
                href="/categorias.tsx"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Grid className="w-5 h-5" />
                <span className="mt-1">Categorías</span>
            </a>
            <a
                href="/carrito.tsx"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="mt-1">Carrito</span>
            </a>
            <a
                href="/login"
                className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-5 h-5" />
                <span className="mt-1">Perfil</span>
            </a>
        </nav>
    );
}
