'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/src/lib/utils/cn';

type FiltroEstado = 'pendiente' | 'confirmado' | 'todos';

const FILTROS: ReadonlyArray<{ value: FiltroEstado; label: string }> = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmado', label: 'Confirmados' },
    { value: 'todos', label: 'Todos' },
];

interface FiltrosPedidosProps {
    readonly estadoActivo: string;
}

export function FiltrosPedidos({ estadoActivo }: FiltrosPedidosProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleFiltrar = (filtro: FiltroEstado) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('estado', filtro);
        router.push(`?${params.toString()}`);
    };

    return (
        <nav className="flex gap-2 border-b border-border">
            {FILTROS.map(({ value, label }) => {
                const isActive = estadoActivo === value;
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => handleFiltrar(value)}
                        className={cn(
                            'px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer',
                            isActive
                                ? 'border-foreground text-foreground'
                                : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30',
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </nav>
    );
}
