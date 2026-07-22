import { useCallback, useEffect, useMemo, useState } from "react";
import {
  evaluateAndTrackFreeReadQuota,
  hasShownFirstTopupPrompt,
  markFirstTopupPromptShown,
  mergeGuestQuotaToUser,
  type FreeQuotaBlockReason,
} from "@/utils/readFreeQuota";

type UseReadFreeQuotaInput = {
  bookId: string;
  episodeId: string;
  isLoggedIn: boolean;
  userId?: string | number | null;
  canTrack: boolean;
  isEpisodeOwned: boolean;
  guestLimit?: number;
  memberLimit?: number;
};

type UseReadFreeQuotaResult = {
  isBlocked: boolean;
  reason: FreeQuotaBlockReason;
  currentCount: number;
  limit: number;
  alreadyRead: boolean;
  hasShownTopupPrompt: boolean;
  markTopupPromptShown: () => void;
};

const DEFAULT_GUEST_LIMIT = 10;
const DEFAULT_MEMBER_LIMIT = 40;

export function useReadFreeQuota({
  bookId,
  episodeId,
  isLoggedIn,
  userId,
  canTrack,
  isEpisodeOwned,
  guestLimit = DEFAULT_GUEST_LIMIT,
  memberLimit = DEFAULT_MEMBER_LIMIT,
}: UseReadFreeQuotaInput): UseReadFreeQuotaResult {
  const [state, setState] = useState<Omit<UseReadFreeQuotaResult, "markTopupPromptShown">>({
    isBlocked: false,
    reason: null,
    currentCount: 0,
    limit: isLoggedIn ? memberLimit : guestLimit,
    alreadyRead: false,
    hasShownTopupPrompt: false,
  });

  const userKey = useMemo(() => (userId === null || userId === undefined ? "" : String(userId)), [userId]);

  useEffect(() => {
    if (!isLoggedIn || !userKey) return;
    mergeGuestQuotaToUser(userKey);
  }, [isLoggedIn, userKey]);

  useEffect(() => {
    const nextLimit = isLoggedIn ? memberLimit : guestLimit;
    if (!bookId || !episodeId || !canTrack) {
      setState((prev) => ({
        ...prev,
        isBlocked: false,
        reason: null,
        limit: nextLimit,
      }));
      return;
    }

    const result = evaluateAndTrackFreeReadQuota({
      bookId,
      episodeId,
      isLoggedIn,
      userId: userKey || null,
      guestLimit,
      memberLimit,
      isEpisodeOwned,
    });

    const shown = isLoggedIn
      ? hasShownFirstTopupPrompt({ bookId, userId: userKey || null })
      : false;

    setState({
      isBlocked: result.blocked,
      reason: result.reason,
      currentCount: result.currentCount,
      limit: result.limit,
      alreadyRead: result.alreadyRead,
      hasShownTopupPrompt: shown,
    });
  }, [bookId, canTrack, episodeId, guestLimit, isEpisodeOwned, isLoggedIn, memberLimit, userKey]);

  const markTopupPromptShown = useCallback(() => {
    if (!isLoggedIn || !userKey || !bookId) return;
    markFirstTopupPromptShown({ bookId, userId: userKey });
    setState((prev) => ({ ...prev, hasShownTopupPrompt: true }));
  }, [bookId, isLoggedIn, userKey]);

  return {
    ...state,
    markTopupPromptShown,
  };
}
