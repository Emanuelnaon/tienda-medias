import React from 'react';
import Link from 'next/link';

export default function CatalogoPage() {
    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-foreground bg-background">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold">Catálogo de Productos</h1>
                    <p className="text-sm text-foreground/70 mt-1">
                        Gestión centralizada de inventario, categorías y stock de productos.
                    </p>
                </div>
                <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-semibold text-foreground bg-transparent border border-border rounded-lg hover:border-foreground transition-colors"
                >
                    Volver al Dashboard
                </Link>
            </div>

            {/* Contenedor de Contenido Vacio */}
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-background/50">
                <div className="w-12 h-12 mb-4 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-1">Módulo de Catálogo</h3>
                <p className="text-sm text-foreground/60 max-w-md text-center">
                    Esta vista está estructurada y lista para integrar la lógica feature-based correspondiente.
                </p>
            </div>
        </div>
    );
}