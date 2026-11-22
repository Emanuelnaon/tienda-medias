import { Suspense } from 'react';
import {
    listarPedidosPendientes,
    type PedidoPendiente,
} from '@/src/features/admin/actions/pedidosActions';
import { TablaPedidos } from '@/src/features/admin/components/TablaPedidos';
import { FiltrosPedidos } from '@/src/features/admin/components/FiltrosPedidos';

interface PageProps {
    readonly searchParams: Promise<{ estado?: string; orden?: string }>;
}

const ORDENES_VALIDAS = new Set(['recientes', 'antiguos', 'total_desc', 'total_asc']);
const ESTADOS_VALIDOS = new Set([
    'pendiente', 'confirmado', 'preparando', 'en_camino', 'entregado', 'cancelado', 'todos',
]);

async function cargarPedidos(estado: string | undefined, orden: string) {
    return listarPedidosPendientes(estado, orden);
}

export default async function PedidosPage({ searchParams }: PageProps) {
    const { estado, orden } = await searchParams;
    const estadoResolved = estado && ESTADOS_VALIDOS.has(estado) ? estado : 'pendiente';
    const ordenResolved = orden && ORDENES_VALIDAS.has(orden) ? orden : 'recientes';

    return (
        <section className="space-y-5 sm:space-y-6">
            <header className="space-y-2">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Gestión de pedidos</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Filtra, ordena y actualiza el estado de cada pedido.</p>
            </header>

            <FiltrosPedidos estadoActivo={estadoResolved} ordenActivo={ordenResolved} />

            <Suspense fallback={<p className="text-sm text-foreground/60">Cargando pedidos...</p>}>
                <TablaPedidosWrapper estado={estadoResolved} orden={ordenResolved} />
            </Suspense>
        </section>
    );
}

async function TablaPedidosWrapper({ estado, orden }: { estado: string; orden: string }) {
    let pedidos: PedidoPendiente[] | null = null;
    let errorMessage: string | null = null;

    try {
        pedidos = await cargarPedidos(estado, orden);
    } catch (error: unknown) {
        errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    }

    if (errorMessage) {
        return (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-700 dark:text-red-300">
                {errorMessage}
            </div>
        );
    }

    return <TablaPedidos pedidos={pedidos ?? []} estadoActivo={estado} ordenActivo={orden} />;
}
