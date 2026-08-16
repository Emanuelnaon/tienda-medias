'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function BuscadorRedes() {
    const [codigo, setCodigo] = useState('');
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = codigo.trim();
        if (!trimmed) return;

        router.push(`/buscar?codigo=${encodeURIComponent(trimmed)}`);
        setCodigo('');
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="¿Lo viste en redes? Código..."
                    className="w-full bg-muted text-foreground placeholder:text-muted-foreground border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground focus:border-foreground transition-all duration-200"
                />
                <button
                    type="submit"
                    className="absolute right-1 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Buscar código"
                >
                    <Search className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
}
