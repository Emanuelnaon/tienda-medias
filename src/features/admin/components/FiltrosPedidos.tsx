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
            <nav className="hidden gap-2 border-b border-border md:flex">
                {FILTROS.map((filtro) => {
                    const isActive = estadoActivo === filtro;
                    return (
                        <button
                            key={filtro}
                            type="button"
                            onClick={() => handleFiltrar(filtro)}
                            className={cn(
                                'px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer',
                                isActive
                                    ? 'border-foreground text-foreground'
                                    : 'border-transparent text-foreground/60 hover:text-foreground hover:border-foreground/30',
                            )}
                        >
                            {ETIQUETAS_FILTROS[filtro]}
                        </button>
                    );
                })}
            </nav>

            <div className="flex flex-col gap-1 md:hidden">
                <label htmlFor="filtro_estado_pedido" className="text-sm font-semibold text-foreground">
                    Filtrar por estado
                </label>
                <select
                    id="filtro_estado_pedido"
                    value={estadoActivo}
                    onChange={(evento) => handleFiltrar(evento.target.value as FiltroEstado)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
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