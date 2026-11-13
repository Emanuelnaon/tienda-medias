'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils/cn';
import type { ClienteConEtiqueta } from '@/src/features/admin/types/clientesTypes';

interface TablaClientesProps {
    readonly clientesIniciales: ReadonlyArray<ClienteConEtiqueta>;
}

export function TablaClientes({ clientesIniciales }: TablaClientesProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const clientesFiltrados = useMemo(() => {
        if (!searchTerm.trim()) return clientesIniciales;
        const term = searchTerm.toLowerCase();
        return clientesIniciales.filter(
            (c) =>
                c.nombre_completo.toLowerCase().includes(term) ||
                c.telefono.toLowerCase().includes(term),
        );
    }, [clientesIniciales, searchTerm]);

    if (clientesIniciales.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                No hay clientes registrados todavía.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
                <label htmlFor="buscador-clientes" className="sr-only">
                    Buscar clientes
                </label>
                <input
                    id="buscador-clientes"
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/20"
                />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-4 font-semibold">Nombre</th>
                            <th className="px-4 py-4 font-semibold">Teléfono</th>
                            <th className="px-4 py-4 font-semibold">Email</th>
                            <th className="px-4 py-4 text-center font-semibold">Cant. Pedidos</th>
                            <th className="px-4 py-4 text-right font-semibold">Total Gastado</th>
                            <th className="px-4 py-4 font-semibold">Etiqueta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {clientesFiltrados.map((cliente) => (
                            <tr key={cliente.id} className="transition-colors hover:bg-muted/60">
                                <td className="px-4 py-4">
                                    <Link
                                        href={`/admin/clientes/${cliente.id}`}
                                        className="font-semibold text-foreground underline-offset-4 hover:text-violet hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
                                    >
                                        {cliente.nombre_completo}
                                    </Link>
                                </td>
                                <td className="px-4 py-4 text-muted-foreground">{cliente.telefono}</td>
                                <td className="px-4 py-4 text-muted-foreground">{cliente.email ?? '—'}</td>
                                <td className="px-4 py-4 text-center tabular-nums">{cliente.cantidad_pedidos ?? 0}</td>
                                <td className="px-4 py-4 text-right font-medium tabular-nums">
                                    $ {Number(cliente.total_gastado ?? 0).toLocaleString('es-AR')}
                                </td>
                                <td className="px-4 py-4">
                                    {cliente.etiqueta ? (
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                cliente.etiqueta.estilos,
                                            )}
                                        >
                                            {cliente.etiqueta.texto}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {clientesFiltrados.length === 0 && searchTerm && (
                <p className="text-sm text-muted-foreground">
                    No se encontraron clientes que coincidan con &quot;{searchTerm}&quot;.
                </p>
            )}
        </div>
    );
}
