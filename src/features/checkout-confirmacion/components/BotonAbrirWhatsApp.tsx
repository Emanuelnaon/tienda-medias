'use client';

import { useState } from 'react';
import { leerLinkWhatsApp } from '@/src/lib/utils/linkWhatsappStorage';

interface BotonAbrirWhatsAppProps {
    readonly pedidoId: string;
    readonly enlaceServidor: string;
}

export function BotonAbrirWhatsApp({
    pedidoId,
    enlaceServidor,
}: BotonAbrirWhatsAppProps) {
    const [enlace] = useState<string>(() =>
        typeof window !== 'undefined' ? leerLinkWhatsApp(pedidoId) ?? enlaceServidor : enlaceServidor,
    );

    return (
        <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald px-4 py-3 text-sm font-bold text-emerald-foreground transition-colors hover:bg-emerald-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
            Abrir WhatsApp
        </a>
    );
}
