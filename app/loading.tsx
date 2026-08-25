export default function Loading() {
    return (
        <div className="flex flex-1 items-center justify-center bg-background p-8" role="status" aria-label="Cargando">
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-blue-600" />
                Cargando...
            </div>
        </div>
    );
}
