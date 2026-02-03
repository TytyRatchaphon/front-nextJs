"use client";

import React, { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import SevenDaysLogin from '@/components/event/SevenDaysLogin';

import { useUIStore } from '@/stores/uiStore';
import { useWebsiteStore } from '@/stores/websiteStore';

const fetchWeeklyLogin = async (token?: string | null) => {
  if (!token) return {};
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const url = `${base}/user/event/login`;
  const res = await apiClient.get(url);
  return res.data?.data ?? {};
};

const DailyCheckinModal = () => {
    const { isLoggedIn, token } = useAuthStore();
    const { isDailyPopupProcessComplete, isCheckinModalOpen, openCheckinModal, closeCheckinModal } = useUIStore();
    const { settings } = useWebsiteStore();
    
    // Fetch data only if logged in
    const { data, isLoading } = useQuery({
        queryKey: ['weekly-login', token],
        queryFn: () => fetchWeeklyLogin(token),
        enabled: isLoggedIn && !!token,
        retry: 1,
        staleTime: 60 * 1000, 
    });

    // Auto-open logic removed as per user request
    // useEffect(() => {
    //     if (isLoggedIn && data && !isLoading && isDailyPopupProcessComplete) {
    //         const checkedToday = Boolean(data.checked_in_today);
    //         if (!checkedToday && settings?.['7D_Checkin'] === 'active') {
    //             openCheckinModal();
    //         }
    //     }
    // }, [isLoggedIn, data, isLoading, isDailyPopupProcessComplete, openCheckinModal]);

    const handleClose = () => {
        closeCheckinModal();
    };

    return (
        <Modal
            open={isCheckinModalOpen}
            onCancel={handleClose}
            footer={null}
            zIndex={2000}
            centered
            width={800} 
            className="daily-checkin-modal"
            destroyOnHidden
            closable={false} // Hide default close icon
            styles={{ 
                mask: { backdropFilter: 'blur(4px)' },
                content: { padding: 0, backgroundColor: 'transparent', boxShadow: 'none' } // Remove default white box
            }}
        >
            <SevenDaysLogin onClose={handleClose} />
        </Modal>
    );
};

export default DailyCheckinModal;
