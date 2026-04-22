"use client";
import * as React from "react";
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

interface CouponTimerProps {
    targetDate: string | Date | null;
    className?: string;
}

const CouponTimer: React.FC<CouponTimerProps> = ({ targetDate, className }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft('ไม่จำกัดเวลา');
            return;
        }

        const calculateTimeLeft = () => {
            const now = dayjs();
            const target = dayjs(targetDate);
            const diff = target.diff(now);

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('หมดอายุแล้ว');
                return;
            }

            const durationObj = dayjs.duration(diff);
            const days = Math.floor(durationObj.asDays());
            const hours = durationObj.hours();
            const minutes = durationObj.minutes();
            const seconds = durationObj.seconds();

            const parts = [];
            if (days > 0) parts.push(`${days} วัน`);
            if (hours > 0 || days > 0) parts.push(`${hours} ชม.`);
            if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes} นาที`);
            parts.push(`${seconds} วินาที`);

            setTimeLeft(`เหลือ ${parts.join(' ')}`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <span className={`${className} ${isExpired ? 'text-gray-500' : 'text-red-500'} font-medium`}>
            {timeLeft}
        </span>
    );
};

export default CouponTimer;
