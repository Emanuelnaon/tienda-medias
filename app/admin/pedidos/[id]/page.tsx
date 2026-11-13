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
import {
    ESTADOS_PEDIDO,
    SelectorEstadoPedido,
    esEstadoPedido,
    type EstadoPedido,
} from '@/src/features/logistica';

interface PageProps {
    readonly params: Promise<{ id: string }>;
}

const ESTILOS_BADGE_ESTADO: Record<EstadoPedido, string> = {
    pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    confirmado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    preparando: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    en_camino: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    entregado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

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

function badgeEstadoPedido(estado: string | null): { texto: string; estilos: string } {
    if (esEstadoPedido(estado)) {
        return {
            texto: ESTADOS_PEDIDO[estado].label,
            estilos: ESTILOS_BADGE_ESTADO[estado],
        };
    }

    return {
        texto: estado ?? 'Sin estado',
        estilos: ESTILOS_BADGE_ESTADO.pendiente,
    };
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

    const handleCopiarLinkRepartidor = async () => {
        if (!pedido?.token_seguimiento) return;

        const link = `${window.location.origin}/delivery/${pedido.id}?t=${pedido.token_seguimiento}`;

        try {
            await navigator.clipboard.writeText(link);
            toast.success('Link copiado');
        } catch {
            toast.error('No se pudo copiar el link');
        }
    };

    const handleEstadoCambiado = (estado: EstadoPedido) => {
        setPedido((previo) => (previo === null ? previo : { ...previo, estado }));
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
        <div className="space-y-5 sm:space-y-6">
            <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                    <Link
                        href="/admin/pedidos"
                        className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                    >
                        ← Volver
                    </Link>
                    <div className="min-w-0">
                        <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Pedido #{pedido.id.slice(0, 8)}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{formatearFecha(pedido.created_at)}</p>
                    </div>
                </div>
                <span
                    className={cn(
                        'inline-flex min-h-8 items-center self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-auto',
                        badgeEstadoPedido(pedido.estado).estilos,
                    )}
                >
                    {badgeEstadoPedido(pedido.estado).texto}
                </span>
            </header>

            <SelectorEstadoPedido
                pedidoId={pedido.id}
                estadoActual={pedido.estado}
                onEstadoCambiado={handleEstadoCambiado}
            />

            {pedido.estado === 'en_camino' && pedido.token_seguimiento && (
                <div className="flex justify-start sm:justify-end">
                    <button
                        type="button"
                        onClick={handleCopiarLinkRepartidor}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet sm:w-auto"
                    >
                        Copiar link del repartidor
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <h2 className="border-b border-border pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Datos del cliente
                    </h2>
                    <div>
                        <span className="text-xs text-muted-foreground">Nombre</span>
                        <p className="break-words font-medium">
                            {cliente?.nombre_completo ?? 'Cliente sin nombre'}
                        </p>
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground">Teléfono</span>
                        <p className="break-words font-medium tabular-nums">{cliente?.telefono ?? 'Sin teléfono'}</p>
                    </div>
                    {cliente?.email && (
                        <div>
                            <span className="text-xs text-muted-foreground">Email</span>
                            <p className="break-all font-medium">{cliente.email}</p>
                        </div>
                    )}
                    <div>
                        <span className="text-xs text-muted-foreground">Estado del cliente</span>
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

                <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <h2 className="border-b border-border pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Resumen del pedido
                    </h2>
                    <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-sans font-semibold tabular-nums">${Number(itemsSubtotal).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-4 font-bold">
                        <span>Total</span>
                        <span className="font-sans text-xl font-bold tabular-nums lining-nums">${Number(pedido.total).toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto overscroll-x-contain">
                    <table className="w-full min-w-max text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                                <th scope="col" className="px-4 py-3 text-left font-semibold sm:px-5">Producto</th>
                                <th scope="col" className="px-4 py-3 text-left font-semibold sm:px-5">Talle</th>
                                <th scope="col" className="px-4 py-3 text-center font-semibold sm:px-5">Cant.</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Precio unit.</th>
                                <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {pedido.items.map((item) => (
                                <tr key={item.id} className="transition-colors hover:bg-muted/50">
                                    <td className="max-w-64 px-4 py-4 font-semibold sm:px-5">{item.nombre_producto}</td>
                                    <td className="px-4 py-4 text-muted-foreground sm:px-5">
                                        {item.talle ?? '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center tabular-nums sm:px-5">{item.cantidad}</td>
                                    <td className="px-4 py-4 text-right font-sans tabular-nums sm:px-5">
                                        ${Number(item.precio_unitario).toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-4 py-4 text-right font-sans font-semibold tabular-nums sm:px-5">
                                        ${(Number(item.precio_unitario) * item.cantidad).toLocaleString('es-AR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="border-b border-border pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Comprobante de acreditación
                </h2>

                <div className="flex max-w-xl flex-col gap-2">
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
                        className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-2 focus:ring-violet/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleGuardarComprobante}
                    disabled={guardandoComprobante || pedido.estado === 'confirmado'}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald px-4 py-2 text-sm font-bold text-emerald-foreground transition-colors hover:bg-emerald-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
