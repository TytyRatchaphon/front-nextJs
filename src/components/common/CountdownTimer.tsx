import { useState, useEffect } from "react";

export const CountdownTimer = ({ 
    targetDate,
    variant = 'rose',
    label
}: { 
    targetDate: string;
    variant?: 'rose' | 'violet';
    label?: string;
}) => {
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                return {
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                    s: Math.floor((difference / 1000) % 60),
                };
            }
            return null;
        };

        const t = calculateTimeLeft();
        setTimeLeft(t);

        if (!t) return;

        const timer = setInterval(() => {
            const updated = calculateTimeLeft();
            setTimeLeft(updated);
            if (!updated) clearInterval(timer);
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    const colorClasses = variant === 'violet' 
        ? "text-violet-600 bg-violet-50 border-violet-100"
        : "text-rose-600 bg-rose-50 border-rose-100";

    return (
        <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${colorClasses}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
                {label && <span className="mr-1">{label}</span>}
                {timeLeft.d > 0 ? `${timeLeft.d}วัน ` : ""}
                {String(timeLeft.h).padStart(2, "0")}:{String(timeLeft.m).padStart(2, "0")}:{String(timeLeft.s).padStart(2, "0")}
            </span>
        </div>
    );
};
