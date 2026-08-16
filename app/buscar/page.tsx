'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import toast from 'react-hot-toast';
import Link from 'next/link';

function BuscarCodigoResolver() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const codigo = searchParams.get('codigo');
    const [cargando, setCargando] = useState(true);
    const [noEncontrado, setNoEncontrado] = useState(false);

    useEffect(() => {
        const resolverCodigo = async () => {
            if (!codigo) {
                // Hacemos el cambio de estado dentro de la tarea asíncrona para evitar
                // la advertencia de eslint de llamadas síncronas en el cuerpo del efecto
                await Promise.resolve();
                setCargando(false);
                setNoEncontrado(true);
                return;
            }

            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('productos')
                    .select('id')
                    .eq('codigo_corto', codigo)
                    .single();

                if (error || !data) {
                    throw new Error('Código no encontrado');
                }

                // Redirección inmediata al detalle del producto
                router.replace(`/producto/${data.id}`);
            } catch (err) {
                console.error(err);
                toast.error('Código no encontrado');
                setNoEncontrado(true);
                setCargando(false);
            }
        };

        resolverCodigo();
    }, [codigo, router]);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background text-foreground px-4 text-center">
                <div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-4" />
                <h1 className="text-xl font-bold">Buscando producto...</h1>
                <p className="text-muted-foreground mt-2">Estamos localizando el código corto &ldquo;{codigo}&rdquo;</p>
            </div>
        );
    }

    if (noEncontrado) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background text-foreground px-4 text-center">
                <span className="text-6xl mb-6">🔍</span>
                <h1 className="text-3xl font-bold mb-4">Código no encontrado 😢</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                    No pudimos encontrar ningún producto asociado al código &ldquo;{codigo || ''}&rdquo;. Asegúrate de escribirlo correctamente.
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-foreground text-background font-semibold rounded-lg hover:opacity-90 transition-all shadow-md"
                >
                    Volver al Catálogo
                </Link>
            </div>
        );
    }

    return null;
}

export default function BuscarPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background text-foreground px-4 text-center">
                <div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full animate-spin mb-4" />
                <h1 className="text-xl font-bold">Cargando buscador...</h1>
            </div>
        }>
            <BuscarCodigoResolver />
        </Suspense>
    );
}
