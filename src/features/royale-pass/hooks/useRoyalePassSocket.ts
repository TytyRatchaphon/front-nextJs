"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query";
import { useSocket } from "@/providers/SocketProvider";

export const useRoyalePassSocket = (passId?: number | string | null) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.royalePass.list() });
      if (passId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.royalePass.detail(passId) });
      }
    };

    socket.on("royale_pass:update", handleUpdate);
    return () => {
      socket.off("royale_pass:update", handleUpdate);
    };
  }, [passId, queryClient, socket]);
};
