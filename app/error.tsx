'use client';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    console.error(error);

    return (
        <div className="flex min-h-96 flex-1 items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-2xl border border-danger/40 bg-card p-8 text-center shadow-sm">
                <p className="mx-auto w-fit rounded-md bg-danger px-2 py-1 text-xs font-black uppercase tracking-wide text-danger-foreground">Algo salió mal</p>
                <h1 className="mt-3 text-3xl font-black text-foreground">No pudimos cargar esta página</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Intenta nuevamente para continuar. Si el problema persiste, vuelve más tarde.
                </p>

                <button
                    type="button"
                    onClick={reset}
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    Reintentar
                </button>
            </div>
        </div>
    );
}
