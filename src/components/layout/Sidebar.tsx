import React from 'react';
import { Home, Grid, ShoppingCart, User } from 'lucide-react';

export function Sidebar() {
    return (
        <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-background border-r border-border p-6 text-foreground">
            {/* Logo o Título */}
            <div className="mb-8">
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                    Socks Store
                </h1>
            </div>

            {/* Menú de Navegación */}
            <nav className="flex-1 space-y-2">
                <a href="/ " className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-muted text-foreground transition-colors">
                    <Home className="w-5 h-5 text-blue-600" />
                    <span>Inicio</span>
                </a>
                <a href="/categories" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Grid className="w-5 h-5" />
                    <span>Categorías</span>
                </a>
                <a href="/carrito" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Carrito</span>
                </a>
                <a href="/login" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <User className="w-5 h-5" />
                    <span>Perfil</span>
                </a>
            </nav>

            {/* Footer del Sidebar */}
            <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                <p>&copy; 2026 Socks Store</p>
            </div>
        </aside>
    );
}
