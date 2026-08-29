import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-background p-6">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Error 404</p>
                <h1 className="mt-3 text-3xl font-black text-foreground">Página no encontrada</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    El recurso que buscas no existe o ya no está disponible.
                </p>

                <Link
                    href="/"
                    className="mt-6 inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-90">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
