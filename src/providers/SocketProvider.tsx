'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import Cookies from 'js-cookie';
import { parseJwtToken } from '@/utils/jwtParser';

const isSessionIdUnknownError = (message: string | undefined) =>
  typeof message === 'string' && message.toLowerCase().includes('session id unknown');

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
  const { token: authToken, user } = useAuthStore() as any;
  
  // Calculate dependencies at component level
  const resolvedUserId = user?.user_id || (user as any)?.id || (user as any)?.userId;
  const fullname = user?.fullname;

  useEffect(() => {
    // ใช้ URL เดียวกับ API โดย fallback ไปที่ค่า default ถ้าไม่มี env
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331';
    
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
        setSocket(null); // Ensure we don't hold onto a stale socket
        return;
    }

    /* console.log('Socket Initial Query:', {
      user_id: currentUserId || 'undefined',
      'fullname': currentUser?.fullname || 'undefined'
    }); */

    // 2. Initialize Socket
    const socketInstance = io(socketUrl, {
      transports: ['websocket'], 
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
      auth: (cb) => {
        // ⚡ Dynamic Auth: Fetch latest token on every connection/reconnection attempt
        let latestToken = useAuthStore.getState().token;
        if (!latestToken) {
            latestToken = parseJwtToken(Cookies.get('token')) || null;
        }
        cb({ token: latestToken });
      },
      query: {
        user_id: currentUserId || 'undefined',
        fullname: currentUser?.fullname || 'undefined',
      }
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") socketInstance.connect();
    });

    socketInstance.on('connect_error', (err) => {
        setIsConnected(false);
        if (isSessionIdUnknownError(err?.message)) {
          socketInstance.io.opts.reconnection = false;
          socketInstance.disconnect();
        }
    });

    // Handle force_refresh event
    socketInstance.on('force_refresh', async () => {
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
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [authToken, resolvedUserId, fullname]);

  // Handle visibility separate from socket creation
  useEffect(() => {
      if (!socket) return;

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !socket.connected) {
          const latestUser = useAuthStore.getState().user as any;
          const latestToken = useAuthStore.getState().token || parseJwtToken(Cookies.get('token')) || null;
          const latestUserId = latestUser?.user_id || latestUser?.id || latestUser?.userId;
          if (latestToken && !latestUserId) return;
          if ((socket.io.opts.reconnection ?? true) === false) return;
          socket.connect();
        }
      };

      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => {
          document.removeEventListener('visibilitychange', onVisibilityChange);
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
