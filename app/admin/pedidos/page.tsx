import { Suspense } from 'react';
import {
    listarPedidosPendientes,
    type PedidoPendiente,
} from '@/src/features/admin/actions/pedidosActions';
import { TablaPedidos } from '@/src/features/admin/components/TablaPedidos';
import { FiltrosPedidos } from '@/src/features/admin/components/FiltrosPedidos';

interface PageProps {
    readonly searchParams: Promise<{ estado?: string }>;
}

async function cargarPedidos(estado: string | undefined) {
    return listarPedidosPendientes(estado);
}

export default async function PedidosPage({ searchParams }: PageProps) {
    const { estado } = await searchParams;
    const estadoResolved = estado ?? 'pendiente';

    return (
        <section className="space-y-5 sm:space-y-6">
            <header className="space-y-2">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Pedidos pendientes</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Revisa las acreditaciones y confirma cada venta.</p>
            </header>

            <FiltrosPedidos estadoActivo={estadoResolved} />

            <Suspense fallback={<p className="text-sm text-foreground/60">Cargando pedidos...</p>}>
                <TablaPedidosWrapper estado={estadoResolved} />
            </Suspense>
        </section>
    );
}

async function TablaPedidosWrapper({ estado }: { estado: string }) {
    let pedidos: PedidoPendiente[] | null = null;
    let errorMessage: string | null = null;

    try {
        pedidos = await cargarPedidos(estado);
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

    return <TablaPedidos pedidosIniciales={pedidos ?? []} estadoInicial={estado} />;
}
