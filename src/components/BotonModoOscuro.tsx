'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function BotonModoOscuro() {
    const { theme, setTheme, systemTheme } = useTheme();
    const [montado, setMontado] = useState(false);

    // Asegura que el componente solo se renderice en el cliente para evitar errores de hidratación
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMontado(true);
    }, []);

    if (!montado) {
        // Un cuadrado invisible del mismo tamaño para que la interfaz no salte al cargar
        return <div className="w-10 h-10"></div>;
    }

    // Determina cuál es el tema actual real (si está en 'system', lee la preferencia del sistema)
    const temaActual = theme === 'system' ? systemTheme : theme;

    return (
        <button
            onClick={() => setTheme(temaActual === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Alternar modo oscuro"
            title="Cambiar tema">
            {temaActual === 'dark' ? (
                // Icono de Sol (Modo Claro)
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            ) : (
                // Icono de Luna (Modo Oscuro)
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            )}
        </button>
    );
}
