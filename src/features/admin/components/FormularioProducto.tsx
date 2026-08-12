'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import type { Database } from '@/src/types/supabase';
import toast from 'react-hot-toast';

export function FormularioProducto() {
    const router = useRouter();
    const supabase = createClient();

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');
    const [tallesDisponibles, setTallesDisponibles] = useState<string[]>([]);
    const [cargando, setCargando] = useState(false);

    const opcionesTalles = ['S', 'M', 'L', 'XL', 'Único'];

    const toggleTalle = (talle: string) => {
        setTallesDisponibles((prev) =>
            prev.includes(talle)
                ? prev.filter((t) => t !== talle)
                : [...prev, talle]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre || !precio || !stock) {
            toast.error('Por favor, completa los campos obligatorios (Nombre, Precio y Stock).');
            return;
        }

        setCargando(true);

        try {
            const { error } = await supabase.from('productos').insert({
                nombre,
                descripcion: descripcion || null,
                precio: parseFloat(precio),
                stock: parseInt(stock, 10),
                imagen_url: imagenUrl || null,
                talles_disponibles: tallesDisponibles.length > 0 ? tallesDisponibles : null,
            });

            if (error) {
                throw new Error(error.message);
            }

            toast.success('Producto creado con éxito');
            router.push('/auth/admin');
            router.refresh();
        } catch (error: unknown) {
            const mensajeError = error instanceof Error ? error.message : String(error);
            toast.error(`Error al crear el producto: ${mensajeError}`);
        } finally {
            setCargando(false);
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

                {/* Campo: Imagen URL */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold">URL de la Imagen</label>
                    <input
                        type="url"
                        value={imagenUrl}
                        onChange={(e) => setImagenUrl(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="w-full bg-transparent text-foreground border border-border rounded-lg p-2.5 focus:outline-none focus:border-foreground transition-colors"
                    />
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
                                        ${isSelected
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
                    disabled={cargando}
                    className="w-full sm:w-auto bg-foreground text-background px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                    {cargando ? 'Creando Producto...' : 'Crear Producto'}
                </button>
            </div>
        </form>
    );
}
