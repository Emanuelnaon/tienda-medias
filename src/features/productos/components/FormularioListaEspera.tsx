'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { actionCrearListaEspera } from '../actions/listaEsperaActions';

const schemaListaEspera = z.object({
    email: z.string().trim().email('Ingresa un email válido').optional().or(z.literal('')),
    telefono: z.string().trim().min(8, 'Ingresa un teléfono válido (mínimo 8 dígitos)'),
    variante_id: z.string().uuid().optional().nullish(),
});

type FormInput = z.infer<typeof schemaListaEspera>;

interface Variante {
    id: string;
    talle: string;
    stock: number;
}

interface FormularioListaEsperaProps {
    readonly productoId: string;
    readonly tenantId: string;
    readonly productoNombre: string;
    readonly variantes: ReadonlyArray<Variante>;
}

export function FormularioListaEspera({ productoId, tenantId, productoNombre, variantes }: FormularioListaEsperaProps) {
    const [isPending, setIsPending] = useState(false);
    const [talleSeleccionado, setTalleSeleccionado] = useState<string | null>(null);

    // Determinar si hay variantes de talle disponibles (excluyendo "Único" para simplificar)
    const variantesConTalle = variantes.filter(v => v.talle.toLowerCase() !== 'único');
    const esTalleUnico = variantes.length === 1 && variantes[0].talle.toLowerCase() === 'único';

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<FormInput>({
        resolver: zodResolver(schemaListaEspera),
        defaultValues: {
            email: '',
            telefono: '',
            variante_id: esTalleUnico ? variantes[0].id : null,
        }
    });

    const handleSelectTalle = (variante: Variante) => {
        if (talleSeleccionado === variante.id) {
            // Deseleccionar si ya estaba seleccionado
            setTalleSeleccionado(null);
            setValue('variante_id', null);
        } else {
            setTalleSeleccionado(variante.id);
            setValue('variante_id', variante.id);
        }
    };

    const onSubmit = async (data: FormInput) => {
        setIsPending(true);
        try {
            await actionCrearListaEspera({
                producto_id: productoId,
                tenant_id: tenantId,
                variante_id: data.variante_id || null,
                email: data.email || null,
                telefono: data.telefono,
            });

            toast.success('¡Te has unido con éxito! Te notificaremos cuando tengamos stock.');
            reset();
            setTalleSeleccionado(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Ocurrió un error al unirse a la lista de espera');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="w-full bg-zinc-50 dark:bg-zinc-900 border border-border rounded-xl p-5 mt-6">
            <h3 className="text-base font-bold text-foreground mb-1">Producto Agotado</h3>
            <p className="text-xs text-muted-foreground mb-4">
                Déjanos tus datos de contacto y te avisaremos inmediatamente cuando {productoNombre} vuelva a estar disponible.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Selector Opcional de Talle */}
                {variantesConTalle.length > 0 && (
                    <div className="space-y-1.5">
                        <span className="block text-xs font-semibold text-foreground">
                            ¿Qué talle buscas? <span className="font-normal text-muted-foreground">(Opcional)</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {variantesConTalle.map((v) => {
                                const seleccionado = talleSeleccionado === v.id;
                                return (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => handleSelectTalle(v)}
                                        className={`px-3 py-1.5 text-xs font-bold border rounded-lg transition-all active:scale-95 cursor-pointer ${
                                            seleccionado
                                                ? 'bg-foreground text-background border-foreground shadow-sm'
                                                : 'bg-transparent text-zinc-500 border-border hover:border-foreground hover:text-foreground'
                                        }`}>
                                        {v.talle}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Campo Teléfono */}
                <div>
                    <label htmlFor="telefono" className="block text-xs font-semibold text-foreground mb-1">
                        Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="telefono"
                        type="tel"
                        {...register('telefono')}
                        placeholder="Ej. 11 1234 5678"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all"
                    />
                    {errors.telefono && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.telefono.message}</p>
                    )}
                </div>

                {/* Campo Email */}
                <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1">
                        Email <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                    <input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="tu@email.com"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground focus:ring-1 focus:ring-foreground transition-all"
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
                    )}
                </div>

                {/* Botón de envío */}
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/10 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {isPending ? 'Uniéndote...' : 'Avisarme cuando haya Stock'}
                </button>
            </form>
        </div>
    );
}
