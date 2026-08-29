export default function Loading() {
    return (
        <div
            className="flex min-h-[60vh] flex-1 items-center justify-center bg-background p-6"
            role="status"
            aria-live="polite"
            aria-label="Cargando contenido">
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-blue-600" />
                    Cargando...
                </div>

                <div className="w-full space-y-2">
                    <div className="h-3 w-full animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-5/6 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>
            </div>
        </div>
    );
}
