import { redirect } from 'next/navigation';
import {
    obtenerPedidoConfirmacion,
    tieneFeaturePago,
    ResumenPedido,
    IndicacionesPago,
    GeneradorQrPago,
    EnlacesBancarios,
    BotonAbrirWhatsApp,
    type PedidoConfirmacion,
} from '@/src/features/checkout-confirmacion';
import { METODOS_ENVIO } from '@/src/features/logistica';
import {
    MapaRepartidorLoader,
    TimelineEstadosTracking,
    normalizarToken,
} from '@/src/features/tracking';
import { obtenerPosicionRepartidor, obtenerTrackingInicial } from '@/src/features/tracking/server';
import { WHATSAPP_SUPPORT_NUMBER } from '@/src/lib/constants';

function construirLinkWhatsapp(
    pedido: PedidoConfirmacion,
    whatsappTenant: string | null,
): string {
    const numero = (whatsappTenant ?? WHATSAPP_SUPPORT_NUMBER).replace(
        /[^\d+]/g,
        '',
    );
    const orden = pedido.id.split('-')[0];
    let mensaje = '¡Hola! Quiero confirmar mi pedido.\n';
    for (const item of pedido.items) {
        mensaje += `- ${item.cantidad}x ${item.nombre_producto} ($${item.precio_unitario})\n`;
    }
    mensaje += `Total a pagar: $${pedido.total}\n`;
    mensaje += `*Número de Orden: ${orden}*`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export default async function PedidoConfirmacionPage({
    params,
    searchParams,
}: Readonly<{
    params: Promise<{ id: string }>;
    searchParams: Promise<{ t?: string | string[] }>;
}>) {
    const [{ id }, parametrosBusqueda] = await Promise.all([params, searchParams]);
    const pedido = await obtenerPedidoConfirmacion(id);

    if (!pedido) {
        redirect('/');
    }

    const planActivo = await tieneFeaturePago(pedido.tenant.plan);
    const tieneDatosBancarios = Boolean(
        pedido.tenant.cbu || pedido.tenant.alias_bancario,
    );
    const mostrarPago = planActivo && tieneDatosBancarios;

    const linkWhatsapp = construirLinkWhatsapp(pedido, pedido.tenant.whatsapp);

    const token = normalizarToken(parametrosBusqueda.t);
    const tracking = token === null ? null : await obtenerTrackingInicial(id, token);
    const esMensajeriaLocal = tracking?.metodo_envio === METODOS_ENVIO.mensajeria_local;
    const posicionInicial =
        esMensajeriaLocal && token !== null
            ? await obtenerPosicionRepartidor(id, token)
            : null;

    return (
        <article className="w-full max-w-3xl mx-auto py-8 px-4">
            <div className="space-y-8">
                <header className="text-center">
                    <h1 className="text-2xl font-bold text-foreground">
                        ¡Gracias por tu pedido!
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Orden #{pedido.id.split('-')[0]} · Estado{' '}
                        <span className="font-medium text-foreground">
                            {pedido.estado ?? 'Pendiente'}
                        </span>
                    </p>
                </header>

                <section>
                    <ResumenPedido pedido={pedido} />
                </section>

                {tracking !== null && token !== null && (
                    <>
                        <section>
                            <TimelineEstadosTracking
                                pedidoId={id}
                                historialInicial={tracking.historial}
                                token={token}
                            />
                        </section>

                        {esMensajeriaLocal && (
                            <section>
                                <MapaRepartidorLoader
                                    pedidoId={id}
                                    token={token}
                                    posicionInicial={posicionInicial}
                                />
                            </section>
                        )}
                    </>
                )}

                {mostrarPago && (
                    <>
                        <section>
                            <IndicacionesPago
                                banco={pedido.tenant.banco}
                                aliasBancario={pedido.tenant.alias_bancario}
                                cbu={pedido.tenant.cbu}
                                titularCuenta={pedido.tenant.titular_cuenta}
                            />
                        </section>

                        <section className="flex flex-col items-center gap-4 text-center">
                            <h2 className="text-lg font-semibold text-foreground">
                                Código QR para el pago
                            </h2>
                            <GeneradorQrPago
                                aliasBancario={pedido.tenant.alias_bancario}
                                cbu={pedido.tenant.cbu}
                                total={pedido.total}
                            />
                        </section>

                        <section>
                            <EnlacesBancarios
                                aliasBancario={pedido.tenant.alias_bancario}
                                cbu={pedido.tenant.cbu}
                                total={pedido.total}
                            />
                        </section>
                    </>
                )}

                <section>
                    <BotonAbrirWhatsApp
                        enlaceServidor={linkWhatsapp}
                        pedidoId={pedido.id}
                    />
                </section>
            </div>
        </article>
    );
}
