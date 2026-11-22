'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import type { Database } from '@/src/types/supabase';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import Link from 'next/link';
import { guardarProductoConVariantes } from '@/src/features/admin/actions/productosActions';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;
type Producto = Database['public']['Tables']['productos']['Row'] & {
    categorias?: CategoriaResumen | null;
    producto_variantes?: Array<Pick<
        Database['public']['Tables']['producto_variantes']['Row'],
        'talle' | 'stock'
    >>;
};

interface PageProps {
    readonly params: Promise<{ id: string }>;
}

export default function EditarProductoPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [supabase] = useState(createClient);

    const [nombre, setNombre] = useState('');
    const [codigoCorto, setCodigoCorto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stockPorTalle, setStockPorTalle] = useState<Record<string, number>>({});
    const [categoriaId, setCategoriaId] = useState('');
    const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaResumen[]>([]);
    const [archivosImagenes, setArchivosImagenes] = useState<File[]>([]);
    const [imagenUrlExistente, setImagenUrlExistente] = useState('');
    const [galeriaExistente, setGaleriaExistente] = useState<string[]>([]);
    const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const opcionesTalles = ['S', 'M', 'L', 'XL', 'Único'];
    useEffect(() => {
        const cargarProducto = async () => {
            try {
                const [{ data, error }, { data: categoriasData, error: categoriasError }] = await Promise.all([
                    supabase
                    .from('productos')
                    .select('*, categorias:categorias(id,nombre,slug), producto_variantes(talle,stock)')
                    .eq('id', id)
                    .single(),
                    supabase.from('categorias').select('id, nombre, slug').order('nombre'),
                ]);

                if (error || !data) {
                    throw new Error('No se pudo cargar el producto');
                }
                if (categoriasError) {
                    throw new Error('No se pudieron cargar las categorías');
                }

                const prod = data as Producto;
                setNombre(prod.nombre);
                setCodigoCorto(prod.codigo_corto || '');
                setDescripcion(prod.descripcion || '');
                setPrecio(String(prod.precio));
                setCategoriaId(prod.categoria_id || '');
                setCategoriasDisponibles((categoriasData ?? []) as CategoriaResumen[]);
                setImagenUrlExistente(prod.imagen_url || '');
                setGaleriaExistente(Array.isArray(prod.galeria_imagenes) ? prod.galeria_imagenes.filter(Boolean) : []);

                // Sanitización al cargar: Si el producto tiene 'Único' junto a otros talles, forzamos 'Único'
                const rawTalles = prod.talles_disponibles || [];
                const variantes = prod.producto_variantes ?? [];
                const stockInicial = Object.fromEntries(
                    variantes.map((variante) => [variante.talle, variante.stock]),
                );
                if (rawTalles.includes('Único') && rawTalles.length > 1) {
                    setTallesDisponibles(['Único']);
                    setStockPorTalle({ Único: stockInicial['Único'] ?? prod.stock });
                } else {
                    setTallesDisponibles(rawTalles);
                    setStockPorTalle(
                        Object.fromEntries(
                            rawTalles.map((talle) => [
                                talle,
                                stockInicial[talle] ?? (rawTalles.length === 1 ? prod.stock : 0),
                            ]),
                        ),
                    );
                }
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar el producto para editar');
                router.push('/admin');
            } finally {
                setCargando(false);
            }
        };

        cargarProducto();
    }, [id, router, supabase]);

    // Lógica exclusiva de talles: "Único" desmarca todo y viceversa
    const toggleTalle = (talleSeleccionado: string) => {
        setTallesDisponibles((prev) => {
            if (talleSeleccionado === 'Único') {
                return prev.includes('Único') ? [] : ['Único'];
            }

            const sinUnico = prev.filter((t) => t !== 'Único');
            if (sinUnico.includes(talleSeleccionado)) {
                return sinUnico.filter((t) => t !== talleSeleccionado);
            }

            return [...sinUnico, talleSeleccionado];
        });

        setStockPorTalle((prev) => ({
            ...prev,
            [talleSeleccionado]: prev[talleSeleccionado] ?? 0,
        }));
    };

    const actualizarStockTalle = (talle: string, nuevoStock: number) => {
        setStockPorTalle((prev) => ({ ...prev, [talle]: nuevoStock }));
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!nombre || !precio) {
            toast.error('Por favor, completa los campos obligatorios (Nombre y Precio).');
            return;
        }

        if (tallesDisponibles.length === 0) {
            toast.error('Debes seleccionar al menos un talle.');
            return;
        }

        const tallesSinStockValido = tallesDisponibles.filter((talle) => {
            const stockTalle = stockPorTalle[talle];
            return !Number.isInteger(stockTalle) || stockTalle < 0;
        });
        if (tallesSinStockValido.length > 0) {
            toast.error(`Asigna stock válido para: ${tallesSinStockValido.join(', ')}`);
            return;
        }

        setGuardando(true);

        try {
            let finalImageUrl = imagenUrlExistente;
            let galeriaFinal = galeriaExistente;

            if (archivosImagenes.length > 0) {
                const urlsNuevas: string[] = [];

                for (const archivo of archivosImagenes) {
                    const compressedFile = await imageCompression(archivo, { maxSizeMB: 1, maxWidthOrHeight: 1200 });
                    const fileName = `${Date.now()}-${crypto.randomUUID()}-${archivo.name.replace(/\s+/g, '-')}`;

                    const { error: uploadError } = await supabase.storage
                        .from('productos')
                        .upload(fileName, compressedFile);

                    if (uploadError) {
                        throw new Error(`Error al subir la imagen "${archivo.name}": ${uploadError.message}`);
                    }

                    const {
                        data: { publicUrl },
                    } = supabase.storage.from('productos').getPublicUrl(fileName);

                    urlsNuevas.push(publicUrl);
                }

                galeriaFinal = urlsNuevas;
                finalImageUrl = urlsNuevas[0] ?? finalImageUrl;
            }

            await guardarProductoConVariantes({
                id,
                nombre,
                codigoCorto: codigoCorto || null,
                descripcion: descripcion || null,
                precio: Number.parseFloat(precio),
                imagenUrl: finalImageUrl || null,
                galeriaImagenes: galeriaFinal.length > 0 ? galeriaFinal : null,
                categoriaId: categoriaId || null,
                tallesDisponibles,
                variantes: tallesDisponibles.map((talle) => ({
                    talle,
                    stock: stockPorTalle[talle] ?? 0,
                })),
            });

            toast.success('Producto actualizado con éxito');
            router.push('/admin');
            router.refresh();
        } catch (error: unknown) {
            const mensajeError = error instanceof Error ? error.message : String(error);
            toast.error(`Error al actualizar el producto: ${mensajeError}`);
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-foreground bg-background">
                <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-violet border-t-transparent motion-reduce:animate-none" />
                <p className="text-sm font-semibold">Cargando datos del producto...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 bg-background text-foreground">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Editar Producto</h1>
                <Link
                    href="/admin"
                    className="min-h-11 cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-violet hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none">
                    Volver
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Campo: Nombre */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="nombre" className="text-sm font-bold">
                            Nombre <span className="text-danger">*</span>
                        </label>
                        <input
                            id="nombre"
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. Medias de Algodón Clásicas"
                            className="w-full rounded-lg border border-border bg-surface p-2.5 text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            required
                        />
                    </div>

                    {/* Campo: Código Corto */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="codigoCorto" className="text-sm font-bold">Código Corto (Redes Sociales)</label>
                        <input
                            id="codigoCorto"
                            type="text"
                            value={codigoCorto}
                            onChange={(e) => setCodigoCorto(e.target.value)}
                            placeholder="Ej. 102, OFERTA-1"
                            className="w-full rounded-lg border border-border bg-surface p-2.5 text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        />
                    </div>

                    {/* Campo: Descripción */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="descripcion" className="text-sm font-bold">Descripción</label>
                        <textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Escribe una breve descripción del producto..."
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border bg-surface p-2.5 text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Campo: Precio */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="precio" className="text-sm font-bold">
                                Precio ($) <span className="text-danger">*</span>
                            </label>
                            <input
                                id="precio"
                                type="number"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                placeholder="Ej. 1500"
                                min="0"
                                step="0.01"
                                className="w-full rounded-lg border border-border bg-surface p-2.5 font-sans tabular-nums text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                required
                            />
                        </div>

                    </div>

                    {/* Campo: Imágenes */}
                    <div className="flex flex-col gap-3">
                        <label htmlFor="imagen" className="text-sm font-semibold">Imagen del Producto</label>
                        {(imagenUrlExistente || galeriaExistente.length > 0) && (
                            <div className="flex flex-wrap gap-3 p-3 border border-border rounded-lg">
                                {(galeriaExistente.length > 0 ? galeriaExistente : [imagenUrlExistente])
                                    .filter(Boolean)
                                    .map((url, index) => (
                                        <div
                                            key={`${url}-${index}`}
                                            className="h-16 w-16 overflow-hidden rounded border border-border bg-muted">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={url}
                                                alt={`Imagen actual ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                            </div>
                        )}
                        <input
                            id="imagen"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setArchivosImagenes(Array.from(e.target.files ?? []))}
                            className="w-full cursor-pointer rounded-lg border border-border bg-surface text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-violet hover:file:text-violet-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                            Opcional. Si seleccionas varias imágenes, la primera será la principal y se guardará la
                            galería completa.
                        </p>
                    </div>

                    {/* Campo: Categoría */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="categoria" className="text-sm font-bold">Categoría</label>
                        <select
                            id="categoria"
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value)}
                            className="w-full cursor-pointer rounded-lg border border-border bg-surface p-2.5 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                            <option value="">Selecciona una categoría...</option>
                            {categoriasDisponibles.map((categoria) => (
                                <option key={categoria.id} value={categoria.id}>
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selección de Talles */}
                    <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
                        <legend className="text-sm font-bold">Talles Disponibles</legend>
                        <div className="flex flex-wrap gap-2">
                            {opcionesTalles.map((talle) => {
                                const isSelected = tallesDisponibles.includes(talle);
                                return (
                                    <button
                                        key={talle}
                                        type="button"
                                        onClick={() => toggleTalle(talle)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                                            isSelected
                                                ? 'border border-transparent bg-primary text-primary-foreground hover:bg-violet hover:text-violet-foreground'
                                                : 'border border-border bg-surface text-foreground hover:border-violet hover:bg-muted'
                                        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none`}>
                                        {talle}
                                    </button>
                                );
                            })}
                        </div>
                        {tallesDisponibles.length > 0 && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {tallesDisponibles.map((talle) => (
                                    <div key={talle} className="flex flex-col gap-1.5">
                                        <label htmlFor={`stock-${talle}`} className="text-sm font-bold">
                                            Stock {talle} <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            id={`stock-${talle}`}
                                            type="number"
                                            value={stockPorTalle[talle] ?? 0}
                                            onChange={(e) => actualizarStockTalle(talle, Number.parseInt(e.target.value || '0', 10))}
                                            min="0"
                                            step="1"
                                            className="w-full rounded-lg border border-border bg-surface p-2.5 font-sans tabular-nums text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </fieldset>
                </div>

                {/* Botón de Enviar */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none sm:w-auto">
                        {guardando ? 'Guardando cambios...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
