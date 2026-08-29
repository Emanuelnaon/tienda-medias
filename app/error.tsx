'use client';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    console.error(error);

    return (
        <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-card p-8 text-center shadow-sm dark:border-red-900/60">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">Algo salió mal</p>
                <h1 className="mt-3 text-3xl font-black text-foreground">No pudimos cargar esta página</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Intenta nuevamente para continuar. Si el problema persiste, vuelve más tarde.
                </p>

                <button
                    type="button"
                    onClick={reset}
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-90">
                    Reintentar
                </button>
            </div>
        </div>
    );
}
