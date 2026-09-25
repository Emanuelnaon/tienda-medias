import React from 'react';
import { cn } from '@/src/lib/utils/cn';
import type { TipoEtiqueta } from '../utils/calcularEtiquetasInventario';

interface EtiquetaInventarioProps {
    readonly tipo: TipoEtiqueta;
    readonly className?: string;
}

export function EtiquetaInventario({ tipo, className }: EtiquetaInventarioProps) {
    const baseStyles = "px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm rounded-full w-fit h-fit";

    let tipoStyles = "";
    let texto = "";

    switch (tipo) {
        case 'agotado':
            tipoStyles = "bg-red-600 text-white";
            texto = "Agotado";
            break;
        case 'ultimas_unidades':
            tipoStyles = "bg-orange-600 text-white animate-pulse";
            texto = "¡Últimas unidades!";
            break;
        case 'nuevo':
            tipoStyles = "bg-green-600 text-white";
            texto = "Nuevo";
            break;
    }

    return (
        <span className={cn(baseStyles, tipoStyles, className)}>
            {texto}
        </span>
    );
}
