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
  const { token: authToken } = useAuthStore() as any;

  useEffect(() => {
    // ใช้ URL เดียวกับ API โดย fallback ไปที่ค่า default ถ้าไม่มี env
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.220.214:3331';
    
    // Retrieve token from store or local storage fallback
    let token = authToken;
    if (!token && typeof window !== 'undefined') {
       const raw = localStorage.getItem('authToken');
       if (raw) {
          token = raw.replace(/^Bearer\s+/i, '').trim();
       }
    } else if (token) {
        token = token.replace(/^Bearer\s+/i, '').trim();
    }

    console.log('[Socket] Initializing connection to:', socketUrl);

    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'], 
      reconnection: true,
      reconnectionAttempts: Infinity, 
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: token,
      }
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === "io server disconnect") {
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (err) => {
        // Suppress bulky error logs, just show simple message
        console.warn('⚠️ Socket Connection Error:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      console.log('Cleaning up socket instance...');
      socketInstance.disconnect();
    };
  }, []); // Run once on mount

  // Watch for token changes and update auth
  useEffect(() => {
      if (socket) {
          let token = authToken;
          if (!token && typeof window !== 'undefined') {
              const raw = localStorage.getItem('authToken');
              if (raw) token = raw.replace(/^Bearer\s+/i, '').trim();
          } else if (token) {
              token = token.replace(/^Bearer\s+/i, '').trim();
          }

          if (token) {
              console.log('[Socket] Updating auth token...');
              socket.auth = { token };
              if (!socket.connected) {
                  socket.connect();
              }
          }
      }
  }, [authToken, socket]);

  // Handle visibility separate from socket creation
  useEffect(() => {
      if (!socket) return;

      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
               console.log('[Socket] Tab visible, checking connection...');
               if (!socket.connected) {
                   console.log('[Socket] Reconnecting...');
                   socket.connect();
               }
          }
      };

      const handleWindowFocus = () => {
          if (!socket.connected) {
               console.log('[Socket] Window focused, reconnecting...');
               socket.connect();
          }
      };

      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Periodic Heartbeat to handle idle disconnects
      const heartbeatInterval = setInterval(() => {
          if (!socket.connected) {
               console.log(`💓 Heartbeat: Socket disconnected (${new Date().toLocaleTimeString()}). Attempting reconnect...`);
               socket.connect();
          } else {
               // Optional: Log healthy heartbeat for debugging (user requested logs)
               console.log(`💓 Heartbeat: Alive (${new Date().toLocaleTimeString()})`);
          }
      }, 15000); // Check every 15 seconds

      return () => {
          clearInterval(heartbeatInterval);
          window.removeEventListener('focus', handleWindowFocus);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
