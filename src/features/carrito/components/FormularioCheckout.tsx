'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { generarLinkWhatsApp, type ClienteCheckoutInput } from '@/src/features/carrito/actions/generarCheckout';
import { useCarritoStore } from '@/src/features/carrito/store';

const clienteSchema = z.object({
    nombre_completo: z.string().trim().min(2, 'Ingresa tu nombre completo'),
    telefono: z.string().trim().min(8, 'Ingresa un teléfono válido'),
});

type FormularioCheckoutProps = Readonly<{
    onCompleted?: () => void;
}>;

export function FormularioCheckout({ onCompleted }: FormularioCheckoutProps) {
    const items = useCarritoStore((state) => state.items);
    const limpiarCarrito = useCarritoStore((state) => state.limpiarCarrito);
    const [isPending, setIsPending] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClienteCheckoutInput>({ resolver: zodResolver(clienteSchema) });

    const onSubmit = async (cliente: ClienteCheckoutInput) => {
        setIsPending(true);
        try {
            const url = await generarLinkWhatsApp(
                items.map(({ id, cantidad, talle_seleccionado }) => ({
                    id,
                    cantidad,
                    talle: talle_seleccionado,
                })),
                cliente,
            );
            limpiarCarrito();
            onCompleted?.();
            window.location.href = url;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Ocurrió un error al procesar la compra');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3 border-t border-border pt-4">
            <div>
                <label htmlFor="nombre_completo" className="mb-1 block text-sm font-semibold text-foreground">
                    Nombre completo
                </label>
                <input
                    id="nombre_completo"
                    {...register('nombre_completo')}
                    placeholder="Tu nombre"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
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
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
                />
                {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono.message}</p>}
            </div>
            <button
                type="submit"
                disabled={isPending || items.length === 0}
                className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">
                {isPending ? 'Registrando pedido...' : 'Finalizar compra por WhatsApp'}
            </button>
        </form>
    );
}
