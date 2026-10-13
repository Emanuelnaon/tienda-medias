export function initPixel(pixelId: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (window.fbq?.loaded) {
        return;
    }

    const fbq = function (method: string, ...args: unknown[]): void {
        if (fbq.callMethod) {
            fbq.callMethod(method, ...args);
        } else {
            fbq.queue.push([method, ...args]);
        }
    } as {
        (method: string, ...args: unknown[]): void;
        callMethod?: (method: string, ...args: unknown[]) => void;
        queue: unknown[][];
        push: (method: string, ...args: unknown[]) => void;
        loaded: boolean;
        version: string;
        init: (pixelId: string) => void;
        track: (event: string, data?: Record<string, unknown>) => void;
    };

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.push = fbq;
    fbq.init = (id: string) => fbq('init', id);
    fbq.track = (event: string, data?: Record<string, unknown>) => fbq('track', event, data);

    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://connect.facebook.net/en_US/fbevents.js`;
    document.head.appendChild(script);

    fbq('init', pixelId);
    fbq('track', 'PageView');
}

export function trackPixel(event: string, data?: Record<string, unknown>): void {
    if (typeof window === 'undefined') {
        return;
    }

    if (!window.fbq?.loaded) {
        return;
    }

    window.fbq('track', event, data);
}

declare global {
    interface Window {
        fbq: {
            (method: string, ...args: unknown[]): void;
            callMethod?: (method: string, ...args: unknown[]) => void;
            queue: unknown[][];
            push: (method: string, ...args: unknown[]) => void;
            loaded: boolean;
            version: string;
            init: (pixelId: string) => void;
            track: (event: string, data?: Record<string, unknown>) => void;
        };
        _fbq: typeof window.fbq;
    }
}