"use client";

import { useEffect } from 'react';
import { subscribeApiClientEvent } from '@/services/apiEvents';
import { useUIStore } from '@/stores/uiStore';

export default function ApiAuthEventBridge() {
  const openDuplicateLoginModal = useUIStore((state) => state.openDuplicateLoginModal);
  const openBlockedUserModal = useUIStore((state) => state.openBlockedUserModal);

  useEffect(() => {
    const unsubscribeDuplicateLogin = subscribeApiClientEvent(
      'duplicate-login',
      openDuplicateLoginModal,
    );
    const unsubscribeBlockedUser = subscribeApiClientEvent(
      'blocked-user',
      openBlockedUserModal,
    );

    return () => {
      unsubscribeDuplicateLogin();
      unsubscribeBlockedUser();
    };
  }, [openBlockedUserModal, openDuplicateLoginModal]);

  return null;
}
