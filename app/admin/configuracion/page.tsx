import Link from 'next/link';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import {
    FormularioDatosBancarios,
    obtenerDatosBancariosTenant,
    type DatosBancariosTenant,
} from '@/src/features/configuracion-pagos';

export default async function ConfiguracionPage() {
    const supabase = await createSupabaseServerClient();

    const { data: isWebmasterData, error: isWebmasterError } = await supabase.rpc('is_webmaster');
    const isWebmaster = !isWebmasterError && isWebmasterData === true;

    const datos: DatosBancariosTenant | null = isWebmaster
        ? null
        : await obtenerDatosBancariosTenant();

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto text-foreground bg-background">
            <header className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold">Configuración Global</h1>
                    <p className="text-sm text-foreground/70 mt-1">
                        Configurá los datos de pago y método de cobro de tu tienda.
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
        </div>
    );
}
