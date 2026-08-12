import Link from 'next/link';
import { FormularioProducto } from '@/src/features/admin/components/FormularioProducto';

export default function NuevoProductoPage() {
    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Crear Nuevo Producto</h1>
                    <p className="text-sm text-foreground opacity-70 mt-1">
                        Completa los datos para agregar medias al catálogo.
                    </p>
                </div>

                <Link
                    href="/admin"
                    className="px-4 py-2 text-sm font-semibold text-foreground bg-transparent border border-border rounded-lg hover:border-foreground transition-colors">
                    Cancelar
                </Link>
            </div>

            {/* Contenedor del Formulario */}
            <div className="bg-background border border-border rounded-xl p-4 md:p-6 shadow-sm">
                <FormularioProducto />
            </div>
        </div>
    );
}
