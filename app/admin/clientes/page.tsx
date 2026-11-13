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
            <div className="rounded-xl border border-danger/40 bg-danger p-4 text-danger-foreground">
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
            <div className="rounded-xl border border-warning/40 bg-warning p-4 text-warning-foreground">
                <p className="font-semibold">Feature no disponible</p>
                <p className="mt-1 text-sm">
                    La funcionalidad CRM Clientes no está habilitada para tu plan actual.
                </p>
            </div>
        );
    }

    return (
        <Suspense fallback={<p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Cargando clientes...</p>}>
            <TablaClientesWrapper />
        </Suspense>
    );
}

export default async function ClientesPage() {
    return (
        <section className="space-y-6">
            <header className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">CRM Clientes</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    Visualización y gestión de la base de datos de clientes, historial de compras y métricas.
                </p>
            </header>

            <FeatureGateWrapper />
        </section>
    );
}
