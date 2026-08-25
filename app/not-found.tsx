import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Error 404</p>
            <h1 className="text-3xl font-bold">Página no encontrada</h1>
            <p className="text-muted-foreground">El recurso que buscas no existe o ya no está disponible.</p>
            <Link
                href="/"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
                Volver al inicio
            </Link>
        </div>
    );
}
