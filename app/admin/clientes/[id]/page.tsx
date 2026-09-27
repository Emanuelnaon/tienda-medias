'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/src/lib/utils/cn';
import { obtenerClientePorId, actualizarNotasCliente } from '@/src/features/admin/actions/clientesActions';
import { calcularEtiquetaCliente } from '@/src/features/admin/utils';
import type { ClienteConPedidos } from '@/src/features/admin/types/clientesTypes';

interface PageProps {
    readonly params: Promise<{ id: string }>;
}

function badgeEstadoPedido(estado: string | null): string {
    if (estado === 'confirmado') {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
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

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold">Cargando cliente...</p>
            </div>
        );
    }

    if (!cliente) {
        return (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-700 dark:text-red-300">
                No se pudo cargar el cliente.
            </div>
        );
    }

    const etiqueta = calcularEtiquetaCliente(cliente.cantidad_pedidos ?? null);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/clientes"
                        className="px-4 py-2 text-sm font-semibold text-foreground bg-transparent border border-border rounded-lg hover:border-foreground transition-colors"
                    >
                        ← Volver
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{cliente.nombre_completo}</h1>
                        <p className="text-sm text-foreground/70">Teléfono: {cliente.telefono}</p>
                    </div>
                </div>
                {etiqueta && (
                    <span
                        className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                            etiqueta.estilos,
                        )}
                    >
                        {etiqueta.texto}
                    </span>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-border bg-background p-4">
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
                        Métricas
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-foreground/60 block mb-1">Total Gastado</span>
                            <p className="text-2xl font-bold font-mono">{formatearMoneda(cliente.total_gastado)}</p>
                        </div>
                        <div>
                            <span className="text-xs text-foreground/60 block mb-1">Cantidad de Pedidos</span>
                            <p className="text-2xl font-bold font-mono">{cliente.cantidad_pedidos ?? 0}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
                        Datos del Cliente
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-foreground/60 block mb-1">Nombre</span>
                            <p className="font-medium">{cliente.nombre_completo}</p>
                        </div>
                        <div>
                            <span className="text-xs text-foreground/60 block mb-1">Teléfono</span>
                            <p className="font-medium">{cliente.telefono}</p>
                        </div>
                        {cliente.email && (
                            <div>
                                <span className="text-xs text-foreground/60 block mb-1">Email</span>
                                <p className="font-medium">{cliente.email}</p>
                            </div>
                        )}
                        <div>
                            <label htmlFor="notas-cliente" className="text-xs text-foreground/60 block mb-1">
                                Notas
                            </label>
                            <textarea
                                id="notas-cliente"
                                value={notasInput}
                                onChange={(e) => setNotasInput(e.target.value)}
                                rows={3}
                                className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors resize-none"
                                placeholder="Agregar notas..."
                            />
                            <button
                                type="button"
                                onClick={handleGuardarNotas}
                                disabled={guardandoNotas}
                                className="mt-2 inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                            >
                                {guardandoNotas ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar notas'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-background overflow-hidden">
                <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider p-4 border-b border-border">
                    Historial de Pedidos
                </h2>
                {cliente.pedidos.length === 0 ? (
                    <p className="p-4 text-center text-foreground/60">
                        Este cliente aún no realizó pedidos.
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30 text-foreground/70 uppercase tracking-wider">
                                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                                <th className="px-4 py-3 text-left font-semibold">Número de Orden</th>
                                <th className="px-4 py-3 text-right font-semibold">Total</th>
                                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {cliente.pedidos.map((pedido) => (
                                <tr key={pedido.id}>
                                    <td className="px-4 py-3">{formatearFecha(pedido.created_at)}</td>
                                    <td className="px-4 py-3 font-mono">#{pedido.id.slice(0, 8)}</td>
                                    <td className="px-4 py-3 text-right font-mono">
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
                )}
            </div>
        </div>
    );
}