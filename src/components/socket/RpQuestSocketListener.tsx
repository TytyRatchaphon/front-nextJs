"use client";

import * as React from "react";
import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { queryKeys } from "@/constants/query";
import { useSocket } from "@/providers/SocketProvider";
import { useAuthStore } from "@/stores/authStore";
import { getNavbarRankQueryKey } from "@/utils/rankRefresh";

type CompletedQuest = {
  name?: string;
  rp_reward?: number;
};

type RpQuestProgressPayload = {
  event_type?: string;
  completed_quests?: CompletedQuest[];
};

const getCompletedQuests = (payload?: RpQuestProgressPayload): CompletedQuest[] => {
  if (payload?.event_type !== "completed") return [];
  return Array.isArray(payload.completed_quests) ? payload.completed_quests : [];
};

const getCompletedQuestTotalRp = (completedQuests: CompletedQuest[]) => (
  completedQuests.reduce((total, quest) => total + Number(quest.rp_reward || 0), 0)
);

export default function RpQuestSocketListener() {
  const { socket } = useSocket();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();

  React.useEffect(() => {
    if (!socket || !isLoggedIn) return;

    const handleQuestCompleted = (payload?: RpQuestProgressPayload) => {
      const completedQuests = getCompletedQuests(payload);
      if (completedQuests.length === 0) return;

      const totalRp = getCompletedQuestTotalRp(completedQuests);
      const firstQuest = completedQuests[0];

      notification.success({
        key: "rp-quest-completed",
        message: completedQuests.length === 1
          ? `ภารกิจสำเร็จ: ${firstQuest?.name || "RP Quest"}`
          : `สำเร็จ ${completedQuests.length} ภารกิจ`,
        description: completedQuests.length === 1
          ? `รับ ${Number(firstQuest?.rp_reward || 0).toLocaleString()} RP ได้แล้ว กดเพื่อไปดูภารกิจ`
          : `รับรวม ${totalRp.toLocaleString()} RP ได้แล้ว กดเพื่อไปดูภารกิจ`,
        placement: "topRight",
        duration: 5,
        style: { cursor: "pointer" },
        onClick: () => {
          router.push("/mprofile?openRpQuest=1");
        },
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.rank.quests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.rank.questDetails() });
      queryClient.invalidateQueries({ queryKey: getNavbarRankQueryKey(user?.user_id) });
    };

    socket.on("rp_quest_progress_info", handleQuestCompleted);

    return () => {
      socket.off("rp_quest_progress_info", handleQuestCompleted);
    };
  }, [isLoggedIn, notification, queryClient, router, socket, user?.user_id]);

  return null;
}
