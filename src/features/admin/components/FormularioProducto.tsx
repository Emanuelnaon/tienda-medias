'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

export function FormularioProducto() {
    const router = useRouter();
    const supabase = createClient();

    const [nombre, setNombre] = useState('');
    const [codigoCorto, setCodigoCorto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [categoria, setCategoria] = useState('');
    const [archivosImagenes, setArchivosImagenes] = useState<File[]>([]);
    const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
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

    const toggleTalle = (talle: string) => {
        setTallesDisponibles((prev) => (prev.includes(talle) ? prev.filter((t) => t !== talle) : [...prev, talle]));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre || !precio || !stock) {
            toast.error('Por favor, completa los campos obligatorios (Nombre, Precio y Stock).');
            return;
        }

        if (archivosImagenes.length === 0) {
            toast.error('Debes seleccionar al menos una imagen');
            return;
        }

        setSubiendo(true);

        try {
            const urlsPublicas: string[] = [];

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

            const { error } = await supabase.from('productos').insert({
                nombre,
                codigo_corto: codigoCorto || null,
                descripcion: descripcion || null,
                precio: parseFloat(precio),
                stock: parseInt(stock, 10),
                imagen_url: primeraImagen,
                galeria_imagenes: urlsPublicas.length > 0 ? urlsPublicas : null,
                talles_disponibles: tallesDisponibles.length > 0 ? tallesDisponibles : null,
                categoria: categoria || null,
            });

            if (error) {
                throw new Error(error.message);
            }

            toast.success('Producto creado con éxito');
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

                {/* Campo: Código Corto (Instagram / Redes) */}
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

                    {/* Campo: Stock */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold">
                            Stock <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="Ej. 50"
                            min="0"
                            step="1"
                            className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors"
                            required
                        />
                    </div>
                </div>

                {/* Campo: Imagen */}
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
                            {archivosImagenes.length} archivo(s) seleccionado(s). La primera imagen será la principal y
                            la galería se guardará automáticamente.
                        </p>
                    )}
                </div>

                {/* Campo: Categoría */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">Categoría</label>
                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="w-full bg-background text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors">
                        <option value="">Selecciona una categoría...</option>
                        {opcionesCategorias.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selección de Talles */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold">Talles Disponibles</label>
                    <div className="flex flex-wrap gap-2">
                        {opcionesTalles.map((talle) => {
                            const isSelected = tallesDisponibles.includes(talle);
                            return (
                                <button
                                    key={talle}
                                    type="button"
                                    onClick={() => toggleTalle(talle)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                                        ${
                                            isSelected
                                                ? 'bg-foreground text-background hover:opacity-90 border border-transparent'
                                                : 'bg-transparent text-foreground border border-border hover:border-foreground'
                                        }`}>
                                    {talle}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Botón de Enviar */}
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={subiendo}
                    className="w-full sm:w-auto bg-foreground text-background px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                    {subiendo ? 'Subiendo y creando...' : 'Crear Producto'}
                </button>
            </div>
        </form>
    );
}
