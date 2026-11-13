'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/src/lib/utils/cn';
import { obtenerClientePorId, actualizarNotasCliente, actionToggleBloqueoCliente } from '@/src/features/admin/actions/clientesActions';
import { calcularEtiquetaCliente } from '@/src/features/admin/utils';
import type { ClienteConPedidos } from '@/src/features/admin/types/clientesTypes';

interface PageProps {
    readonly params: Promise<{ id: string }>;
}

function badgeEstadoPedido(estado: string | null): string {
    if (estado === 'confirmado') {
        return 'bg-emerald-soft text-emerald-soft-foreground';
    }
    return 'bg-warning text-warning-foreground';
}

function formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(fecha));
}

function formatearMoneda(valor: number | null): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(valor ?? 0);
}

export default function ClienteDetallePage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [cliente, setCliente] = useState<ClienteConPedidos | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardandoNotas, setGuardandoNotas] = useState(false);
    const [bloqueadoOptimista, setBloqueadoOptimista] = useState<boolean | null>(null);
    const [notasInput, setNotasInput] = useState('');

    useEffect(() => {
        const cargarCliente = async () => {
            try {
                const data = await obtenerClientePorId(id);
                if (!data) {
                    toast.error('Cliente no encontrado.');
                    router.push('/admin/clientes');
                    return;
                }
                setCliente(data);
                setNotasInput(data.notas ?? '');
            } catch (error: unknown) {
                const mensaje = error instanceof Error ? error.message : 'Error al cargar el cliente.';
                toast.error(mensaje);
                router.push('/admin/clientes');
            } finally {
                setCargando(false);
            }
        };

        cargarCliente();
    }, [id, router]);

    const handleGuardarNotas = async () => {
        setGuardandoNotas(true);
        const notasAnteriores = cliente?.notas ?? null;
        setNotasInput(notasInput);

        try {
            await actualizarNotasCliente(id, notasInput);
            toast.success('Notas guardadas correctamente.');
        } catch (error: unknown) {
            const mensaje = error instanceof Error ? error.message : 'Error al guardar las notas.';
            toast.error(mensaje);
            setNotasInput(notasAnteriores ?? '');
        } finally {
            setGuardandoNotas(false);
        }
    };

    const handleToggleBloqueo = async () => {
        if (!cliente) return;

        const nuevoEstado = !cliente.bloqueado;
        setBloqueadoOptimista(nuevoEstado);

        try {
            await actionToggleBloqueoCliente(id, nuevoEstado);
            setCliente((prev) =>
                prev ? { ...prev, bloqueado: nuevoEstado } : prev,
            );
            toast.success(
                nuevoEstado ? 'Cliente bloqueado' : 'Cliente desbloqueado',
            );
        } catch (error: unknown) {
            const mensaje =
                error instanceof Error
                    ? error.message
                    : 'Error al actualizar el estado de bloqueo.';
            toast.error(mensaje);
            setBloqueadoOptimista(null);
        }
    };

    if (cargando) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-muted-foreground">
                <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold">Cargando cliente...</p>
            </div>
        );
    }

    if (!cliente) {
        return (
            <div className="rounded-xl border border-danger/40 bg-danger p-4 text-danger-foreground">
                No se pudo cargar el cliente.
            </div>
        );
    }

    const etiqueta = calcularEtiquetaCliente(cliente.cantidad_pedidos ?? null);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <Link
                        href="/admin/clientes"
                        className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                    >
                        ← Volver
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{cliente.nombre_completo}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Teléfono: {cliente.telefono}</p>
                    </div>
                </div>
                {etiqueta && (
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                            etiqueta.estilos,
                        )}
                    >
                        {etiqueta.texto}
                    </span>
                )}
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Métricas
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <span className="mb-1 block text-xs text-muted-foreground">Total Gastado</span>
                            <p className="text-2xl font-bold tabular-nums">{formatearMoneda(cliente.total_gastado)}</p>
                        </div>
                        <div>
                            <span className="mb-1 block text-xs text-muted-foreground">Cantidad de Pedidos</span>
                            <p className="text-2xl font-bold tabular-nums">{cliente.cantidad_pedidos ?? 0}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Datos del Cliente
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <span className="mb-1 block text-xs text-muted-foreground">Nombre</span>
                            <p className="font-medium">{cliente.nombre_completo}</p>
                        </div>
                        <div>
                            <span className="mb-1 block text-xs text-muted-foreground">Teléfono</span>
                            <p className="font-medium">{cliente.telefono}</p>
                        </div>
                        {cliente.email && (
                            <div>
                                <span className="mb-1 block text-xs text-muted-foreground">Email</span>
                                <p className="font-medium">{cliente.email}</p>
                            </div>
                        )}
                        <div>
                            <label htmlFor="notas-cliente" className="mb-1 block text-xs text-muted-foreground">
                                Notas
                            </label>
                            <textarea
                                id="notas-cliente"
                                value={notasInput}
                                onChange={(e) => setNotasInput(e.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-xl border border-border bg-background p-3 text-foreground transition-colors placeholder:text-muted-foreground focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20"
                                placeholder="Agregar notas..."
                            />
                            <button
                                type="button"
                                onClick={handleGuardarNotas}
                                disabled={guardandoNotas}
                                className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet px-4 py-2 text-sm font-bold text-violet-foreground transition-colors hover:bg-violet-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {guardandoNotas ? (
                                    <>
                                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-violet-foreground border-t-transparent" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar notas'
                                )}
                            </button>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="mb-1 block text-xs text-muted-foreground">
                                        Estado de la cuenta
                                    </span>
                                    <p
                                        className={cn(
                                            'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-sm font-semibold',
                                            (bloqueadoOptimista ?? cliente.bloqueado)
                                                ? 'bg-danger text-danger-foreground'
                                                : 'bg-emerald-soft text-emerald-soft-foreground',
                                        )}
                                    >
                                        {bloqueadoOptimista ?? cliente.bloqueado
                                            ? 'Cliente bloqueado'
                                            : 'Cliente activo'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleToggleBloqueo}
                                    className={cn(
                                        'min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet',
                                        (bloqueadoOptimista ?? cliente.bloqueado)
                                            ? 'border-border bg-background text-foreground hover:bg-muted'
                                            : 'border-danger bg-danger text-danger-foreground hover:border-danger-foreground',
                                    )}
                                >
                                    {bloqueadoOptimista ?? cliente.bloqueado
                                        ? 'Desbloquear cliente'
                                        : 'Bloquear cliente'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <h2 className="border-b border-border px-5 py-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Historial de Pedidos
                </h2>
                {cliente.pedidos.length === 0 ? (
                    <p className="p-6 text-center text-muted-foreground">
                        Este cliente aún no realizó pedidos.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                    <th className="px-4 py-3 text-left font-semibold">Número de Orden</th>
                                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {cliente.pedidos.map((pedido) => (
                                    <tr key={pedido.id} className="transition-colors hover:bg-muted/60">
                                        <td className="px-4 py-3">{formatearFecha(pedido.created_at)}</td>
                                        <td className="px-4 py-4 tabular-nums">#{pedido.id.slice(0, 8)}</td>
                                        <td className="px-4 py-4 text-right font-medium tabular-nums">
                                            ${Number(pedido.total).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                                                    badgeEstadoPedido(pedido.estado),
                                                )}
                                            >
                                                {pedido.estado ?? 'pendiente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
