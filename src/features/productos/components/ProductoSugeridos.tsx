import { TarjetaProducto } from '@/src/features/catalogo/components/TarjetaProducto';
import { getProductosRelacionados } from '@/src/features/productos/api/queries';

interface ProductoSugeridosProps {
    categoria: string | null;
    productoId: string;
}

export default async function ProductoSugeridos({ categoria, productoId }: ProductoSugeridosProps) {
    if (!categoria) {
        return null;
    }

    const productos = await getProductosRelacionados(categoria, productoId, 4);

    if (!productos || productos.length === 0) {
        return null;
    }

    return (
        <section className="mt-12 border-t border-border pt-8">
            <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">
                    También te puede interesar
                </p>
                <h2 className="mt-2 text-2xl font-bold text-foreground">Productos relacionados</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                {productos.map((producto) => (
                    <TarjetaProducto key={producto.id} producto={producto} />
                ))}
            </div>
        </section>
    );
}
