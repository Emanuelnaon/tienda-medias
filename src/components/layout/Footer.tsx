'use client';

import React from 'react';
import Link from 'next/link';
import { WHATSAPP_SUPPORT_NUMBER } from '@/src/lib/constants';

export function Footer() {
    return (
        <footer className="w-full bg-background border-t border-border mt-auto py-12 px-6 md:px-12 text-foreground">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Columna 1: Marca */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                        Socks Store
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Las mejores medias y calcetines para tu comodidad y estilo diario. Diseños únicos y máxima
                        suavidad en cada par.
                    </p>
                </div>

                {/* Columna 2: Links */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Navegación</h3>
                    <ul className="flex flex-col gap-2.5 text-sm font-medium">
                        <li>
                            <Link href="/" className="hover:text-blue-600 transition-colors">
                                Inicio
                            </Link>
                        </li>
                        <li>
                            <Link href="/?orden=recientes" className="hover:text-blue-600 transition-colors">
                                Catálogo Completo
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Columna 3: Redes */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Contacto y Redes
                    </h3>
                    <ul className="flex flex-col gap-2.5 text-sm font-medium">
                        <li>
                            <a
                                href={`https://wa.me/${WHATSAPP_SUPPORT_NUMBER}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-green-500 transition-colors">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                                </svg>
                                WhatsApp
                            </a>
                        </li>
                        <li>
                            <a
                                href="https://www.instagram.com/hermanas.calcetines/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-pink-500 transition-colors">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                                Instagram
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Socks Store. Todos los derechos reservados. Enfocado en CRO.</p>
            </div>
        </footer>
    );
}
