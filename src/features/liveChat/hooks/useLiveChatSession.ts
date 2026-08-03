"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useRecoverWhenAvailable } from "@/hooks/useRecoverWhenAvailable";
import { useSocket } from "@/providers/SocketProvider";
import {
  answerLiveChatIntake,
  completeLiveChatIntake,
  createNewLiveChatThread,
  fetchActiveLiveChatThread,
  fetchLiveChatFeedbackTags,
  fetchLiveChatHelpTopics,
  fetchLiveChatIntake,
  fetchLiveChatMessages,
  fetchLiveChatThreads,
  goBackLiveChatIntake,
  markLiveChatRead,
  saveLiveChatFeedback,
  sendLiveChatImage,
  sendLiveChatText,
  startLiveChatIntake,
} from "@/services/api/liveChatApi";

import {
  createLiveChatSession,
  type LiveChatSessionGateway,
  type LiveChatSessionSocket,
} from "../liveChatSession";

const gateway: LiveChatSessionGateway = {
  fetchActiveThread: fetchActiveLiveChatThread,
  fetchThreads: fetchLiveChatThreads,
  fetchMessages: fetchLiveChatMessages,
  sendText: sendLiveChatText,
  sendImage: sendLiveChatImage,
  markRead: markLiveChatRead,
  fetchHelpTopics: fetchLiveChatHelpTopics,
  startIntake: startLiveChatIntake,
  fetchIntake: fetchLiveChatIntake,
  answerIntake: answerLiveChatIntake,
  goBackIntake: goBackLiveChatIntake,
  completeIntake: completeLiveChatIntake,
  createNewThread: createNewLiveChatThread,
  fetchFeedbackTags: fetchLiveChatFeedbackTags,
  saveFeedback: saveLiveChatFeedback,
};

export const useLiveChatSession = (enabled: boolean) => {
  const { socket, isConnected } = useSocket();
  const session = useMemo(() => createLiveChatSession({ gateway }), []);
  const state = useSyncExternalStore(
    session.subscribe,
    session.getState,
    session.getState,
  );

  useEffect(() => {
    if (!enabled) {
      session.close();
      return;
    }
    void session.open();
    return () => session.close();
  }, [enabled, session]);

  useEffect(() => {
    session.setSocket(enabled ? socket as LiveChatSessionSocket | null : null);
    return () => session.setSocket(null);
  }, [enabled, session, socket]);

  useRecoverWhenAvailable(session.recover, enabled);

  return { session, state, isConnected };
};
