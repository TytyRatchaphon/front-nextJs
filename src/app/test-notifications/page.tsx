"use client";

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { Button, Card, Tag, Typography, List } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface LogItem {
  timestamp: string;
  event: string;
  data: any;
}

export default function TestNotificationPage() {
  const { socket, isConnected } = useSocket();
  const [logs, setLogs] = useState<LogItem[]>([]);

  const addLog = (event: string, data: any) => {
    setLogs((prev) => [
      {
        timestamp: dayjs().format('HH:mm:ss'),
        event,
        data,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => addLog('connect', { socketId: socket.id });
    const handleDisconnect = () => addLog('disconnect', {});
    const handleNewNotification = (data: any) => addLog('notification:new', data);
    const handleReadNotification = (data: any) => addLog('notification:read', data);
    const handleReadAllNotification = () => addLog('notification:read-all', {});
    
    // Explicitly listen to these for debugging
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleReadNotification);
    socket.on('notification:read-all', handleReadAllNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleReadNotification);
      socket.off('notification:read-all', handleReadAllNotification);
    };
  }, [socket]);

  const handleJoinRoom = () => {
    if (socket) {
      socket.emit('join:notifications');
      addLog('Emit join:notifications', {});
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-primary">
      <Card title="Real-time Notification Debugger" bordered={false} className="shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Text strong>Status:</Text>
            {isConnected ? (
              <Tag icon={<WifiOutlined />} color="success" className="px-3 py-1 text-sm">
                Connected
              </Tag>
            ) : (
              <Tag icon={<DisconnectOutlined />} color="error" className="px-3 py-1 text-sm">
                Disconnected
              </Tag>
            )}
            <Text type="secondary" className="text-xs">
              {socket?.id}
            </Text>
          </div>
          <Button type="primary" onClick={handleJoinRoom} disabled={!isConnected}>
             Manual Join Room
          </Button>
        </div>

        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <Text strong>Event Log</Text>
                <Button size="small" onClick={() => setLogs([])}>Clear Log</Button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm text-gray-300 shadow-inner custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-600">
                        Waiting for events...
                    </div>
                ) : (
                    <List
                        dataSource={logs}
                        renderItem={(item) => (
                            <div className="mb-3 border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-blue-400">[{item.timestamp}]</span>
                                    <span className="text-green-400 font-bold">{item.event}</span>
                                </div>
                                <pre className="m-0 text-xs text-gray-400 bg-gray-950 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(item.data, null, 2)}
                                </pre>
                            </div>
                        )}
                    />
                )}
            </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-4">
            <p>ℹ️ <strong>Instructions:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Open this page in a separate tab or window.</li>
                <li>Ensure the status is <span className="text-green-600">Connected</span>.</li>
                <li>Wait for incoming notifications or perform actions in another tab to trigger events.</li>
                <li>If logs appear here but not in the Navbar, check Navbar component logic.</li>
                <li>If logs do NOT appear here, check Backend or Socket connection.</li>
            </ul>
        </div>
      </Card>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
