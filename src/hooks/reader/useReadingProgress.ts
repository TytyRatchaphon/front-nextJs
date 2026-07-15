import { useState, useEffect, useMemo, useRef } from 'react';
import { syncReadingProgress, updateReadingProgress } from "@/services/apiServices";
import { createReadingProgress } from '@/features/read/readingProgress';

export function useReadingProgress(
    bookId: string,
    episodeId: string,
    user: any,
    onConflict?: (data: any) => void,
    isEnabled = true,
) {
    const [showNav, setShowNav] = useState(true);
    const contentRef = useRef<HTMLElement>(null);
    const onConflictRef = useRef(onConflict);

    useEffect(() => {
        onConflictRef.current = onConflict;
    }, [onConflict]);

    const progress = useMemo(() => createReadingProgress({
        bookId,
        episodeId,
        viewport: {
            waitUntilStable: () => new Promise((resolve) => setTimeout(resolve, 500)),
            read: () => {
                const element = contentRef.current;
                if (!element) return null;

                const rect = element.getBoundingClientRect();
                return {
                    elementTop: rect.top + window.scrollY,
                    elementHeight: element.scrollHeight,
                    viewportHeight: window.innerHeight,
                    scrollY: window.scrollY,
                };
            },
            scrollTo: (top) => {
                window.scrollTo({ top, behavior: 'smooth' });
            },
        },
        persistence: {
            restore: async (currentEpisodeId) => {
                const response = await syncReadingProgress(currentEpisodeId);
                return response?.status === 'success' && typeof response.progress === 'number'
                    ? response.progress
                    : undefined;
            },
            save: updateReadingProgress,
        },
        onConflict: (data) => onConflictRef.current?.(data),
    }), [bookId, episodeId]);

    // Sync Progress on Load
    useEffect(() => {
        if (!episodeId || !user || !isEnabled) return;

        progress.resume();
        void progress.restore().then(() => progress.saveCurrent());

        return () => {
            progress.cancel();
        };
    }, [episodeId, isEnabled, progress, user]);

    // Track and persist progress from one owner.
    useEffect(() => {
        if (!episodeId || !user || !isEnabled) return;

        progress.resume();
        let timeoutId: NodeJS.Timeout | null = null;

        const handleScroll = () => {
            if (timeoutId) return;

            timeoutId = setTimeout(() => {
                void progress.captureAndSave().then((currentProgress) => {
                    if (currentProgress >= 0.99) {
                        setShowNav(true);
                    }
                }).finally(() => {
                    timeoutId = null;
                });
            }, 500);
        };

        const heartbeatInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && document.hasFocus()) {
                void progress.saveCurrent();
            }
        }, 30000);

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(heartbeatInterval);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [episodeId, isEnabled, progress, user]);

    return { contentRef, showNav, setShowNav };
}
