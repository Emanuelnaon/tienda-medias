'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Share2 } from 'lucide-react';

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

    const handleCompartirWhatsApp = () => {
        const url = `${window.location.origin}/producto/${productoId}`;
        const texto = `${productoNombre} - $${productoPrecio}\n${url}`;
        window.open(
            `https://wa.me/?text=${encodeURIComponent(texto)}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    const handleCompartir = async () => {
        const url = `${window.location.origin}/producto/${productoId}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: productoNombre,
                    text: `¡Mira esto en nuestra tienda! ${productoNombre}`,
                    url,
                });
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    toast.error('No se pudo compartir el enlace');
                }
            }
            return;
        }

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
            toast.success('Enlace copiado al portapapeles');
        } catch {
            toast.error('No se pudo copiar el enlace');
        } finally {
            setCopiando(false);
        }
    };

    return (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
                type="button"
                onClick={handleCompartirWhatsApp}
                aria-label="Compartir por WhatsApp"
                title="Compartir por WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald text-emerald-foreground shadow-md transition-colors hover:bg-emerald-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2"
            >
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
                type="button"
                onClick={handleCompartir}
                disabled={copiando}
                aria-label="Compartir producto"
                title="Compartir producto"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
            >
                <Share2 aria-hidden="true" className="h-5 w-5" />
            </button>
        </div>
    );
}
