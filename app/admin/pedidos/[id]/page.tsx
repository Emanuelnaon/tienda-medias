'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/src/lib/utils/cn';
import {
    type PedidoDetalle,
    obtenerPedidoPorId,
    guardarComprobante,
    confirmarPedido,
} from '@/src/features/admin/actions/pedidosActions';

interface PageProps {
    readonly params: Promise<{ id: string }>;
}

function etiquetaCliente(estado: string | null): { texto: string; estilos: string } {
    const estadoNormalizado = estado?.toLowerCase();
    if (estadoNormalizado === 'vip' || estadoNormalizado === 'frecuente') {
        return {
            texto: estadoNormalizado === 'vip' ? 'VIP' : 'Frecuente',
            estilos: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
        };
    }
    return { texto: 'Nuevo', estilos: 'border-amber-500/40 text-amber-700 dark:text-amber-300' };
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

export default function PedidoDetallePage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardandoComprobante, setGuardandoComprobante] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [comprobanteInput, setComprobanteInput] = useState('');

    useEffect(() => {
        const cargarPedido = async () => {
            try {
                const data = await obtenerPedidoPorId(id);
                setPedido(data);
                setComprobanteInput(data.comprobante_numero ?? '');
            } catch (error: unknown) {
                const mensaje = error instanceof Error ? error.message : 'Error al cargar el pedido.';
                toast.error(mensaje);
                router.push('/admin/pedidos');
            } finally {
                setCargando(false);
            }
        };

        cargarPedido();
    }, [id, router]);

    const handleGuardarComprobante = async () => {
        if (!comprobanteInput.trim()) {
            toast.error('El número de comprobante no puede estar vacío.');
            return;
        }

        setGuardandoComprobante(true);
        try {
            await guardarComprobante(id, comprobanteInput);
            toast.success('Número de comprobante guardado.');
            if (pedido) {
                setPedido({ ...pedido, comprobante_numero: comprobanteInput.trim() });
            }
        } catch (error: unknown) {
            const mensaje = error instanceof Error ? error.message : 'Error al guardar el comprobante.';
            toast.error(mensaje);
        } finally {
            setGuardandoComprobante(false);
        }
    };

    const handleConfirmar = async () => {
        setConfirmando(true);
        try {
            await confirmarPedido(id);
            toast.success('Pedido acreditado con éxito.');
            router.push('/admin/pedidos');
        } catch (error: unknown) {
            const mensaje = error instanceof Error ? error.message : 'Error al confirmar el pedido.';
            toast.error(mensaje);
        } finally {
            setConfirmando(false);
        }
    };

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold">Cargando pedido...</p>
            </div>
        );
    }

    if (!pedido) {
        return (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-700 dark:text-red-300">
                No se pudo cargar el pedido.
            </div>
        );
    }

    const cliente = pedido.cliente;
    const itemsSubtotal = pedido.items.reduce(
        (sum, item) => sum + Number(item.precio_unitario) * item.cantidad,
        0,
    );

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/pedidos"
                        className="px-4 py-2 text-sm font-semibold text-foreground bg-transparent border border-border rounded-lg hover:border-foreground transition-colors"
                    >
                        ← Volver
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Pedido #{pedido.id.slice(0, 8)}</h1>
                        <p className="text-sm text-foreground/70">{formatearFecha(pedido.created_at)}</p>
                    </div>
                </div>
                <span
                    className={cn(
                        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                        badgeEstadoPedido(pedido.estado),
                    )}
                >
                    {pedido.estado ?? 'pendiente'}
                </span>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                        Datos del cliente
                    </h2>
                    <div>
                        <span className="text-xs text-foreground/60">Nombre</span>
                        <p className="font-medium">
                            {cliente?.nombre_completo ?? 'Cliente sin nombre'}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs text-foreground/60">Teléfono</span>
                        <p className="font-medium">{cliente?.telefono ?? 'Sin teléfono'}</p>
                    </div>
                    {cliente?.email && (
                        <div>
                            <span className="text-xs text-foreground/60">Email</span>
                            <p className="font-medium">{cliente.email}</p>
                        </div>
                    )}
                    <div>
                        <span className="text-xs text-foreground/60">Estado del cliente</span>
                        <span
                            className={cn(
                                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                                etiquetaCliente(cliente?.estado ?? null).estilos,
                            )}
                        >
                            {etiquetaCliente(cliente?.estado ?? null).texto}
                        </span>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                        Resumen del pedido
                    </h2>
                    <div className="flex justify-between py-1">
                        <span className="text-foreground/70">Subtotal</span>
                        <span className="font-mono">${Number(itemsSubtotal).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-border font-bold">
                        <span>Total</span>
                        <span className="font-mono">${Number(pedido.total).toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-background overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/30 text-foreground/70 uppercase tracking-wider">
                            <th className="px-4 py-3 text-left font-semibold">Producto</th>
                            <th className="px-4 py-3 text-left font-semibold">Talle</th>
                            <th className="px-4 py-3 text-center font-semibold">Cant.</th>
                            <th className="px-4 py-3 text-right font-semibold">Precio unit.</th>
                            <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {pedido.items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3">{item.nombre_producto}</td>
                                <td className="px-4 py-3 text-foreground/70">
                                    {item.talle ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-center">{item.cantidad}</td>
                                <td className="px-4 py-3 text-right font-mono">
                                    ${Number(item.precio_unitario).toLocaleString('es-AR')}
                                </td>
                                <td className="px-4 py-3 text-right font-mono">
                                    ${(Number(item.precio_unitario) * item.cantidad).toLocaleString('es-AR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 space-y-4">
                <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                    Comprobante de acreditación
                </h2>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="comprobante_numero" className="text-sm font-bold">
                        Número de comprobante
                    </label>
                    <input
                        id="comprobante_numero"
                        type="text"
                        value={comprobanteInput}
                        onChange={(e) => setComprobanteInput(e.target.value)}
                        placeholder="Ej. 12345-AE, MP-5678-ABCD"
                        disabled={pedido.estado === 'confirmado'}
                        className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors disabled:opacity-50"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleGuardarComprobante}
                    disabled={guardandoComprobante || pedido.estado === 'confirmado'}
                    className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                    {guardandoComprobante ? (
                        <>
                            <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                            Guardando...
                        </>
                    ) : (
                        'Guardar número de comprobante'
                    )}
                </button>

                {pedido.estado === 'pendiente' && (
                    <button
                        type="button"
                        onClick={handleConfirmar}
                        disabled={confirmando}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                        {confirmando ? (
                            <>
                                <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                                Confirmando...
                            </>
                        ) : (
                            'Confirmar Acreditación'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
