'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/src/lib/utils/cn';
import { ESTADOS_PEDIDO, type EstadoPedido } from '@/src/features/logistica';

const FILTRO_TODOS = 'todos';

type FiltroEstado = EstadoPedido | typeof FILTRO_TODOS;

const FILTROS: ReadonlyArray<FiltroEstado> = [
    'pendiente',
    'confirmado',
    'preparando',
    'en_camino',
    'entregado',
    'cancelado',
    FILTRO_TODOS,
];

const ETIQUETAS_FILTROS: Record<FiltroEstado, string> = {
    pendiente: ESTADOS_PEDIDO.pendiente.label,
    confirmado: ESTADOS_PEDIDO.confirmado.label,
    preparando: ESTADOS_PEDIDO.preparando.label,
    en_camino: ESTADOS_PEDIDO.en_camino.label,
    entregado: ESTADOS_PEDIDO.entregado.label,
    cancelado: ESTADOS_PEDIDO.cancelado.label,
    [FILTRO_TODOS]: 'Todos',
};

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
        <>
            <nav aria-label="Filtrar pedidos por estado" className="hidden gap-1 overflow-x-auto border-b border-border md:flex">
                {FILTROS.map((filtro) => {
                    const isActive = estadoActivo === filtro;
                    return (
                        <button
                            key={filtro}
                            type="button"
                            onClick={() => handleFiltrar(filtro)}
                            className={cn(
                                'whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet',
                                isActive
                                    ? 'border-violet text-violet-soft-foreground'
                                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                            )}
                        >
                            {ETIQUETAS_FILTROS[filtro]}
                        </button>
                    );
                })}
            </nav>

            <div className="flex flex-col gap-2 md:hidden">
                <label htmlFor="filtro_estado_pedido" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filtrar por estado
                </label>
                <select
                    id="filtro_estado_pedido"
                    value={estadoActivo}
                    onChange={(evento) => handleFiltrar(evento.target.value as FiltroEstado)}
                    className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/20"
                >
                    {FILTROS.map((filtro) => (
                        <option key={filtro} value={filtro}>
                            {ETIQUETAS_FILTROS[filtro]}
                        </option>
                    ))}
                </select>
            </div>
        </>
    );
}
