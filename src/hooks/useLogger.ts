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
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
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
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
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
        metadata: any = {},
        duration?: number
    ) => {
        const payload: LogActivityPayload = {
            session_id: getAppSessionId(),
            page_session_id: getPageSessionId(),
            action,
            target_type: targetType,
            target_id: targetId,
            path: pathnameRef.current || window.location.pathname,
            metadata,
            ...(duration !== undefined && { duration }),
        };

        // Optional: Include duration or other metrics if passed in metadata or handled here
        await logActivity(payload);
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
                path: window.location.pathname, // use window location to get current path at unmount
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
