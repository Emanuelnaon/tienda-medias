'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { signInWithEmailAndPassword } from '../api/actions';

export function FormularioLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const emailVal = formData.get('email') as string;
        const passwordVal = formData.get('password') as string;

        if (!emailVal || !passwordVal) {
            toast.error('Por favor, completa todos los campos.');
            return;
        }

        startTransition(async () => {
            const result = await signInWithEmailAndPassword(emailVal, passwordVal);
            if (result.success) {
                toast.success('Sesión iniciada con éxito. Redirigiendo...');
                router.push('/admin');
            } else {
                toast.error(result.error || 'Error al iniciar sesión. Verifica tus credenciales.');
            }
        });
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-background rounded-2xl border border-border shadow-sm">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Iniciar Sesión</h2>
                <p className="text-sm text-muted-foreground mt-2">
                    Ingresa tu correo y contraseña para acceder al panel de administración.
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

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isPending}
                        required
                    />
                </div>

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
                            Iniciando sesión...
                        </>
                    ) : (
                        'Iniciar Sesión'
                    )}
                </button>
            </form>
        </div>
    );
}
