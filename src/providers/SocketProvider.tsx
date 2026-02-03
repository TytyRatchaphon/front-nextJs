'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

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
    
    // Retrieve token from store or local storage fallback
    let token = authToken;
    let currentUser = user;

    if (typeof window !== 'undefined') {
       if (!token) {
           const raw = localStorage.getItem('authToken');
           if (raw) {
              token = raw.replace(/^Bearer\s+/i, '').trim();
           }
       }
       if (!currentUser) {
           const rawUser = localStorage.getItem('userData');
           if (rawUser) {
               try { currentUser = JSON.parse(rawUser); } catch {}
           }
       }
    } else if (token) {
        token = token.replace(/^Bearer\s+/i, '').trim();
    }

    const currentUserId = currentUser?.user_id || (currentUser as any)?.id || (currentUser as any)?.userId;
    
    // 1. If we have a token (Logged in) but User ID is missing, wait (Race condition protection).
    // Note: If !token (Guest), we proceed to connect as guest.
    if (token && !currentUserId) {
        console.log("⏳ Socket waiting for user_id resolution...");
        setSocket(null); // Ensure we don't hold onto a stale socket
        return;
    }

    console.log('Socket Initial Query:', {
      user_id: currentUserId || 'undefined',
      'fullname': currentUser?.fullname || 'undefined'
    });

    // 2. Initialize Socket
    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'], 
      reconnection: true,
      reconnectionAttempts: Infinity, 
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // Ensure a fresh connection
      auth: (cb) => {
        // ⚡ Dynamic Auth: Fetch latest token on every connection/reconnection attempt
        let latestToken = useAuthStore.getState().token;
        if (!latestToken && typeof window !== 'undefined') {
            const raw = localStorage.getItem('authToken');
            if (raw) latestToken = raw.replace(/^Bearer\s+/i, '').trim();
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
      if (reason === "io server disconnect") {
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (err) => {
        console.log('Socket connect error:', err.message);
    });

    // Handle force_refresh event
    socketInstance.on('force_refresh', async (data: any) => {
        console.log("📢 Received force_refresh:", data);
        try {
            let currentToken = useAuthStore.getState().token;
            if (!currentToken) {
                 const raw = localStorage.getItem('authToken');
                 if (raw) currentToken = raw.replace(/^Bearer\s+/i, '').trim();
            }

            if (currentToken) {
                 const refreshToken = (await import('@/services/apiServices')).refreshToken;
                 const newTokenResult = await refreshToken(currentToken);
                 const newToken = newTokenResult?.data?.token || newTokenResult?.token || newTokenResult?.data;

                 if (typeof newToken === 'string') {
                     useAuthStore.getState().updateToken(newToken);
                     console.log("✅ Token refreshed successfully via socket event");
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

      // Periodic Heartbeat to handle idle disconnects
      const heartbeatInterval = setInterval(() => {
          if (!socket.connected) {
               const resolvedUserId = user?.user_id || (user as any)?.id || (user as any)?.userId;
               if (authToken && !resolvedUserId) return; // Don't reconnect if ID is missing

               socket.connect();
          } else {
               // Optional: Log healthy heartbeat for debugging (user requested logs)
          }
      }, 15000); // Check every 15 seconds

      return () => {
          clearInterval(heartbeatInterval);
      };
  }, [socket, authToken, user]);

  // 🔧 Auto-heal: Recovery for missing user_id in stale localStorage data
  useEffect(() => {
    if (authToken && user) {
        // If user logged in but missing ID, force re-parse of token
        if (!user.user_id && !(user as any).id && !(user as any).userId) {
             console.log("🔧 Auto-healing: Triggering token update to recover missing user_id");
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
