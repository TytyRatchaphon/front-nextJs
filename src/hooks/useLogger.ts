import { useEffect, useCallback, useRef } from 'react';
import { logActivity, LogActivityPayload } from '@/services/apiServices';
import { usePathname } from 'next/navigation';

const generateSessionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const safeGetPathname = (fallback: string | null) => {
    if (fallback) return fallback;

    try {
        return typeof window !== 'undefined' ? window.location.pathname : '';
    } catch {
        return '';
    }
};

export const useLogger = () => {
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    const pageSessionIdRef = useRef<string | null>(null);

    // Initialize or retrieve Application Session ID (persists across tabs/reloads until cleared manually or expires logic if added)
    const getAppSessionId = () => {
        if (typeof window === 'undefined') return '';

        try {
            let sid = window.localStorage.getItem('app_session_id');
            if (!sid) {
                sid = generateSessionId();
                window.localStorage.setItem('app_session_id', sid);
            }
            return sid;
        } catch {
            return generateSessionId();
        }
    };

    // Initialize Page Session ID (unique per component mount / logic flow)
    const getPageSessionId = () => {
        if (!pageSessionIdRef.current) {
            pageSessionIdRef.current = generateSessionId();
        }
        return pageSessionIdRef.current;
    };

    const log = useCallback(async (
        action: string,
        targetType: string = 'page',
        targetId: string = '',
        metadata: any = {},
        duration?: number
    ) => {
        const payload: LogActivityPayload = {
            session_id: getAppSessionId(),
            page_session_id: getPageSessionId(),
            action,
            target_type: targetType,
            target_id: targetId,
            path: safeGetPathname(pathnameRef.current),
            metadata,
            ...(duration !== undefined && { duration }),
        };

        try {
            await logActivity(payload);
        } catch {
            // Logging is non-critical and must never break page rendering.
        }
    }, []);

    const trackTimeSpent = useCallback((
        targetType: string,
        targetId: string,
        metadata: any = {}
    ) => {
        const startTime = Date.now();

        // Return a cleanup function for useEffect
        return () => {
            const endTime = Date.now();
            const durationInSeconds = (endTime - startTime) / 1000;

            // Log time_spent
            // Note: On tab close, this async call might not complete. 
            // For critical analytics, navigator.sendBeacon is preferred but requires a specific endpoint setup.
            // For SPA navigation, this works fine.
            const payload: LogActivityPayload = {
                session_id: getAppSessionId(),
                page_session_id: getPageSessionId(),
                action: 'time_spent',
                target_type: targetType,
                target_id: targetId,
                path: safeGetPathname(null),
                duration: durationInSeconds,
                metadata
            };
            
            void logActivity(payload).catch(() => {
                // Logging is best-effort during route changes/unmounts.
            });
        };
    }, []);

    // Cleanup or auto-log view logic could go here if this hook is intended to auto-log page views
    // For now, it exposes 'log' function for manual instrumentation.

    return { log, trackTimeSpent };
};
