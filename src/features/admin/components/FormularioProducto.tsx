'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import {
    guardarProductoConVariantes,
    type DatosProductoConVariantes,
} from '@/src/features/admin/actions/productosActions';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export function FormularioProducto() {
    const router = useRouter();
    const supabase = createClient();

    const [nombre, setNombre] = useState('');
    const [codigoCorto, setCodigoCorto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [categoria, setCategoria] = useState('');
    const [archivosImagenes, setArchivosImagenes] = useState<File[]>([]);
    const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
    const [stockPorTalle, setStockPorTalle] = useState<Record<string, number>>({});
    const [subiendo, setSubiendo] = useState(false);

    const opcionesTalles = ['S', 'M', 'L', 'XL', 'Único'];
    const opcionesCategorias = [
        'Medias Invisibles',
        'Soketes',
        'Medias Cortas',
        'Medias ¾',
        'Bucaneras',
        'Deportivas',
        'Otras',
    ];

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
                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${archivo.name.replace(/\s+/g, '-')}`;

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
                precio: parseFloat(precio),
                imagenUrl: primeraImagen,
                galeriaImagenes: urlsPublicas.length > 0 ? urlsPublicas : null,
                categoria: categoria || null,
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
                    <label className="text-sm font-bold">
                        Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Medias de Algodón Clásicas"
                        className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors"
                        required
                    />
                </div>

                {/* Campo: Código Corto */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">Código Corto (Redes Sociales)</label>
                    <input
                        type="text"
                        value={codigoCorto}
                        onChange={(e) => setCodigoCorto(e.target.value)}
                        placeholder="Ej. 102, OFERTA-1"
                        className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors"
                    />
                </div>

                {/* Campo: Descripción */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">Descripción</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Escribe una breve descripción del producto..."
                        rows={3}
                        className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Campo: Precio */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold">
                            Precio ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={precio}
                            onChange={(e) => setPrecio(e.target.value)}
                            placeholder="Ej. 1500"
                            min="0"
                            step="0.01"
                            className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors"
                            required
                        />
                    </div>
                </div>

                {/* Campo: Imágenes */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-foreground">Imágenes del Producto</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setArchivosImagenes(Array.from(e.target.files ?? []))}
                        className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-foreground file:text-background hover:file:opacity-90 cursor-pointer"
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
                    <label className="text-sm font-bold">Categoría</label>
                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="w-full bg-background text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors cursor-pointer">
                        <option value="">Selecciona una categoría...</option>
                        {opcionesCategorias.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selección de Talles */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold">
                        Talles Disponibles <span className="text-red-500">*</span>
                    </label>
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
                                            ? 'bg-foreground text-background hover:opacity-90 border border-transparent'
                                            : 'bg-transparent text-foreground border border-border hover:border-foreground'
                                    }`}>
                                    {talle}
                                </button>
                            );
                        })}
                    </div>

                    {/* Stock por Talle */}
                    {tallesDisponibles.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg border border-border bg-background/50">
                            <p className="text-sm font-semibold mb-3 text-foreground">Stock por Talle</p>
                            <div
                                className={`grid gap-3 ${tallesDisponibles.includes('Único') ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                                {tallesDisponibles.map((talle) => (
                                    <div key={talle} className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-foreground">
                                            Talle <span className="font-bold">{talle}</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={stockPorTalle[talle] ?? 0}
                                            onChange={(e) =>
                                                actualizarStockTalle(talle, parseInt(e.target.value, 10) || 0)
                                            }
                                            placeholder="0"
                                            min="0"
                                            step="1"
                                            className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Botón de Enviar */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={subiendo}
                    className="w-full sm:w-auto bg-foreground text-background px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
                    {subiendo ? 'Subiendo y creando...' : 'Crear Producto'}
                </button>
            </div>
        </form>
    );
}
