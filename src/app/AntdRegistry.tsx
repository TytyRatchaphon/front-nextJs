"use client";

import '@ant-design/v5-patch-for-react-19'; // Patch for Next.js 15 / React 19
import React from 'react';
import { App, ConfigProvider } from 'antd';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/es/Cache';
import { useServerInsertedHTML } from 'next/navigation';

const StyledComponentsRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useMemo<Entity>(() => createCache(), []);
  useServerInsertedHTML(() => (
    <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
  ));
  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        theme={{
          token: {
            colorLink: '#000000',
            colorLinkHover: '#e53935',
            colorLinkActive: '#e53935',
          },
          components: {
            Notification: {
              zIndexPopup: 3000,
            },
          },
        }}
        warning={{
          strict: false,
        }}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </StyleProvider>
  );
};

export default StyledComponentsRegistry;
