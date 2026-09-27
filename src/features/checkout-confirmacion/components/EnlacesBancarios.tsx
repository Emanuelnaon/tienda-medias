'use client';

import { DEEP_LINK_APPS } from '@/src/lib/constants/deepLinks';
import toast from 'react-hot-toast';

interface EnlacesBancariosProps {
    readonly cbu: string | null;
    readonly aliasBancario: string | null;
    readonly total: number;
}

const TIEMPO_DETECCION_MS = 1500;

function payloadPago(cbu: string | null, aliasBancario: string | null, total: number): string {
    return `CBU:${cbu ?? ''}|ALIAS:${aliasBancario ?? ''}|MONTO:${total}`;
}

function fallbackClipboardOCita(fallbackUrl: string, datos: string): void {
    navigator.clipboard
        .writeText(datos)
        .then(() =>
            toast.success(
                'La app no se abrió. Datos de pago copiados al portapapeles',
            ),
        )
        .catch(() => {
            window.location.assign(fallbackUrl);
        });
}

export function EnlacesBancarios({ cbu, aliasBancario, total }: EnlacesBancariosProps) {
    const handleOpenApp = (scheme: string, fallbackUrl: string) => {
        const datos = payloadPago(cbu, aliasBancario, total);
        let abierta = false;

        const manejarBlur = () => {
            abierta = true;
        };

        const timer = setTimeout(() => {
            window.removeEventListener('blur', manejarBlur);
            if (!abierta) {
                fallbackClipboardOCita(fallbackUrl, datos);
            }
        }, TIEMPO_DETECCION_MS);

        window.addEventListener('blur', manejarBlur, { once: true });

        try {
            window.location.assign(scheme);
        } catch {
            clearTimeout(timer);
            window.removeEventListener('blur', manejarBlur);
            fallbackClipboardOCita(fallbackUrl, datos);
        }
    };

    return (
        <div className="space-y-3 rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold text-foreground">
                Abrí la app de tu banco
            </h3>
            <p className="text-sm text-muted-foreground">
                Tocá el botón de tu entidad para abrir la app y realizar el pago.
                Si la app no se abre, se copian los datos al portapapeles.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {DEEP_LINK_APPS.map((app) => (
                    <button
                        key={app.nombre}
                        type="button"
                        onClick={() => handleOpenApp(app.scheme, app.fallbackUrl)}
                        className="rounded-md border border-border bg-muted px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-border"
                    >
                        {app.nombre}
                    </button>
                ))}
            </div>
        </div>
    );
}
