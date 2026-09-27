'use client';

import { useEffect, useState } from 'react';
import { leerLinkWhatsApp } from '@/src/lib/utils/linkWhatsappStorage';

interface BotonAbrirWhatsAppProps {
    readonly pedidoId: string;
    readonly enlaceServidor: string;
}

export function BotonAbrirWhatsApp({
    pedidoId,
    enlaceServidor,
}: BotonAbrirWhatsAppProps) {
    const [enlace, setEnlace] = useState<string>(enlaceServidor);

    useEffect(() => {
        const link = leerLinkWhatsApp(pedidoId);
        if (link) {
            setEnlace(link);
        }
    }, [pedidoId]);

    return (
        <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700"
        >
            Abrir WhatsApp
        </a>
    );
}
