'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
    generarLinkWhatsApp,
    type ClienteCheckoutInput,
} from '@/src/features/carrito/actions/generarCheckout';
import {
    actionConsultarDisponibilidadEnvio,
    actionCotizarEnvio,
    describirMotivoEnvio,
    ETIQUETAS_METODO_ENVIO,
    type ResultadoEnvioValido,
} from '@/src/features/logistica';
import { useCarritoStore } from '@/src/features/carrito/store';
import { guardarLinkWhatsApp } from '@/src/lib/utils/linkWhatsappStorage';

const CODIGO_POSTAL_VALIDO = /^\d{4}$/;
const DEBOUNCE_COTIZACION_MS = 400;

const clienteSchema = z.object({
    nombre_completo: z.string().trim().min(2, 'Ingresá tu nombre completo'),
    telefono: z.string().trim().min(8, 'Ingresá un teléfono válido'),
    codigo_postal: z
        .string()
        .trim()
        .refine((valor) => valor === '' || CODIGO_POSTAL_VALIDO.test(valor), {
            message: 'El código postal tiene 4 dígitos',
        }),
    direccion_entrega: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
});

type DatosCheckout = z.infer<typeof clienteSchema>;

type FormularioCheckoutProps = Readonly<{
    onCompleted?: () => void;
}>;

const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted';

export function FormularioCheckout({ onCompleted }: FormularioCheckoutProps) {
    const items = useCarritoStore((state) => state.items);
    const limpiarCarrito = useCarritoStore((state) => state.limpiarCarrito);
    const [isPending, setIsPending] = useState(false);
    const [linkWhatsApp, setLinkWhatsApp] = useState<string | null>(null);
    const [pedidoId, setPedidoId] = useState<string | null>(null);
    const [hayZonasActivas, setHayZonasActivas] = useState(false);
    const [estimado, setEstimado] = useState<ResultadoEnvioValido | null>(null);
    const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
    const [cotizando, setCotizando] = useState(false);
    const ultimaCotizacionRef = useRef<string | null>(null);

    const subtotal = useMemo(
        () => items.reduce((total, item) => total + item.precio * item.cantidad, 0),
        [items],
    );

    useEffect(() => {
        if (pedidoId && linkWhatsApp) {
            guardarLinkWhatsApp(pedidoId, linkWhatsApp);
        }
    }, [linkWhatsApp, pedidoId]);

    useEffect(() => {
        let sigueVigente = true;

        actionConsultarDisponibilidadEnvio()
            .then((disponibilidad) => {
                if (sigueVigente) {
                    setHayZonasActivas(disponibilidad.hayZonasActivas);
                }
            })
            .catch(() => {
                // Si no se puede consultar, el checkout sigue sin cálculo de envío.
            });

        return () => {
            sigueVigente = false;
        };
    }, []);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<DatosCheckout>({ resolver: zodResolver(clienteSchema) });

    const codigoPostal = useWatch({ control, name: 'codigo_postal' }) ?? '';

    const cotizarEnvio = useCallback(
        async (codigoPostalIngresado: string) => {
            const codigo = codigoPostalIngresado.trim();

            if (!hayZonasActivas) {
                return;
            }

            if (!CODIGO_POSTAL_VALIDO.test(codigo)) {
                ultimaCotizacionRef.current = null;
                setEstimado(null);
                setErrorEnvio(null);
                return;
            }

            // La clave incluye el subtotal: al cambiar el carrito puede cambiar
            // el costo (por ejemplo, al cruzar el mínimo de envío gratis).
            const claveCotizacion = `${codigo}|${subtotal}`;

            if (ultimaCotizacionRef.current === claveCotizacion) {
                return;
            }

            setCotizando(true);
            try {
                const resultado = await actionCotizarEnvio(codigo, subtotal);

                if (resultado.esValido) {
                    ultimaCotizacionRef.current = claveCotizacion;
                    setEstimado(resultado);
                    setErrorEnvio(null);
                } else {
                    ultimaCotizacionRef.current = null;
                    setEstimado(null);
                    setErrorEnvio(describirMotivoEnvio(resultado.motivo));
                }
            } catch {
                ultimaCotizacionRef.current = null;
                setEstimado(null);
                setErrorEnvio('No pudimos calcular el costo de envío. Intentá de nuevo.');
            } finally {
                setCotizando(false);
            }
        },
        [hayZonasActivas, subtotal],
    );

    useEffect(() => {
        if (!hayZonasActivas) {
            return;
        }

        if (!CODIGO_POSTAL_VALIDO.test(codigoPostal.trim())) {
            return;
        }

        const temporizador = setTimeout(() => {
            void cotizarEnvio(codigoPostal);
        }, DEBOUNCE_COTIZACION_MS);

        return () => clearTimeout(temporizador);
    }, [codigoPostal, hayZonasActivas, cotizarEnvio]);

    const handleCodigoPostalChange = (valorIngresado: string) => {
        const codigo = valorIngresado.replace(/\D/g, '').slice(0, 4);

        setValue('codigo_postal', codigo);

        if (!CODIGO_POSTAL_VALIDO.test(codigo)) {
            ultimaCotizacionRef.current = null;
            setEstimado(null);
            setErrorEnvio(null);
            setCotizando(false);
        }
    };

    const onSubmit = async (datos: DatosCheckout, e?: React.BaseSyntheticEvent) => {
        e?.preventDefault();

        if (hayZonasActivas) {
            if (!CODIGO_POSTAL_VALIDO.test(datos.codigo_postal.trim())) {
                toast.error('Ingresá tu código postal (4 dígitos) para calcular el envío');
                return;
            }

            if (errorEnvio !== null) {
                toast.error(errorEnvio);
                return;
            }

            if (estimado === null) {
                toast.error('Consultá el costo de envío antes de confirmar el pedido');
                return;
            }
        }

        setIsPending(true);
        try {
            const cliente: ClienteCheckoutInput = {
                nombre_completo: datos.nombre_completo,
                telefono: datos.telefono,
                codigo_postal: datos.codigo_postal,
                direccion_entrega: datos.direccion_entrega,
            };

            const result = await generarLinkWhatsApp(
                items.map(({ id, cantidad, talle_seleccionado }) => ({
                    id,
                    cantidad,
                    talle: talle_seleccionado,
                })),
                cliente,
            );

            setLinkWhatsApp(result.linkWhatsApp);
            setPedidoId(result.pedidoId);
            limpiarCarrito();
            window.location.assign(`/pedido/${result.pedidoId}`);
            setTimeout(() => onCompleted?.(), 100);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Ocurrió un error al procesar la compra');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            action="#"
            className="w-full space-y-3 border-t border-border pt-4"
        >
            <div>
                <label htmlFor="nombre_completo" className="mb-1 block text-sm font-semibold text-foreground">
                    Nombre completo
                </label>
                <input
                    id="nombre_completo"
                    {...register('nombre_completo')}
                    placeholder="Tu nombre"
                    className={inputClass}
                />
                {errors.nombre_completo && (
                    <p className="mt-1 text-xs text-red-600">{errors.nombre_completo.message}</p>
                )}
            </div>
            <div>
                <label htmlFor="telefono" className="mb-1 block text-sm font-semibold text-foreground">
                    Teléfono
                </label>
                <input
                    id="telefono"
                    type="tel"
                    {...register('telefono')}
                    placeholder="Ej. 11 1234 5678"
                    className={inputClass}
                />
                {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono.message}</p>}
            </div>
            {hayZonasActivas && (
                <>
                    <div>
                        <label
                            htmlFor="codigo_postal"
                            className="mb-1 block text-sm font-semibold text-foreground"
                        >
                            Código postal
                        </label>
                        <input
                            id="codigo_postal"
                            type="tel"
                            inputMode="numeric"
                            maxLength={4}
                            autoComplete="postal-code"
                            value={codigoPostal}
                            onChange={(evento) => handleCodigoPostalChange(evento.target.value)}
                            onBlur={() => void cotizarEnvio(codigoPostal)}
                            placeholder="Ej. 1234"
                            className={inputClass}
                        />
                        {errors.codigo_postal && (
                            <p className="mt-1 text-xs text-red-600">{errors.codigo_postal.message}</p>
                        )}
                        {cotizando && (
                            <p className="mt-1 text-xs text-foreground/60">Calculando envío...</p>
                        )}
                        {!cotizando && estimado !== null && (
                            <p className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                Envío: ${estimado.costo} · {ETIQUETAS_METODO_ENVIO[estimado.metodo]}
                            </p>
                        )}
                        {!cotizando && errorEnvio !== null && (
                            <p className="mt-1 text-xs text-red-600">{errorEnvio}</p>
                        )}
                    </div>
                    <div>
                        <label
                            htmlFor="direccion_entrega"
                            className="mb-1 block text-sm font-semibold text-foreground"
                        >
                            Dirección de entrega (opcional)
                        </label>
                        <textarea
                            id="direccion_entrega"
                            rows={2}
                            {...register('direccion_entrega')}
                            placeholder="Calle, altura, piso"
                            className={inputClass}
                        />
                        {errors.direccion_entrega && (
                            <p className="mt-1 text-xs text-red-600">{errors.direccion_entrega.message}</p>
                        )}
                    </div>
                </>
            )}
            <button
                type="submit"
                disabled={isPending || items.length === 0}
                className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isPending ? 'Registrando pedido...' : 'Finalizar compra por WhatsApp'}
            </button>
        </form>
    );
}