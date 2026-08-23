import { confirmarVentaYActualizarCrm, listarPedidosPendientes } from '@/src/features/admin/actions/pedidosActions';

function formatearFecha(fecha: string | null) {
    if (!fecha) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fecha));
}

function etiquetaCliente(estado: string | null) {
    const estadoNormalizado = estado?.toLowerCase();
    if (estadoNormalizado === 'vip' || estadoNormalizado === 'frecuente') {
        return {
            texto: estadoNormalizado === 'vip' ? 'VIP' : 'Frecuente',
            estilos: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
        };
    }
    return { texto: 'Nuevo', estilos: 'border-amber-500/40 text-amber-700 dark:text-amber-300' };
}

export default async function PedidosPage() {
    let pedidos;
    try {
        pedidos = await listarPedidosPendientes();
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        return (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-700 dark:text-red-300">
                {mensaje}
            </div>
        );
    }

    return (
        <section className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold">Pedidos pendientes</h2>
                <p className="text-sm text-foreground/70">Revisa las acreditaciones y confirma cada venta.</p>
            </header>

            {pedidos.length === 0 ? (
                <div className="rounded-lg border border-border p-10 text-center text-foreground/60">
                    No hay pedidos pendientes.
                </div>
            ) : (
                <div className="space-y-4">
                    {pedidos.map((pedido) => {
                        const cliente = etiquetaCliente(pedido.cliente?.estado ?? null);
                        return (
                            <article
                                key={pedido.id}
                                className="rounded-lg border border-border bg-background p-5 shadow-sm">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold">
                                                {pedido.cliente?.nombre_completo ?? 'Cliente sin nombre'}
                                            </h3>
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${cliente.estilos}`}>
                                                {cliente.texto}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/70">
                                            {pedido.cliente?.telefono ?? 'Sin teléfono'} ·{' '}
                                            {formatearFecha(pedido.created_at)}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <p className="text-xl font-bold">
                                            ${Number(pedido.total).toLocaleString('es-AR')}
                                        </p>
                                        <p className="text-xs text-foreground/60">Pedido #{pedido.id.slice(0, 8)}</p>
                                    </div>
                                </div>

                                <ul className="my-4 divide-y divide-border border-y border-border text-sm">
                                    {pedido.items.map((item) => (
                                        <li key={item.id} className="flex justify-between gap-4 py-3">
                                            <span>
                                                {item.cantidad} × {item.nombre_producto}
                                                {item.talle ? ` (${item.talle})` : ''}
                                            </span>
                                            <span className="text-foreground/70">
                                                ${Number(item.precio_unitario).toLocaleString('es-AR')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <form action={confirmarVentaYActualizarCrm}>
                                    <input type="hidden" name="pedidoId" value={pedido.id} />
                                    <button
                                        type="submit"
                                        className="w-full rounded-md bg-foreground px-4 py-3 text-sm font-bold text-background transition-opacity hover:opacity-90 md:w-auto">
                                        Confirmar Acreditación
                                    </button>
                                </form>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
