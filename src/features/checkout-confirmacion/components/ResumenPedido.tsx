import type { PedidoConfirmacion } from '@/src/features/checkout-confirmacion/api/queries';

interface ResumenPedidoProps {
    readonly pedido: PedidoConfirmacion;
}

export function ResumenPedido({ pedido }: ResumenPedidoProps) {
    const orden = pedido.id.split('-')[0];
    const fecha = pedido.created_at
        ? new Date(pedido.created_at).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : null;

    return (
        <div className="space-y-4 rounded-xl border border-border bg-background p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">Resumen de la compra</h2>
                <p className="text-sm text-muted-foreground">Orden #{orden}</p>
                {fecha && <p className="text-sm text-muted-foreground">{fecha}</p>}
            </div>

            <ul className="divide-y divide-border">
                {pedido.items.map((item) => (
                    <li
                        key={item.id}
                        className="flex items-center justify-between py-2.5 text-sm"
                    >
                        <div className="flex flex-col">
                            <span className="block font-medium text-foreground">
                                {item.nombre_producto}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Talle: {item.talle ?? 'Único'} · {item.cantidad} × ${item.precio_unitario}
                            </span>
                        </div>
                        <span className="font-semibold text-foreground">
                            ${item.cantidad * item.precio_unitario}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-extrabold text-foreground">
                    ${pedido.total}
                </span>
            </div>
        </div>
    );
}
