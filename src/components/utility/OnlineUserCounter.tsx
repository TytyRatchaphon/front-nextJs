'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { UserOutlined } from '@ant-design/icons';

export const OnlineUserCounter = () => {
  const { socket, isConnected } = useSocket();
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for 'online_users' event from backend
    // Backend should emit this event when connection count changes
    socket.on('online_users', (data: { count: number }) => {
      setOnlineCount(data.count);
    });

    // Optional: Request initial count if needed
    // socket.emit('get_online_users');

    return () => {
      socket.off('online_users');
    };
  }, [socket, isConnected]);

  if (!isConnected) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all hover:bg-black/80">
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </div>
      <UserOutlined />
      <span>{onlineCount.toLocaleString()} Users Online</span>
    </div>
  );
};
