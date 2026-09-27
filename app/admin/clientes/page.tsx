import { Suspense } from 'react';
import { listarClientes } from '@/src/features/admin/actions/clientesActions';
import { TablaClientes } from '@/src/features/admin/components';
import { tieneFeature } from '@/src/lib/auth/entitlements';
import type { ClienteConEtiqueta } from '@/src/features/admin/types/clientesTypes';

async function cargarClientes() {
    return listarClientes();
}

async function TablaClientesWrapper() {
    let clientes: ClienteConEtiqueta[] | null = null;
    let errorMessage: string | null = null;

    try {
        clientes = await cargarClientes();
    } catch (error: unknown) {
        errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    }

    if (errorMessage) {
        return (
            <div className="rounded-md border border-red-500/50 bg-red-500/10 p-4 text-red-700 dark:text-red-300">
                {errorMessage}
            </div>
        );
    }

    return <TablaClientes clientesIniciales={clientes ?? []} />;
}

async function FeatureGateWrapper() {
    const featureHabilitada = await tieneFeature('crm_clientes');

    if (!featureHabilitada) {
        return (
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                <p className="font-semibold">Feature no disponible</p>
                <p className="text-sm mt-1">
                    La funcionalidad CRM Clientes no está habilitada para tu plan actual.
                </p>
            </div>
        );
    }

    return (
        <Suspense fallback={<p className="text-sm text-foreground/60">Cargando clientes...</p>}>
            <TablaClientesWrapper />
        </Suspense>
    );
}

export default async function ClientesPage() {
    return (
        <section className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold">CRM Clientes</h2>
                <p className="text-sm text-foreground/70">
                    Visualización y gestión de la base de datos de clientes, historial de compras y métricas.
                </p>
            </header>

            <FeatureGateWrapper />
        </section>
    );
}