"use client";

import { useEffect } from 'react';
import { subscribeApiClientEvent } from '@/services/apiEvents';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

export default function ApiAuthEventBridge() {
  const openDuplicateLoginModal = useUIStore((state) => state.openDuplicateLoginModal);
  const openBlockedUserModal = useUIStore((state) => state.openBlockedUserModal);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const unsubscribeDuplicateLogin = subscribeApiClientEvent(
      'duplicate-login',
      () => {
        openDuplicateLoginModal();
        void logout({ navigate: false });
      },
    );
    const unsubscribeBlockedUser = subscribeApiClientEvent(
      'blocked-user',
      () => {
        openBlockedUserModal();
        void logout({ navigate: false });
      },
    );

    return () => {
      unsubscribeDuplicateLogin();
      unsubscribeBlockedUser();
    };
  }, [logout, openBlockedUserModal, openDuplicateLoginModal]);

  return null;
}
