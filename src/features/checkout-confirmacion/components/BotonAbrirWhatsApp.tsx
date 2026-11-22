'use client';

interface BotonAbrirWhatsAppProps {
    readonly pedidoId: string;
    readonly enlaceServidor: string;
}

export function BotonAbrirWhatsApp({
    enlaceServidor,
}: BotonAbrirWhatsAppProps) {
    return (
        <a
            href={enlaceServidor}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald px-4 py-3 text-sm font-bold text-emerald-foreground transition-colors hover:bg-emerald-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none"
        >
            Abrir WhatsApp
        </a>
    );
}
