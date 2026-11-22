'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import {
    guardarProductoConVariantes,
    type DatosProductoConVariantes,
} from '@/src/features/admin/actions/productosActions';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import type { Database } from '@/src/types/supabase';

type CategoriaResumen = Pick<
    Database['public']['Tables']['categorias']['Row'],
    'id' | 'nombre' | 'slug'
>;

export function FormularioProducto() {
    const router = useRouter();
    const [supabase] = useState(createClient);

    const [nombre, setNombre] = useState('');
    const [codigoCorto, setCodigoCorto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaResumen[]>([]);
    const [archivosImagenes, setArchivosImagenes] = useState<File[]>([]);
    const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
    const [stockPorTalle, setStockPorTalle] = useState<Record<string, number>>({});
    const [subiendo, setSubiendo] = useState(false);

    const opcionesTalles = ['S', 'M', 'L', 'XL', 'Único'];
    useEffect(() => {
        const cargarCategorias = async () => {
            const { data, error } = await supabase
                .from('categorias')
                .select('id, nombre, slug')
                .order('nombre');

            if (error) {
                toast.error('No se pudieron cargar las categorías.');
                return;
            }
            setCategoriasDisponibles((data ?? []) as CategoriaResumen[]);
        };

        void cargarCategorias();
    }, [supabase]);

    // Lógica exclusiva: "Único" no puede coexistir con talles numéricos/letras
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

        // Inicializar stock para este talle si no existe
        if (!stockPorTalle[talleSeleccionado]) {
            setStockPorTalle((prev) => ({
                ...prev,
                [talleSeleccionado]: 0,
            }));
        }
    };

    // Actualizar stock para un talle específico
    const actualizarStockTalle = (talle: string, nuevoStock: number) => {
        setStockPorTalle((prev) => ({
            ...prev,
            [talle]: nuevoStock,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre || !precio) {
            toast.error('Por favor, completa los campos obligatorios (Nombre y Precio).');
            return;
        }

        if (tallesDisponibles.length === 0) {
            toast.error('Debes seleccionar al menos un talle.');
            return;
        }

        // Validar que todos los talles tengan stock asignado
        const tallesSinStock = tallesDisponibles.filter((talle) => {
            const stock = stockPorTalle[talle];
            return stock === undefined || stock === null || stock < 0;
        });

        if (tallesSinStock.length > 0) {
            toast.error(`Asigna stock válido para: ${tallesSinStock.join(', ')}`);
            return;
        }

        if (archivosImagenes.length === 0) {
            toast.error('Debes seleccionar al menos una imagen');
            return;
        }

        setSubiendo(true);

        try {
            const urlsPublicas: string[] = [];

            // Subir imágenes
            for (const archivo of archivosImagenes) {
                const archivoComprimido = await imageCompression(archivo, { maxSizeMB: 1, maxWidthOrHeight: 1200 });
                const fileName = `${Date.now()}-${crypto.randomUUID()}-${archivo.name.replace(/\s+/g, '-')}`;

                const { error: uploadError } = await supabase.storage
                    .from('productos')
                    .upload(fileName, archivoComprimido);

                if (uploadError) {
                    throw new Error(`Error al subir la imagen "${archivo.name}": ${uploadError.message}`);
                }

                const {
                    data: { publicUrl },
                } = supabase.storage.from('productos').getPublicUrl(fileName);

                urlsPublicas.push(publicUrl);
            }

            const primeraImagen = urlsPublicas[0] ?? null;

            // Construir array de variantes
            const variantes = tallesDisponibles.map((talle) => ({
                talle,
                stock: stockPorTalle[talle] || 0,
            }));

            // Preparar datos del producto
            const datosProducto: DatosProductoConVariantes = {
                nombre,
                codigoCorto: codigoCorto || null,
                descripcion: descripcion || null,
                precio: Number.parseFloat(precio),
                imagenUrl: primeraImagen,
                galeriaImagenes: urlsPublicas.length > 0 ? urlsPublicas : null,
                categoriaId: categoriaId || null,
                tallesDisponibles,
                variantes,
            };

            // Llamar a la Server Action
            const resultado = await guardarProductoConVariantes(datosProducto);

            toast.success(resultado.mensaje);
            router.push('/admin');
            router.refresh();
        } catch (error: unknown) {
            const mensajeError = error instanceof Error ? error.message : String(error);
            toast.error(`Error al crear el producto: ${mensajeError}`);
        } finally {
            setSubiendo(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-background text-foreground">
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
                <div className="flex flex-col gap-2">
                    <label htmlFor="imagen" className="text-sm font-semibold text-foreground">Imágenes del Producto</label>
                    <input
                        id="imagen"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setArchivosImagenes(Array.from(e.target.files ?? []))}
                        className="w-full cursor-pointer rounded-lg border border-border bg-surface text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-violet hover:file:text-violet-foreground"
                        required
                    />
                    {archivosImagenes.length > 0 && (
                        <p className="text-xs text-foreground/70">
                            {archivosImagenes.length} archivo(s) seleccionado(s). La primera imagen será la principal.
                        </p>
                    )}
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
                <fieldset className="border-0 p-0 m-0 flex flex-col gap-3">
                    <legend className="text-sm font-bold">
                        Talles Disponibles <span className="text-danger">*</span>
                    </legend>
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

                    {/* Stock por Talle */}
                    {tallesDisponibles.length > 0 && (
                        <div className="mt-4 rounded-lg border border-border bg-muted p-4">
                            <p className="text-sm font-semibold mb-3 text-foreground">Stock por Talle</p>
                            <div
                                className={`grid gap-3 ${tallesDisponibles.includes('Único') ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                                {tallesDisponibles.map((talle) => (
                                    <div key={talle} className="flex flex-col gap-1.5">
                                        <label htmlFor={`stock-${talle}`} className="text-xs font-semibold text-foreground">
                                            Talle <span className="font-bold">{talle}</span>
                                        </label>
                                        <input
                                            id={`stock-${talle}`}
                                            type="number"
                                            value={stockPorTalle[talle] ?? 0}
                                            onChange={(e) =>
                                                actualizarStockTalle(talle, Number.parseInt(e.target.value, 10) || 0)
                                            }
                                            placeholder="0"
                                            min="0"
                                            step="1"
                                            className="w-full rounded-lg border border-border bg-surface p-2.5 font-sans tabular-nums text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </fieldset>
            </div>

            {/* Botón de Enviar */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={subiendo}
                    className="w-full cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-violet hover:text-violet-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none sm:w-auto">
                    {subiendo ? 'Subiendo y creando...' : 'Crear Producto'}
                </button>
            </div>
        </form>
    );
}
