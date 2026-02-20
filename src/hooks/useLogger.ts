import { useEffect, useCallback, useRef } from 'react';
import { logActivity, LogActivityPayload } from '@/services/apiServices';
import { usePathname } from 'next/navigation';

export const useLogger = () => {
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    const pageSessionIdRef = useRef<string | null>(null);

    // Generic UUID generator fallback
    const uuidv4 = () => {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }

    // Initialize or retrieve Application Session ID (persists across tabs/reloads until cleared manually or expires logic if added)
    const getAppSessionId = () => {
        if (typeof window === 'undefined') return '';
        let sid = localStorage.getItem('app_session_id');
        if (!sid) {
            // Check if crypto.randomUUID is supported, else use fallback
            if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                sid = crypto.randomUUID();
            } else {
                 // Simple fallback if crypto.randomUUID is missing (e.g. older browsers / insecure context)
                sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
            localStorage.setItem('app_session_id', sid);
        }
        return sid;
    };

    // Initialize Page Session ID (unique per component mount / logic flow)
    const getPageSessionId = () => {
        if (!pageSessionIdRef.current) {
             if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
                pageSessionIdRef.current = crypto.randomUUID();
            } else {
                pageSessionIdRef.current = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        }
        return pageSessionIdRef.current;
    };

    const log = useCallback(async (
        action: string,
        targetType: string = 'page',
        targetId: string = '',
        metadata: any = {}
    ) => {
        const payload: LogActivityPayload = {
            session_id: getAppSessionId(),
            page_session_id: getPageSessionId(),
            action,
            target_type: targetType,
            target_id: targetId,
            path: pathnameRef.current || window.location.pathname,
            metadata
        };

        // Optional: Include duration or other metrics if passed in metadata or handled here
        await logActivity(payload);
    }, []);

    const trackTimeSpent = useCallback((
        targetType: string,
        targetId: string,
        metadata: any = {},
        action: string = 'time_spent'
    ) => {
        const startTime = Date.now();

        // Return a cleanup function for useEffect
        return () => {
            const endTime = Date.now();
            const durationInSeconds = Math.round((endTime - startTime) / 1000 * 10) / 10;

            // Skip if duration < 1s (React StrictMode double-mount in dev)
            if (durationInSeconds < 1) return;

            const payload: LogActivityPayload = {
                session_id: getAppSessionId(),
                page_session_id: getPageSessionId(),
                action,
                target_type: targetType,
                target_id: targetId,
                path: window.location.pathname,
                duration: durationInSeconds,
                metadata
            };

            logActivity(payload);
        };
    }, []);

    // Cleanup or auto-log view logic could go here if this hook is intended to auto-log page views
    // For now, it exposes 'log' function for manual instrumentation.

    return { log, trackTimeSpent };
};
