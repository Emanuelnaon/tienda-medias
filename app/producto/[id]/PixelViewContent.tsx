'use client';

import { useEffect } from 'react';
import { trackPixel } from '@/src/features/tracking-pixel';

interface PixelViewContentProps {
    contentName: string;
    contentIds: string[];
    value: number;
    currency: string;
}

export function PixelViewContent({ contentName, contentIds, value, currency }: PixelViewContentProps) {
    useEffect(() => {
        trackPixel('ViewContent', {
            content_name: contentName,
            content_ids: contentIds,
            value,
            currency,
        });
    }, [contentName, contentIds, value, currency]);

    return null;
}