import { useState, useEffect, useRef } from 'react';
import { syncReadingProgress, updateReadingProgress } from "@/services/apiServices";

export function useReadingProgress(bookId: string, episodeId: string, user: any) {
    const [showNav, setShowNav] = useState(true);
    const contentRef = useRef<HTMLElement>(null);
    const isInitialSyncDone = useRef(false);

    // Sync Progress on Load
    useEffect(() => {
        const syncProgress = async () => {
            if (!episodeId || !user || isInitialSyncDone.current) return;

            try {
                const res = await syncReadingProgress(episodeId);
                if (res && res.status === 'success' && res.progress > 0) {
                    setTimeout(() => {
                        if (contentRef.current) {
                            const element = contentRef.current;
                            const elementTop = element.getBoundingClientRect().top + window.scrollY;
                            const elementHeight = element.scrollHeight;
                            const windowHeight = window.innerHeight;

                            const totalScrollable = elementHeight - windowHeight;
                            const targetScroll = elementTop + (res.progress * totalScrollable);

                            window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                        }
                    }, 500);
                }
                isInitialSyncDone.current = true;
            } catch (err) { }
        };

        if (episodeId) {
            isInitialSyncDone.current = false;
            syncProgress();
        }
    }, [episodeId, user]);

    // Track Scroll Progress
    useEffect(() => {
        if (!episodeId || !user) return;

        let timeoutId: NodeJS.Timeout | null = null;

        const handleScroll = () => {
            if (timeoutId) return;

            timeoutId = setTimeout(async () => {
                if (contentRef.current) {
                    const element = contentRef.current;
                    const rect = element.getBoundingClientRect();
                    const elementTop = rect.top + window.scrollY;
                    const elementHeight = element.scrollHeight;
                    const windowHeight = window.innerHeight;
                    const scrollY = window.scrollY;

                    const totalScrollable = elementHeight - windowHeight;

                    if (totalScrollable <= 0) {
                        await updateReadingProgress(bookId, episodeId, 1);
                        setShowNav(true);
                        timeoutId = null;
                        return;
                    }

                    const relativeScroll = scrollY - elementTop;
                    const progress = Math.min(Math.max(relativeScroll / totalScrollable, 0), 1);
                    const formattedProgress = Number(progress.toFixed(4));

                    if (progress >= 0.99) {
                        setShowNav(true);
                    }

                    await updateReadingProgress(bookId, episodeId, formattedProgress);
                }
                timeoutId = null;
            }, 500);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [episodeId, user, bookId]);

    return { contentRef, showNav, setShowNav };
}
