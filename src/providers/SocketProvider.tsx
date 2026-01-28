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

    console.log('Socket Initial Query:', {
      user_id: currentUser?.user_id,
      'fullname': currentUser?.fullname
    });

    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'], 
      reconnection: true,
      reconnectionAttempts: Infinity, 
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: token,
      },
      query: {
        user_id: currentUser?.user_id,
        fullname: currentUser?.fullname,
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
        // Suppress bulky error logs, just show simple message
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []); // Run once on mount

  // Watch for token/user changes and update auth/query
  useEffect(() => {
      if (socket) {
          let token = authToken;
          let currentUser = user;

          if (typeof window !== 'undefined') {
              if (!token) {
                  const raw = localStorage.getItem('authToken');
                  if (raw) token = raw.replace(/^Bearer\s+/i, '').trim();
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

          if (token) {
              socket.auth = { token };
          }
          
          if (currentUser) {
              socket.io.opts.query = {
                  user_id: currentUser.user_id,
                  fullname: currentUser.fullname
              };
              console.log('Socket Updated Query:', socket.io.opts.query);
          }

          if (token || currentUser) {
              if (!socket.connected) {
                  socket.connect();
              }
          }
      }
  }, [authToken, user, socket]);

  // Handle visibility separate from socket creation
  useEffect(() => {
      if (!socket) return;

      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
               if (!socket.connected) {
                   socket.connect();
               }
          }
      };

      const handleWindowFocus = () => {
          if (!socket.connected) {
               socket.connect();
          }
      };

      window.addEventListener('focus', handleWindowFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Periodic Heartbeat to handle idle disconnects
      const heartbeatInterval = setInterval(() => {
          if (!socket.connected) {
               socket.connect();
          } else {
               // Optional: Log healthy heartbeat for debugging (user requested logs)
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
