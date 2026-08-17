'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import type { Database } from '@/src/types/supabase';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import Link from 'next/link';

type Producto = Database['public']['Tables']['productos']['Row'];

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditarProductoPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const supabase = createClient();

    const [nombre, setNombre] = useState('');
    const [codigoCorto, setCodigoCorto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [categoria, setCategoria] = useState('');
    const [archivosImagenes, setArchivosImagenes] = useState<File[]>([]);
    const [imagenUrlExistente, setImagenUrlExistente] = useState('');
    const [galeriaExistente, setGaleriaExistente] = useState<string[]>([]);
    const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

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

    useEffect(() => {
        const cargarProducto = async () => {
            try {
                const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();

                if (error || !data) {
                    throw new Error('No se pudo cargar el producto');
                }

                const prod = data as Producto;
                setNombre(prod.nombre);
                setCodigoCorto(prod.codigo_corto || '');
                setDescripcion(prod.descripcion || '');
                setPrecio(String(prod.precio));
                setStock(String(prod.stock));
                setCategoria(prod.categoria || '');
                setImagenUrlExistente(prod.imagen_url || '');
                setGaleriaExistente(Array.isArray(prod.galeria_imagenes) ? prod.galeria_imagenes.filter(Boolean) : []);

                // Sanitización al cargar: Si el producto tiene 'Único' junto a otros talles, forzamos 'Único'
                const rawTalles = prod.talles_disponibles || [];
                if (rawTalles.includes('Único') && rawTalles.length > 1) {
                    setTallesDisponibles(['Único']);
                } else {
                    setTallesDisponibles(rawTalles);
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre || !precio || !stock) {
            toast.error('Por favor, completa los campos obligatorios (Nombre, Precio y Stock).');
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
                    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${archivo.name.replace(/\s+/g, '-')}`;

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

            const { error } = await supabase
                .from('productos')
                .update({
                    nombre,
                    codigo_corto: codigoCorto || null,
                    descripcion: descripcion || null,
                    precio: parseFloat(precio),
                    stock: parseInt(stock, 10),
                    imagen_url: finalImageUrl,
                    galeria_imagenes: galeriaFinal.length > 0 ? galeriaFinal : null,
                    talles_disponibles: tallesDisponibles.length > 0 ? tallesDisponibles : null,
                    categoria: categoria || null,
                })
                .eq('id', id);

            if (error) {
                throw new Error(error.message);
            }

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
                <div className="w-10 h-10 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-4" />
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
                    className="text-sm font-medium border border-border hover:border-foreground px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                    Volver
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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

                    {/* Campo: Imágenes */}
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold">Imagen del Producto</label>
                        {(imagenUrlExistente || galeriaExistente.length > 0) && (
                            <div className="flex flex-wrap gap-3 p-3 border border-border rounded-lg">
                                {(galeriaExistente.length > 0 ? galeriaExistente : [imagenUrlExistente])
                                    .filter(Boolean)
                                    .map((url, index) => (
                                        <div
                                            key={`${url}-${index}`}
                                            className="w-16 h-16 overflow-hidden rounded border border-border bg-zinc-100 dark:bg-zinc-900"
                                        >
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
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setArchivosImagenes(Array.from(e.target.files ?? []))}
                            className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-foreground file:text-background hover:file:opacity-90 cursor-pointer"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Opcional. Si seleccionas varias imágenes, la primera será la principal y se guardará la
                            galería completa.
                        </p>
                    </div>

                    {/* Campo: Categoría */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold">Categoría</label>
                        <select
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full bg-background text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors cursor-pointer"
                        >
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
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                                            isSelected
                                                ? 'bg-foreground text-background hover:opacity-90 border border-transparent'
                                                : 'bg-transparent text-foreground border border-border hover:border-foreground'
                                        }`}
                                    >
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
                        disabled={guardando}
                        className="w-full sm:w-auto bg-foreground text-background px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                    >
                        {guardando ? 'Guardando cambios...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}