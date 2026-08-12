'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function DrawerFiltros() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isOpen, setIsOpen] = useState(false);
    const [talleSeleccionado, setTalleSeleccionado] = useState('');
    const [ordenSeleccionado, setOrdenSeleccionado] = useState('recientes');

    // Bloquear el scroll del fondo cuando el drawer está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Resincronizar los estados locales con la URL cada vez que isOpen cambie a true
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setTalleSeleccionado(searchParams.get('talle') || '');
                setOrdenSeleccionado(searchParams.get('orden') || 'recientes');
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, searchParams]);

    const aplicarFiltros = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (talleSeleccionado) {
            params.set('talle', talleSeleccionado);
        } else {
            params.delete('talle');
        }

        if (ordenSeleccionado && ordenSeleccionado !== 'recientes') {
            params.set('orden', ordenSeleccionado);
        } else {
            params.delete('orden');
        }

        setIsOpen(false);
        router.push(pathname + '?' + params.toString(), { scroll: false });
    };

    const limpiarFiltros = () => {
        setTalleSeleccionado('');
        setOrdenSeleccionado('recientes');
        setIsOpen(false);
        router.push(pathname, { scroll: false });
    };

    const hasActiveFilters = searchParams.toString() !== '';

    return (
        <>
            {/* Botón Disparador (Se ubica arriba de la grilla) */}
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all
                    ${hasActiveFilters
                        ? 'bg-foreground text-background hover:opacity-90 border border-transparent'
                        : 'bg-transparent text-foreground border border-border hover:border-foreground'
                    }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                </svg>
                {hasActiveFilters ? 'Filtros Activos' : 'Filtrar y Ordenar'}
            </button>

            {/* Overlay (Fondo oscuro dinámico) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-99998 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Bottom Sheet (Móvil) / Side Drawer (Desktop) */}
            <div
                className={`fixed z-99999 bg-background text-foreground transition-transform duration-300 ease-in-out flex flex-col
                    /* Mobile: Bottom Sheet */
                    bottom-0 left-0 right-0 w-full rounded-t-2xl max-h-[85vh]
                    /* Desktop: Side Drawer derecho */
                    md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-96 md:rounded-none md:max-h-screen
                    ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'}
                `}>
                {/* Cabecera del Drawer */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                    <h2 className="text-lg font-bold">Filtros</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 bg-transparent text-foreground border border-border hover:border-foreground rounded-full transition-colors"
                        aria-label="Cerrar filtros">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Contenido (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-background">
                    {/* Sección: Talles */}
                    <div>
                        <h3 className="text-sm font-bold mb-3 uppercase tracking-wider">Talle</h3>
                        <div className="flex flex-wrap gap-2">
                            {['S', 'M', 'L', 'XL'].map((talle) => {
                                const isSelected = talleSeleccionado === talle;
                                return (
                                    <button
                                        key={talle}
                                        onClick={() => setTalleSeleccionado(isSelected ? '' : talle)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                                            ${isSelected
                                                ? 'bg-foreground text-background hover:opacity-90 border border-transparent'
                                                : 'bg-transparent text-foreground border border-border hover:border-foreground'
                                            }`}>
                                        {talle}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sección: Ordenar por */}
                    <div>
                        <h3 className="text-sm font-bold mb-3 uppercase tracking-wider">Ordenar por</h3>
                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-foreground/5 transition-colors">
                                <input
                                    type="radio"
                                    name="orden"
                                    className="w-4 h-4 accent-foreground"
                                    checked={ordenSeleccionado === 'recientes'}
                                    onChange={() => setOrdenSeleccionado('recientes')}
                                />
                                <span className="text-sm font-medium">Más recientes</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-foreground/5 transition-colors">
                                <input
                                    type="radio"
                                    name="orden"
                                    className="w-4 h-4 accent-foreground"
                                    checked={ordenSeleccionado === 'menor_precio'}
                                    onChange={() => setOrdenSeleccionado('menor_precio')}
                                />
                                <span className="text-sm font-medium">Menor precio</span>
                            </label>
                            <label className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-foreground/5 transition-colors">
                                <input
                                    type="radio"
                                    name="orden"
                                    className="w-4 h-4 accent-foreground"
                                    checked={ordenSeleccionado === 'mayor_precio'}
                                    onChange={() => setOrdenSeleccionado('mayor_precio')}
                                />
                                <span className="text-sm font-medium">Mayor precio</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer (Botones de Aplicar y Limpiar) */}
                <div className="p-4 border-t border-border bg-background flex flex-col gap-2">
                    <button
                        onClick={aplicarFiltros}
                        className="w-full bg-foreground text-background py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                        type="button">
                        Ver Resultados
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={limpiarFiltros}
                            className="w-full bg-transparent text-foreground border border-border hover:border-foreground py-2 rounded-xl font-semibold text-xs transition-colors"
                            type="button">
                            Limpiar Filtros
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
