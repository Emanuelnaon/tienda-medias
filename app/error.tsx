'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
            <p className="text-sm font-bold uppercase tracking-wider text-red-600">Algo salió mal</p>
            <h1 className="text-3xl font-bold">No pudimos cargar esta página</h1>
            <p className="text-muted-foreground">Intenta nuevamente para continuar.</p>
            <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
                Reintentar
            </button>
        </div>
    );
}
