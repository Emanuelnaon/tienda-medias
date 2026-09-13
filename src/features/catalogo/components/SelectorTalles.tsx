'use client';

import React from 'react';

export type Variante = Readonly<{
    id: string;
    talle: string;
    stock: number;
}>;

interface SelectorTallesProps {
    readonly variantes: ReadonlyArray<Variante>;
    readonly talleSeleccionado: string | null;
    readonly onSeleccionarTalle: (talle: string) => void;
}

export function SelectorTalles({ variantes, talleSeleccionado, onSeleccionarTalle }: Readonly<SelectorTallesProps>) {
    if (!variantes || variantes.length === 0) return null;

    const esTalleUnico = variantes.length === 1 && variantes[0].talle.toLowerCase() === 'único';

    if (esTalleUnico) {
        const variante = variantes[0];
        const sinStock = variante.stock <= 0;

        return (
            <div className="my-4">
                <span className="text-sm font-medium text-gray-700">Talle:</span>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                    Único {sinStock && <span className="text-red-500 font-normal">(Agotado)</span>}
                </p>
            </div>
        );
    }

    return (
        <div className="my-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-900">
                    Seleccionar Talle: <span className="font-semibold">{talleSeleccionado || 'Elija una opción'}</span>
                </label>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" role="radiogroup">
                {variantes.map((v) => {
                    const sinStock = v.stock <= 0;
                    const estaSeleccionado = talleSeleccionado === v.talle;

                    // 1. Definimos la base de estilos comunes
                    const baseEstilos =
                        'relative flex items-center justify-center rounded-md border py-3 text-sm font-semibold uppercase transition-all';

                    // 2. Extraemos el ternario anidado en bloques condicionales limpios
                    let estilosEstado = '';
                    if (sinStock) {
                        estilosEstado = 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-60';
                    } else if (estaSeleccionado) {
                        estilosEstado = 'border-black bg-black text-white shadow-sm';
                    } else {
                        estilosEstado = 'border-gray-300 bg-white text-gray-900 hover:border-gray-400';
                    }

                    return (
                        <button
                            key={v.id}
                            type="button"
                            disabled={sinStock}
                            onClick={() => onSeleccionarTalle(v.talle)}
                            className={`${baseEstilos} ${estilosEstado}`}>
                            <span>{v.talle}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default SelectorTalles;
