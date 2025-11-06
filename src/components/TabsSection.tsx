"use client";

import React from "react";
import { Tabs, ConfigProvider } from "antd";
import type { TabsProps } from "antd";

type TabsSectionProps<T extends string> = {
  tabs: readonly T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
};

function TabsSection<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: TabsSectionProps<T>) {
  const items: TabsProps["items"] = tabs.map((tab) => ({
    key: tab,
    label: (
      <span className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
        <span>{tab}</span>
      </span>
    ),
  }));

  return (
    <div className="bg-white rounded-t-lg shadow-sm">
      <ConfigProvider
        theme={{
          token: { colorPrimary: "#dc2626" },
          components: {
            Tabs: {
              inkBarColor: "#dc2626",
              itemActiveColor: "#dc2626",
              itemSelectedColor: "#dc2626",
              itemHoverColor: "#b91c1c",
            },
          },
        }}
      >
        <Tabs
          items={items}
          activeKey={activeTab}
          onChange={(key) => onTabChange(key as T)}
          tabBarGutter={16}
          tabBarStyle={{
            margin: 0,
            padding: "0 0",
            borderBottom: "1px solid #e5e7eb",
          }}
        />
      </ConfigProvider>
    </div>
  );
}

export default TabsSection;
