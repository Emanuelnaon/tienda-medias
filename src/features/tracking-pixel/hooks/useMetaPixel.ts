'use client';

import { useEffect } from 'react';
import { initPixel, trackPixel } from '@/src/features/tracking-pixel/lib/metaPixel';

export function useMetaPixel(pixelId: string): { trackEvent: (event: string, data?: Record<string, unknown>) => void } {
    useEffect(() => {
        if (!pixelId) {
            return;
        }

        initPixel(pixelId);
    }, [pixelId]);

    const trackEvent = (event: string, data?: Record<string, unknown>): void => {
        trackPixel(event, data);
    };

    return { trackEvent };
}