"use client";
import * as React from "react";
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie';
import { parseJwtToken } from '@/utils/jwtParser';

const isSessionIdUnknownError = (message: string | undefined) =>
  typeof message === 'string' && message.toLowerCase().includes('session id unknown');

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const SOCKET_PATH = '/socket.io/';
const SOCKET_HEALTH_CHECK_MS = 30_000;
const SOCKET_RECREATE_DELAY_MS = 800;
const SHOULD_LOG_SOCKET_DEBUG = process.env.NODE_ENV !== 'production';

const getBrowserOnlineState = () =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

const connectSocketIfOnline = (socket: Socket, source: string) => {
  if (!getBrowserOnlineState()) {
    if (SHOULD_LOG_SOCKET_DEBUG) {
      console.warn('[socket] skip connect because browser is offline', { source });
    }
    return;
  }

  if (!socket.connected) {
    socket.connect();
  }
};

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const recreateTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const { token: authToken, user } = useAuthStore() as any;
  const hasAuthToken = Boolean(authToken);

  const requestSocketRecreate = React.useCallback(() => {
    if (recreateTimerRef.current) {
      clearTimeout(recreateTimerRef.current);
    }

    setIsConnected(false);
    recreateTimerRef.current = setTimeout(() => {
      setReconnectNonce((value) => value + 1);
    }, SOCKET_RECREATE_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (recreateTimerRef.current) {
        clearTimeout(recreateTimerRef.current);
      }
    };
  }, []);
  
  // Calculate dependencies at component level
  const resolvedUserId = user?.user_id || (user as any)?.id || (user as any)?.userId;
  const fullname = user?.fullname;

  useEffect(() => {
    if (!SOCKET_URL) {
      console.warn('Socket URL is not configured');
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Retrieve token from store or cookie fallback
    let token = authToken;
    let currentUser = user;

    if (!token && typeof window !== 'undefined') {
      token = parseJwtToken(Cookies.get('token')) || null;
    }
    if (token) {
         token = token.replace(/^Bearer\s+/i, '').trim();
    } 

    const currentUserId = currentUser?.user_id || (currentUser as any)?.id || (currentUser as any)?.userId;
    
    // 1. If no token (Guest) or waiting for user ID resolution, do not connect socket.
    if (!token || !currentUserId) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocket(null); // Ensure we don't hold onto a stale socket
        setIsConnected(false);
        return;
    }

    /* console.log('Socket Initial Query:', {
      user_id: currentUserId || 'undefined',
      'fullname': currentUser?.fullname || 'undefined'
    }); */

    // 2. Create one socket for the current authenticated user/environment.
    const socketInstance = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 20000,
      autoConnect: false,
      forceNew: true,
      auth: (cb) => {
        // ⚡ Dynamic Auth: Fetch latest token on every connection/reconnection attempt
        let latestToken = useAuthStore.getState().token;
        if (!latestToken) {
            latestToken = parseJwtToken(Cookies.get('token')) || null;
        }
        if (latestToken) {
          latestToken = latestToken.replace(/^Bearer\s+/i, '').trim();
        }
        cb({ token: latestToken });
      },
      query: {
        user_id: currentUserId || 'undefined',
        fullname: currentUser?.fullname || 'undefined',
      }
    });

    const getTransportName = () => socketInstance.io.engine?.transport?.name ?? 'unknown';

    const handleConnect = () => {
      if (!getBrowserOnlineState()) {
        setIsConnected(false);
        if (SHOULD_LOG_SOCKET_DEBUG) {
          console.warn('[socket] connected while browser is offline; disconnecting', {
            url: SOCKET_URL,
            socketId: socketInstance.id,
            transport: getTransportName(),
            userId: currentUserId,
            online: false,
          });
        }
        socketInstance.disconnect();
        return;
      }

      setIsConnected(true);
      if (SHOULD_LOG_SOCKET_DEBUG) {
        console.log('[socket] connected', {
          url: SOCKET_URL,
          socketId: socketInstance.id,
          transport: getTransportName(),
          userId: currentUserId,
          online: getBrowserOnlineState(),
        });
      }
    };

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      setIsConnected(false);
      if (SHOULD_LOG_SOCKET_DEBUG) {
        console.log('[socket] disconnected', reason, {
          online: getBrowserOnlineState(),
        });
      }
      if (reason === "io server disconnect") {
        window.setTimeout(() => {
          connectSocketIfOnline(socketInstance, 'server-disconnect');
        }, SOCKET_RECREATE_DELAY_MS);
      }
    };

    const handleConnectError = (err: Error & { description?: unknown; context?: unknown }) => {
      setIsConnected(false);
      if (SHOULD_LOG_SOCKET_DEBUG) {
        console.error('[socket] connect_error', {
          url: SOCKET_URL,
          message: err.message,
          description: err.description,
          context: err.context,
          online: getBrowserOnlineState(),
        });
      }
      if (isSessionIdUnknownError(err?.message)) {
        socketInstance.disconnect();
        setSocket((currentSocket) => currentSocket === socketInstance ? null : currentSocket);
        requestSocketRecreate();
      }
    };

    const handleReconnectAttempt = (attempt: number) => {
      if (SHOULD_LOG_SOCKET_DEBUG) {
        console.log('[socket] reconnect_attempt', attempt, {
          online: getBrowserOnlineState(),
        });
      }

      if (!getBrowserOnlineState()) {
        socketInstance.disconnect();
      }
    };

    const handleReconnect = (attempt: number) => {
      if (SHOULD_LOG_SOCKET_DEBUG) {
        console.log('[socket] reconnect', attempt, {
          socketId: socketInstance.id,
          transport: getTransportName(),
          online: getBrowserOnlineState(),
        });
      }
    };

    const handleReconnectError = (err: Error & { description?: unknown }) => {
      if (SHOULD_LOG_SOCKET_DEBUG) {
        console.error('[socket] reconnect_error', {
          message: err.message,
          description: err.description,
          online: getBrowserOnlineState(),
        });
      }
    };

    const handleReconnectFailed = () => {
      if (SHOULD_LOG_SOCKET_DEBUG) {
        console.error('[socket] reconnect_failed');
      }
    };

    // Handle force_refresh event
    const handleForceRefresh = async () => {
        // console.log("📢 Received force_refresh:", data);
        try {
            let currentToken = useAuthStore.getState().token;
            if (!currentToken) currentToken = parseJwtToken(Cookies.get('token')) || null;

            if (currentToken) {
                 const refreshToken = (await import('@/services/apiServices')).refreshToken;
                 const newTokenResult = await refreshToken(currentToken);
                 const newToken = newTokenResult?.data?.token || newTokenResult?.token || newTokenResult?.data;

                 if (typeof newToken === 'string') {
                     useAuthStore.getState().updateToken(newToken);
                     // console.log("✅ Token refreshed successfully via socket event");
                 }
            }
        } catch (error) {
            console.error("❌ Failed to refresh token via socket:", error);
        }
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('force_refresh', handleForceRefresh);
    socketInstance.io.on('reconnect_attempt', handleReconnectAttempt);
    socketInstance.io.on('reconnect', handleReconnect);
    socketInstance.io.on('reconnect_error', handleReconnectError);
    socketInstance.io.on('reconnect_failed', handleReconnectFailed);

    socketRef.current = socketInstance;
    setSocket(socketInstance);
    connectSocketIfOnline(socketInstance, 'initial');

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('force_refresh', handleForceRefresh);
      socketInstance.io.off('reconnect_attempt', handleReconnectAttempt);
      socketInstance.io.off('reconnect', handleReconnect);
      socketInstance.io.off('reconnect_error', handleReconnectError);
      socketInstance.io.off('reconnect_failed', handleReconnectFailed);
      socketInstance.disconnect();
      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
      setSocket((currentSocket) => currentSocket === socketInstance ? null : currentSocket);
      setIsConnected(false);
    };
  }, [hasAuthToken, resolvedUserId, fullname, reconnectNonce, requestSocketRecreate]);

  useEffect(() => {
      const handleOnline = () => {
        if (SHOULD_LOG_SOCKET_DEBUG) {
          console.log('[network] online', {
            online: getBrowserOnlineState(),
          });
        }

        const currentSocket = socketRef.current;
        if (currentSocket && !currentSocket.connected) {
          connectSocketIfOnline(currentSocket, 'browser-online');
        }
      };

      const handleOffline = () => {
        if (SHOULD_LOG_SOCKET_DEBUG) {
          console.log('[network] offline', {
            online: getBrowserOnlineState(),
          });
        }

        const currentSocket = socketRef.current;
        if (currentSocket) {
          currentSocket.disconnect();
        }
        setIsConnected(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // Handle visibility separate from socket creation
  useEffect(() => {
      if (!socket) return;

      const reconnectIfNeeded = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        if (!getBrowserOnlineState()) {
          if (SHOULD_LOG_SOCKET_DEBUG) {
            console.warn('[socket] skip connect because browser is offline', {
              source: 'visibility-health-check',
            });
          }
          return;
        }
        if (socket.connected) return;

        const latestUser = useAuthStore.getState().user as any;
        const latestToken = useAuthStore.getState().token || parseJwtToken(Cookies.get('token')) || null;
        const latestUserId = latestUser?.user_id || latestUser?.id || latestUser?.userId;
        if (!latestToken || !latestUserId) return;

        connectSocketIfOnline(socket, 'visibility-health-check');
      };

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          reconnectIfNeeded();
        }
      };

      const healthCheck = window.setInterval(reconnectIfNeeded, SOCKET_HEALTH_CHECK_MS);

      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('focus', reconnectIfNeeded);
      return () => {
          window.clearInterval(healthCheck);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          window.removeEventListener('focus', reconnectIfNeeded);
      };
  }, [socket]);

  // 🔧 Auto-heal: Recovery for missing user_id in stale localStorage data
  useEffect(() => {
    if (authToken && user) {
        // If user logged in but missing ID, force re-parse of token
        if (!user.user_id && !(user as any).id && !(user as any).userId) {
             // console.log("🔧 Auto-healing: Triggering token update to recover missing user_id");
             useAuthStore.getState().updateToken(authToken);
        }
    }
  }, [authToken, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
