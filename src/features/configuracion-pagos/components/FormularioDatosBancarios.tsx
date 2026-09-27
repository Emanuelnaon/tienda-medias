'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
    datosBancariosSchema,
    type DatosBancariosInput,
} from '@/src/features/configuracion-pagos/utils/datosBancariosSchema';
import { actionGuardarDatosBancarios } from '@/src/features/configuracion-pagos/actions/actionGuardarDatosBancarios';
import type { DatosBancariosTenant } from '@/src/features/configuracion-pagos/api/queries';

interface FormularioDatosBancariosProps {
    readonly datosIniciales: DatosBancariosTenant | null;
    readonly isWebmaster: boolean;
}

export function FormularioDatosBancarios({ datosIniciales, isWebmaster }: FormularioDatosBancariosProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<DatosBancariosInput>({
        resolver: zodResolver(datosBancariosSchema),
        defaultValues: {
            cbu: datosIniciales?.cbu ?? '',
            alias_bancario: datosIniciales?.alias_bancario ?? '',
            banco: datosIniciales?.banco ?? '',
            titular_cuenta: datosIniciales?.titular_cuenta ?? '',
            meta_pixel_id: datosIniciales?.meta_pixel_id ?? '',
        },
    });

    const onSubmit = async (data: DatosBancariosInput) => {
        try {
            await actionGuardarDatosBancarios(data);
            toast.success('Datos bancarios guardados correctamente');
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Error al guardar los datos bancarios',
            );
        }
    };

    const inputClass =
        'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <p className="text-xs text-foreground/70">
                Estos datos se mostrarán al comprador en la página de confirmación de pedido para poder abonar.
            </p>

            <div>
                <label htmlFor="cbu" className="mb-1 block text-sm font-semibold text-foreground">
                    CBU
                </label>
                <input
                    id="cbu"
                    type="text"
                    inputMode="numeric"
                    maxLength={22}
                    readOnly={isWebmaster}
                    disabled={isWebmaster}
                    {...register('cbu')}
                    placeholder="22 dígitos numéricos"
                    className={inputClass}
                />
                {errors.cbu && <p className="mt-1 text-xs text-red-600">{errors.cbu.message}</p>}
            </div>

            <div>
                <label htmlFor="alias_bancario" className="mb-1 block text-sm font-semibold text-foreground">
                    Alias bancario
                </label>
                <input
                    id="alias_bancario"
                    type="text"
                    maxLength={20}
                    readOnly={isWebmaster}
                    disabled={isWebmaster}
                    {...register('alias_bancario')}
                    placeholder="Ej. medias12345"
                    className={inputClass}
                />
                {errors.alias_bancario && (
                    <p className="mt-1 text-xs text-red-600">{errors.alias_bancario.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="banco" className="mb-1 block text-sm font-semibold text-foreground">
                    Banco
                </label>
                <input
                    id="banco"
                    type="text"
                    readOnly={isWebmaster}
                    disabled={isWebmaster}
                    {...register('banco')}
                    placeholder="Ej. Banco Galicia"
                    className={inputClass}
                />
                {errors.banco && <p className="mt-1 text-xs text-red-600">{errors.banco.message}</p>}
            </div>

            <div>
                <label htmlFor="titular_cuenta" className="mb-1 block text-sm font-semibold text-foreground">
                    Titular de la cuenta
                </label>
                <input
                    id="titular_cuenta"
                    type="text"
                    readOnly={isWebmaster}
                    disabled={isWebmaster}
                    {...register('titular_cuenta')}
                    placeholder="Nombre completo del titular"
                    className={inputClass}
                />
                {errors.titular_cuenta && (
                    <p className="mt-1 text-xs text-red-600">{errors.titular_cuenta.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="meta_pixel_id" className="mb-1 block text-sm font-semibold text-foreground">
                    Meta Pixel ID (opcional)
                </label>
                <input
                    id="meta_pixel_id"
                    type="text"
                    readOnly={isWebmaster}
                    disabled={isWebmaster}
                    {...register('meta_pixel_id')}
                    placeholder="Ej. 1234567890"
                    className={inputClass}
                />
                {errors.meta_pixel_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.meta_pixel_id.message}</p>
                )}
            </div>

            {isWebmaster ? (
                <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
                    <p className="font-semibold">Modo solo lectura</p>
                    <p>
                        Un webmaster solo puede visualizar los datos bancarios del tenant.{' '}
                        <Link href="/admin" className="underline">
                            Volver al dashboard
                        </Link>
                    </p>
                </div>
            ) : (
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : 'Guardar datos bancarios'}
                </button>
            )}
        </form>
    );
}
