'use client';

import { useMetaPixel } from '@/src/features/tracking-pixel/hooks/useMetaPixel';

interface MetaPixelInitProps {
    pixelId: string;
}

export function MetaPixelInit({ pixelId }: MetaPixelInitProps) {
    useMetaPixel(pixelId);
    return null;
}