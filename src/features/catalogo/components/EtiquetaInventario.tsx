import React from 'react';
import { cn } from '@/src/lib/utils/cn';
import type { TipoEtiqueta } from '../utils/calcularEtiquetasInventario';

interface EtiquetaInventarioProps {
    readonly tipo: TipoEtiqueta;
    readonly className?: string;
}

export function EtiquetaInventario({ tipo, className }: EtiquetaInventarioProps) {
    const baseStyles = "w-fit h-fit rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide";

    let tipoStyles = "";
    let texto = "";

    switch (tipo) {
        case 'agotado':
            tipoStyles = "bg-muted text-muted-foreground";
            texto = "Agotado";
            break;
        case 'ultimas_unidades':
            tipoStyles = "bg-warning text-warning-foreground";
            texto = "¡Últimas unidades!";
            break;
        case 'nuevo':
            tipoStyles = "bg-emerald-soft text-emerald-soft-foreground";
            texto = "Nuevo";
            break;
    }

    return (
        <span className={cn(baseStyles, tipoStyles, className)}>
            {texto}
        </span>
    );
}
