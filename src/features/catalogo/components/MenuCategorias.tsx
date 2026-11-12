'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface MenuCategoriasProps {
    categorias: string[];
}

export function MenuCategorias({ categorias }: MenuCategoriasProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const containerRef = useRef<HTMLDivElement>(null);

    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const categoriaActiva = searchParams.get('categoria') || 'Todos';

    const checkScroll = () => {
        if (containerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
            setShowLeftArrow(scrollLeft > 2);
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 2);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [categorias]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (containerRef.current) {
            const scrollAmount = 200;
            containerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
            setTimeout(checkScroll, 300);
        }
    };

    const handleCategoriaClick = (cat: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (cat === 'Todos') {
            params.delete('categoria');
        } else {
            params.set('categoria', cat);
        }
        router.push('/?' + params.toString(), { scroll: false });
    };

    return (
        <div className="relative flex min-w-0 w-full items-center rounded-2xl border border-border bg-surface py-3">
            {/* Flecha Izquierda */}
            {showLeftArrow && (
                <button
                    onClick={() => handleScroll('left')}
                    className="absolute left-1 z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-border text-foreground hover:bg-muted transition-colors shadow-sm"
                    aria-label="Desplazar a la izquierda"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Contenedor Horizontal Scrolleable */}
            <div
                ref={containerRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full px-2 md:px-6 select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Categoría Todos */}
                <button
                    onClick={() => handleCategoriaClick('Todos')}
                    className={`min-h-11 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors border focus-visible:outline-2 focus-visible:outline-violet motion-reduce:transition-none
                        ${categoriaActiva === 'Todos'
                            ? 'bg-violet-soft text-violet-soft-foreground border-violet'
                            : 'bg-surface text-muted-foreground border-border hover:border-violet hover:text-foreground'
                        }`}
                >
                    Todos
                </button>

                {/* Categorías dinámicas */}
                {categorias.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleCategoriaClick(cat)}
                        className={`min-h-11 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors border focus-visible:outline-2 focus-visible:outline-violet motion-reduce:transition-none
                            ${categoriaActiva === cat
                                ? 'bg-violet-soft text-violet-soft-foreground border-violet'
                                : 'bg-surface text-muted-foreground border-border hover:border-violet hover:text-foreground'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Flecha Derecha */}
            {showRightArrow && (
                <button
                    onClick={() => handleScroll('right')}
                    className="absolute right-1 z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-border text-foreground hover:bg-muted transition-colors shadow-sm"
                    aria-label="Desplazar a la derecha"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
        </div>
    );
}
