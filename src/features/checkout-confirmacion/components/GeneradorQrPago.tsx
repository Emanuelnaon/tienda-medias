'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import toast from 'react-hot-toast';

interface GeneradorQrPagoProps {
    readonly cbu: string | null;
    readonly aliasBancario: string | null;
    readonly titularCuenta: string | null;
    readonly numeroOrden: string;
    readonly total: number;
}

export function GeneradorQrPago({ cbu, aliasBancario, titularCuenta, numeroOrden, total }: GeneradorQrPagoProps) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const payload = `NOMBRE:${titularCuenta ?? ''}|CBU:${cbu ?? ''}|ALIAS:${aliasBancario ?? ''}\nMONTO:${total}|CONCEPTO:${numeroOrden}`;
        toDataURL(payload)
            .then((url) => setDataUrl(url))
            .catch(() => {
                setError(true);
                toast.error('No se pudo generar el código QR');
            });
    }, [cbu, aliasBancario, titularCuenta, numeroOrden, total]);

    if (error) {
        return (
            <div className="rounded-xl border border-border bg-muted p-6 text-center text-sm text-muted-foreground">
                <p className="font-medium">Código QR no disponible</p>
                <p className="mt-1">
                    Copiá los datos de pago manualmente y abrí la app de tu banco.
                </p>
            </div>
        );
    }

    if (!dataUrl) {
        return <p className="text-sm text-muted-foreground">Generando código QR…</p>;
    }

    return (
        <Image
            src={dataUrl}
            alt="Código QR para el pago"
            width={200}
            height={200}
            unoptimized
            className="mx-auto max-w-[240px] rounded-xl border border-border bg-white"
        />
    );
}
