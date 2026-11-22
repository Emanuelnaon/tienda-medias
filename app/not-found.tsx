import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-96 flex-1 items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-violet">Error 404</p>
                <h1 className="mt-3 text-3xl font-black text-foreground">Página no encontrada</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    El recurso que buscas no existe o ya no está disponible.
                </p>

                <Link
                    href="/"
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
