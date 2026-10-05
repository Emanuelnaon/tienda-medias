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
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-foreground bg-background">
            <header className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold">Configuración Global</h1>
                    <p className="text-sm text-foreground/70 mt-1">
                        Configurá los datos de pago, los envíos y los métodos de cobro de tu tienda.
                    </p>
                </div>
                <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-semibold text-foreground bg-transparent border border-border rounded-lg hover:border-foreground transition-colors"
                >
                    Volver al Dashboard
                </Link>
            </header>

            <section className="border border-border rounded-xl bg-background p-6">
                <h2 className="text-lg font-semibold mb-1">Datos bancarios</h2>
                <p className="text-sm text-foreground/60 mb-4">
                    Estos datos se mostrarán al comprador en la página de confirmación de pedido para poder abonar.
                </p>
                <FormularioDatosBancarios datosIniciales={datos} isWebmaster={isWebmaster} />
            </section>

            <section className="border border-border rounded-xl bg-background p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold mb-1">Zonas de envío</h2>
                    <p className="text-sm text-foreground/60">
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
                    <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
                        <p className="font-semibold">Feature no disponible</p>
                        <p className="text-sm mt-1">
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