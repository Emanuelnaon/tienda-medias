'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface IndicacionesPagoProps {
    readonly cbu: string | null;
    readonly aliasBancario: string | null;
    readonly banco: string | null;
    readonly titularCuenta: string | null;
}

interface DatoPago {
    readonly label: string;
    readonly valor: string | null;
}

export function IndicacionesPago({
    cbu,
    aliasBancario,
    banco,
    titularCuenta,
}: IndicacionesPagoProps) {
    const [copiado, setCopiado] = useState<string | null>(null);

    const handleCopy = (valor: string | null) => {
        if (!valor) {
            return;
        }
        navigator.clipboard
            .writeText(valor)
            .then(() => {
                setCopiado(valor);
                toast.success('Dato copiado al portapapeles');
            })
            .catch(() => toast.error('No se pudo copiar el dato'));
    };

    const datos: DatoPago[] = [
        { label: 'Titular de la cuenta', valor: titularCuenta },
        { label: 'Banco', valor: banco },
        { label: 'CBU', valor: cbu },
        { label: 'Alias bancario', valor: aliasBancario },
    ];

    return (
        <div className="space-y-3 rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold text-foreground">
                Instrucciones de pago
            </h3>
            <p className="text-sm text-muted-foreground">
                Realizá el pago con los datos bancarios y luego abrí WhatsApp
                adjuntando el comprobante.
            </p>
            <div className="space-y-2">
                {datos.map((dato) => (
                    <div
                        key={dato.label}
                        className="flex items-center justify-between rounded-md border border-border bg-muted p-3"
                    >
                        <div className="flex flex-col">
                            <span className="block text-xs uppercase text-muted-foreground">
                                {dato.label}
                            </span>
                            <span className="font-medium break-all text-foreground">
                                {dato.valor ?? '—'}
                            </span>
                        </div>
                        {dato.valor && (
                            <button
                                type="button"
                                onClick={() => handleCopy(dato.valor)}
                                className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-border"
                            >
                                {copiado === dato.valor ? 'Copiado' : 'Copiar'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
