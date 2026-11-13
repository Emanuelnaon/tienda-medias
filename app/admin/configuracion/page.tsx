import Link from 'next/link';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import {
    FormularioDatosBancarios,
    obtenerDatosBancariosTenant,
    type DatosBancariosTenant,
} from '@/src/features/configuracion-pagos';
import {
    FormularioZonaEnvio,
    ListaZonasEnvio,
    type ZonaEnvio,
} from '@/src/features/logistica';
import { listarZonasEnvio } from '@/src/features/logistica/server';
import { tieneFeature } from '@/src/lib/auth/entitlements';

export default async function ConfiguracionPage() {
    const supabase = await createSupabaseServerClient();

    const { data: isWebmasterData, error: isWebmasterError } = await supabase.rpc('is_webmaster');
    const isWebmaster = !isWebmasterError && isWebmasterData === true;

    const datos: DatosBancariosTenant | null = isWebmaster
        ? null
        : await obtenerDatosBancariosTenant();

    const zonasHabilitadas = isWebmaster ? false : await tieneFeature('shipping_zones');

    let zonas: ZonaEnvio[] = [];
    if (zonasHabilitadas) {
        zonas = await listarZonasEnvio();
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 bg-background text-foreground">
            <header className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                    <h1 className="font-display text-3xl font-bold leading-tight">Configuración Global</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        Configurá los datos de pago, los envíos y los métodos de cobro de tu tienda.
                    </p>
                </div>
                <Link
                    href="/admin"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-violet hover:text-violet-soft-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet sm:w-auto"
                >
                    Volver al Dashboard
                </Link>
            </header>

            <section className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
                <h2 className="mb-1 font-display text-xl font-bold">Datos bancarios</h2>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    Estos datos se mostrarán al comprador en la página de confirmación de pedido para poder abonar.
                </p>
                <FormularioDatosBancarios datosIniciales={datos} isWebmaster={isWebmaster} />
            </section>

            <section className="space-y-5 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
                <div>
                    <h2 className="mb-1 font-display text-xl font-bold">Zonas de envío</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Definí las zonas por código postal, su método de envío y su costo. El comprador
                        ve el estimado al ingresar su código postal en el checkout.
                    </p>
                </div>

                {zonasHabilitadas ? (
                    <>
                        <FormularioZonaEnvio />
                        <ListaZonasEnvio zonasIniciales={zonas} />
                    </>
                ) : (
                    <div className="rounded-lg border border-warning bg-warning p-4 text-warning-foreground">
                        <p className="font-semibold">Feature no disponible</p>
                        <p className="mt-1 text-sm leading-relaxed">
                            {isWebmaster
                                ? 'Como webmaster tenés acceso de solo lectura: no podés modificar las zonas de envío del tenant.'
                                : 'La gestión de zonas de envío no está habilitada para tu plan actual.'}
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
