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
            <div className="rounded-lg border border-border p-10 text-center text-foreground/60">
                No hay clientes registrados todavía.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <label htmlFor="buscador-clientes" className="sr-only">
                    Buscar clientes
                </label>
                <input
                    id="buscador-clientes"
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm bg-transparent text-foreground border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
            </div>

            <div className="overflow-x-auto rounded-lg border border-border bg-background">
                <table className="w-full min-w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/30 text-foreground/70 uppercase tracking-wider">
                            <th className="px-4 py-3 font-semibold">Nombre</th>
                            <th className="px-4 py-3 font-semibold">Teléfono</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold text-center">Cant. Pedidos</th>
                            <th className="px-4 py-3 font-semibold text-right">Total Gastado</th>
                            <th className="px-4 py-3 font-semibold">Etiqueta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {clientesFiltrados.map((cliente) => (
                            <tr key={cliente.id} className="hover:bg-foreground/5 transition-colors">
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/clientes/${cliente.id}`}
                                        className="font-medium text-foreground hover:underline"
                                    >
                                        {cliente.nombre_completo}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-foreground/70">{cliente.telefono}</td>
                                <td className="px-4 py-3 text-foreground/70">{cliente.email ?? '—'}</td>
                                <td className="px-4 py-3 text-center">{cliente.cantidad_pedidos ?? 0}</td>
                                <td className="px-4 py-3 text-right font-mono">
                                    $ {Number(cliente.total_gastado ?? 0).toLocaleString('es-AR')}
                                </td>
                                <td className="px-4 py-3">
                                    {cliente.etiqueta ? (
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                                                cliente.etiqueta.estilos,
                                            )}
                                        >
                                            {cliente.etiqueta.texto}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-foreground/50">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {clientesFiltrados.length === 0 && searchTerm && (
                <p className="text-sm text-foreground/60">
                    No se encontraron clientes que coincidan con &quot;{searchTerm}&quot;.
                </p>
            )}
        </div>
    );
}
