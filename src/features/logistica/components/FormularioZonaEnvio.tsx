'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { actionGuardarZonaEnvio } from '@/src/features/logistica/actions/actionGuardarZonaEnvio';
import { METODOS_ENVIO, type MetodoEnvio } from '@/src/features/logistica/types';
import { ETIQUETAS_METODO_ENVIO } from '@/src/features/logistica/utils/describirEnvio';
import { zonaEnvioSchema, type ZonaEnvioInput } from '@/src/features/logistica/utils/zonaEnvioSchema';

const OPCIONES_METODO: ReadonlyArray<MetodoEnvio> = [
    METODOS_ENVIO.retiro,
    METODOS_ENVIO.mensajeria_local,
    METODOS_ENVIO.correo,
];

const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted';

export function FormularioZonaEnvio() {
    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ZonaEnvioInput>({
        resolver: zodResolver(zonaEnvioSchema),
        defaultValues: {
            nombre: '',
            codigo_postal_desde: '',
            codigo_postal_hasta: '',
            metodo: METODOS_ENVIO.mensajeria_local,
            costo: 0,
            minimo_envio_gratis: '',
        },
    });

    const metodoSeleccionado = useWatch({ control, name: 'metodo' });
    const esRetiro = metodoSeleccionado === METODOS_ENVIO.retiro;

    const handleCambiarMetodo = (metodo: MetodoEnvio) => {
        setValue('metodo', metodo, { shouldValidate: false, shouldDirty: true });

        if (metodo === METODOS_ENVIO.retiro) {
            setValue('costo', 0, { shouldValidate: false, shouldDirty: true });
        }
    };

    const onSubmit = async (zona: ZonaEnvioInput) => {
        try {
            await actionGuardarZonaEnvio(zona);
            toast.success('Zona de envío creada correctamente');
            reset();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Error al guardar la zona de envío',
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label htmlFor="zona_nombre" className="mb-1 block text-sm font-semibold text-foreground">
                        Nombre de la zona
                    </label>
                    <input
                        id="zona_nombre"
                        type="text"
                        {...register('nombre')}
                        placeholder="Ej. CABA y近郊"
                        className={inputClass}
                    />
                    {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
                </div>

                <div>
                    <label htmlFor="zona_metodo" className="mb-1 block text-sm font-semibold text-foreground">
                        Método de envío
                    </label>
                    <select
                        id="zona_metodo"
                        value={metodoSeleccionado}
                        onChange={(evento) => handleCambiarMetodo(evento.target.value as MetodoEnvio)}
                        className={inputClass}
                    >
                        {OPCIONES_METODO.map((metodo) => (
                            <option key={metodo} value={metodo}>
                                {ETIQUETAS_METODO_ENVIO[metodo]}
                            </option>
                        ))}
                    </select>
                    {errors.metodo && <p className="mt-1 text-xs text-red-600">{errors.metodo.message}</p>}
                </div>

                <div>
                    <label htmlFor="zona_costo" className="mb-1 block text-sm font-semibold text-foreground">
                        Costo de envío
                    </label>
                    <input
                        id="zona_costo"
                        type="number"
                        min={0}
                        step="0.01"
                        disabled={esRetiro}
                        {...register('costo', { valueAsNumber: true })}
                        className={inputClass}
                    />
                    {esRetiro && (
                        <p className="mt-1 text-xs text-foreground/60">
                            El retiro en el local siempre tiene costo 0.
                        </p>
                    )}
                    {errors.costo && <p className="mt-1 text-xs text-red-600">{errors.costo.message}</p>}
                </div>

                <div>
                    <label htmlFor="zona_cp_desde" className="mb-1 block text-sm font-semibold text-foreground">
                        Código postal desde
                    </label>
                    <input
                        id="zona_cp_desde"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        {...register('codigo_postal_desde')}
                        placeholder="Vacío = desde el primero"
                        className={inputClass}
                    />
                    {errors.codigo_postal_desde && (
                        <p className="mt-1 text-xs text-red-600">{errors.codigo_postal_desde.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="zona_cp_hasta" className="mb-1 block text-sm font-semibold text-foreground">
                        Código postal hasta
                    </label>
                    <input
                        id="zona_cp_hasta"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        {...register('codigo_postal_hasta')}
                        placeholder="Vacío = hasta el último"
                        className={inputClass}
                    />
                    {errors.codigo_postal_hasta && (
                        <p className="mt-1 text-xs text-red-600">{errors.codigo_postal_hasta.message}</p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label
                        htmlFor="zona_minimo_gratis"
                        className="mb-1 block text-sm font-semibold text-foreground"
                    >
                        Envío gratis desde (opcional)
                    </label>
                    <input
                        id="zona_minimo_gratis"
                        type="number"
                        min={0}
                        step="0.01"
                        {...register('minimo_envio_gratis')}
                        placeholder="Ej. 30000"
                        className={inputClass}
                    />
                    {errors.minimo_envio_gratis && (
                        <p className="mt-1 text-xs text-red-600">{errors.minimo_envio_gratis.message}</p>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
                {isSubmitting ? 'Guardando...' : 'Agregar zona de envío'}
            </button>
        </form>
    );
}