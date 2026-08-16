'use client';

import React from 'react';
import Link from 'next/link';

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
                        Las mejores medias y calcetines para tu comodidad y estilo diario. Diseños únicos y máxima suavidad en cada par.
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
                                href="https://wa.me/5491100000000"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-green-500 transition-colors">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.988 3.311 1.493 5.351 1.494 5.509 0 9.99-4.478 9.993-9.986.002-2.668-1.03-5.176-2.905-7.054C17.21 1.73 14.712.686 12.013.686c-5.513 0-10.002 4.479-10.005 9.985-.001 2.14.57 4.225 1.651 6.013l-.993 3.63 3.733-.978zm13.111-7.14c-.29-.145-1.716-.847-1.982-.943-.265-.097-.459-.145-.653.146-.193.29-.749.943-.918 1.137-.169.193-.338.217-.628.072-2.935-1.464-4.225-2.253-5.836-5.01-.19-.324.19-.301.543-.997.13-.26.065-.487-.033-.68-.096-.194-.748-1.8-.1.033-2.613-.265-.1-.459-.26-.459-.396 0-.12 0-.253.058-.338.096-.145.193-.193-.29-.387-.145-.194-.291-.387-.58-.1-.29-.096-.484-.145-.677-.049-.193.097-.338.29-.53.58-.194.291-.387.387-.677.242s-1.716-.847-1.982-.942c-.265-.096-.459-.144-.653.146-.193.29-.749.942-.918 1.136-.169.193-.338.217-.628.072z" />
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
