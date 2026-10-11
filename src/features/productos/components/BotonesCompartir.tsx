'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface BotonesCompartirProps {
    readonly productoNombre: string;
    readonly productoPrecio: number;
    readonly productoId: string;
}

export function BotonesCompartir({
    productoNombre,
    productoPrecio,
    productoId,
}: BotonesCompartirProps) {
    const [copiando, setCopiando] = useState(false);

    const url = `${window.location.origin}/producto/${productoId}`;

    const handleCompartirWhatsApp = () => {
        const texto = `${productoNombre} - $${productoPrecio}\n${url}`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(texto)}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    const handleCopiarLink = async () => {
        setCopiando(true);
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = url;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            toast.success('Link copiado');
        } catch {
            toast.error('No se pudo copiar el link');
        } finally {
            setCopiando(false);
        }
    };

    return (
        <section className="flex flex-wrap gap-3 pt-4">
            <button
                type="button"
                onClick={handleCompartirWhatsApp}
                className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-green-700"
            >
                Compartir WhatsApp
            </button>
            <button
                type="button"
                onClick={handleCopiarLink}
                disabled={copiando}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
                {copiando ? 'Copiando...' : 'Copiar link'}
            </button>
        </section>
    );
}
