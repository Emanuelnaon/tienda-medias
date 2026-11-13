'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/src/lib/utils/cn';
import { actionEliminarZonaEnvio } from '@/src/features/logistica/actions/actionEliminarZonaEnvio';
import { actionToggleZonaEnvio } from '@/src/features/logistica/actions/actionToggleZonaEnvio';
import { ETIQUETAS_METODO_ENVIO } from '@/src/features/logistica/utils/describirEnvio';
import type { ZonaEnvio } from '@/src/features/logistica/types';

type ListaZonasEnvioProps = Readonly<{
    zonasIniciales: ReadonlyArray<ZonaEnvio>;
}>;

function formatearRango(zona: ZonaEnvio): string {
    const desde = zona.codigo_postal_desde ?? '';
    const hasta = zona.codigo_postal_hasta ?? '';

    if (desde === '' && hasta === '') {
        return 'Todo el país';
    }

    if (hasta === '') {
        return `Desde ${desde}`;
    }

    if (desde === '') {
        return `Hasta ${hasta}`;
    }

    return desde === hasta ? desde : `${desde} – ${hasta}`;
}

export function ListaZonasEnvio({ zonasIniciales }: ListaZonasEnvioProps) {
    const [zonas, setZonas] = useState<ReadonlyArray<ZonaEnvio>>(zonasIniciales);
    const [zonaEnProceso, setZonaEnProceso] = useState<string | null>(null);
    const [zonaPorConfirmar, setZonaPorConfirmar] = useState<string | null>(null);

    const handleToggle = async (zona: ZonaEnvio) => {
        setZonaEnProceso(zona.id);
        try {
            const { activo } = await actionToggleZonaEnvio(zona.id);
            setZonas((previas) =>
                previas.map((item) => (item.id === zona.id ? { ...item, activo } : item)),
            );
            toast.success(activo ? 'Zona de envío activada' : 'Zona de envío desactivada');
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'No se pudo actualizar la zona de envío',
            );
        } finally {
            setZonaEnProceso(null);
        }
    };

    const handleEliminar = async (zona: ZonaEnvio) => {
        setZonaEnProceso(zona.id);
        try {
            await actionEliminarZonaEnvio(zona.id);
            setZonas((previas) => previas.filter((item) => item.id !== zona.id));
            setZonaPorConfirmar(null);
            toast.success('Zona de envío eliminada');
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'No se pudo eliminar la zona de envío',
            );
        } finally {
            setZonaEnProceso(null);
        }
    };

    if (zonas.length === 0) {
        return (
            <p className="rounded-lg border border-dashed border-border bg-surface p-6 text-center text-sm leading-relaxed text-muted-foreground">
                Todavía no cargaste zonas de envío. Agregá la primera con el formulario.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">Nombre</th>
                        <th className="px-4 py-3 font-semibold">Rango CP</th>
                        <th className="px-4 py-3 font-semibold">Método</th>
                        <th className="px-4 py-3 text-right font-semibold">Costo</th>
                        <th className="px-4 py-3 text-right font-semibold">Gratis desde</th>
                        <th className="px-4 py-3 text-center font-semibold">Activo</th>
                        <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {zonas.map((zona) => {
                        const estaEnProceso = zonaEnProceso === zona.id;

                        return (
                            <tr key={zona.id} className={cn(!zona.activo && 'opacity-60')}>
                                <td className="px-4 py-3 font-semibold">{zona.nombre}</td>
                                <td className="px-4 py-3 font-sans tabular-nums text-muted-foreground">
                                    {formatearRango(zona)}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {ETIQUETAS_METODO_ENVIO[zona.metodo]}
                                </td>
                                <td className="px-4 py-3 text-right font-sans tabular-nums">
                                    ${Number(zona.costo).toLocaleString('es-AR')}
                                </td>
                                <td className="px-4 py-3 text-right font-sans tabular-nums text-muted-foreground">
                                    {zona.minimo_envio_gratis === null
                                        ? '—'
                                        : `$${Number(zona.minimo_envio_gratis).toLocaleString('es-AR')}`}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={zona.activo}
                                        aria-label={`${zona.activo ? 'Desactivar' : 'Activar'} la zona ${zona.nombre}`}
                                        disabled={estaEnProceso}
                                        onClick={() => handleToggle(zona)}
                                        className={cn(
                                            'inline-flex h-6 w-11 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                                            zona.activo
                                                ? 'border-emerald bg-emerald'
                                                : 'border-border bg-muted',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'inline-block h-4 w-4 rounded-full bg-surface transition-transform',
                                                zona.activo ? 'translate-x-6' : 'translate-x-1',
                                            )}
                                        />
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {zonaPorConfirmar === zona.id ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-foreground/70">
                                                ¿Eliminar?
                                            </span>
                                            <button
                                                type="button"
                                                disabled={estaEnProceso}
                                                onClick={() => handleEliminar(zona)}
                                            className="min-h-9 rounded-md bg-danger px-3 py-1 text-xs font-bold text-danger-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-50"
                                            >
                                                Sí
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setZonaPorConfirmar(null)}
                                                className="min-h-9 rounded-md border border-border px-3 py-1 text-xs font-bold text-foreground transition-colors hover:border-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={estaEnProceso}
                                            onClick={() => setZonaPorConfirmar(zona.id)}
                                            className="min-h-9 rounded-md px-3 text-xs font-bold text-danger transition-colors hover:bg-danger hover:text-danger-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
