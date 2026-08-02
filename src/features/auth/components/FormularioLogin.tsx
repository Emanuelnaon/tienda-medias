'use client';

import React, { useState, useTransition } from 'react';
import { signInWithMagicLink } from '../api/actions';

export function FormularioLogin() {
    const [email, setEmail] = useState('');
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        if (!email) {
            setMessage({ type: 'error', text: 'Por favor, ingresa tu correo electrónico.' });
            return;
        }

        startTransition(async () => {
            const result = await signInWithMagicLink(email);
            if (result.success) {
                setMessage({
                    type: 'success',
                    text: '¡Enlace enviado! Revisa tu bandeja de entrada para iniciar sesión.',
                });
                setEmail('');
            } else {
                setMessage({
                    type: 'error',
                    text: result.error || 'Ocurrió un error inesperado. Inténtalo de nuevo.',
                });
            }
        });
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-background rounded-2xl border border-border shadow-sm">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Iniciar Sesión</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Te enviaremos un enlace mágico (Magic Link) a tu correo para que accedas al instante.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                        Correo Electrónico
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@ejemplo.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isPending}
                        required
                    />
                </div>

                {message && (
                    <div
                        className={`p-3 text-sm rounded-lg ${
                            message.type === 'success'
                                ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200 dark:border-green-900/50'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Enviando...
                        </>
                    ) : (
                        'Enviar enlace mágico'
                    )}
                </button>
            </form>
        </div>
    );
}
