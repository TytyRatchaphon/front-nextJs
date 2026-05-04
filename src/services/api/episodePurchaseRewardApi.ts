import apiClient from "../apiClient";

export type EpisodePurchaseRewardPreviewPayload =
  | { ep_id: number | string }
  | { ep_ids: Array<number | string> };

export type EpisodePurchaseRewardPreviewTone = "info" | "success" | "warning";

export type EpisodePurchaseRewardPreviewResult = {
  message: string | null;
  tone: EpisodePurchaseRewardPreviewTone;
  raw: unknown;
};

const normalizePreviewMessage = (payload: any): string | null => {
  const message = payload?.data?.purchase_reward?.message ?? payload?.message ?? null;
  return typeof message === "string" && message.trim().length > 0 ? message.trim() : null;
};

const resolvePreviewTone = (payload: any, message: string | null): EpisodePurchaseRewardPreviewTone => {
  const status = String(
    payload?.data?.purchase_reward?.status
    ?? payload?.data?.purchase_reward?.type
    ?? payload?.status
    ?? "",
  ).toLowerCase();
  const normalizedMessage = String(message ?? "").toLowerCase();

  if (
    status.includes("warn")
    || normalizedMessage.includes("warning")
    || normalizedMessage.includes("เตือน")
    || normalizedMessage.includes("ข้ามตอน")
    || normalizedMessage.includes("หลายตอน")
    || normalizedMessage.includes("ไม่เข้า")
    || normalizedMessage.includes("ไม่ร่วม")
  ) {
    return "warning";
  }

  if (status.includes("success") || status.includes("claim") || status.includes("reward")) {
    return "success";
  }

  return "info";
};

export const buildEpisodePurchaseRewardPreviewPayload = (
  episodeIds: number | string | Array<number | string>,
): EpisodePurchaseRewardPreviewPayload => (
  Array.isArray(episodeIds)
    ? { ep_ids: episodeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) }
    : { ep_id: Number(episodeIds) }
);

export const fetchEpisodePurchaseRewardPreview = async (
  episodeIds: number | string | Array<number | string>,
): Promise<EpisodePurchaseRewardPreviewResult> => {
  const payload = buildEpisodePurchaseRewardPreviewPayload(episodeIds);
  const response = await apiClient.post("/buy/eps/preview", payload, { timeout: 10000 });
  const message = normalizePreviewMessage(response.data);

  return {
    message,
    tone: resolvePreviewTone(response.data, message),
    raw: response.data,
  };
};
