import { z } from "zod";

import apiClient from "../apiClient";

const nullableStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .nullable()
  .optional();

const numberSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}, z.number());

const optionalNumberSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}, z.number().nullable());

const boolSchema = z.preprocess((value) => {
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return Boolean(value);
}, z.boolean());

const normalizeArrayValue = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const objectValue = value as Record<string, unknown>;
  const groupedValues = ["data", "items", "list", "quests", "daily", "weekly", "season", "all"].flatMap((key) => {
    const item = objectValue[key];
    return Array.isArray(item) ? item : [];
  });

  if (groupedValues.length > 0) return groupedValues;

  return Object.values(objectValue).flatMap((item) => {
    if (Array.isArray(item)) return item;
    return item && typeof item === "object" ? [item] : [];
  });
};

const arraySchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.preprocess(normalizeArrayValue, z.array(itemSchema));

export const royalePassTrackSchema = z.enum(["free", "premium"]);
export const royalePassQuestScopeSchema = z.enum(["daily", "weekly", "season"]);

export const royalePassUserStateSchema = z.object({
  current_level: numberSchema.default(0),
  current_exp: numberSchema.default(0),
  premium_status: z.string().nullable().optional(),
  is_premium: boolSchema.optional(),
}).passthrough();

export const royalePassPurchaseOptionsSchema = z.object({
  payment_enabled: boolSchema.optional(),
  payment_price: optionalNumberSchema.optional(),
  coin_enabled: boolSchema.optional(),
  coin_price: optionalNumberSchema.optional(),
  preorder_payment_discount_percent: optionalNumberSchema.optional(),
  preorder_coin_discount_percent: optionalNumberSchema.optional(),
  preorder_payment_price: optionalNumberSchema.optional(),
  preorder_coin_price: optionalNumberSchema.optional(),
  preorder_bonus_level: optionalNumberSchema.optional(),
}).passthrough();

export const royalePassSummarySchema = z.object({
  pass_id: numberSchema,
  name: z.string().catch("Royale Pass"),
  description: z.string().nullable().optional(),
  banner_img: nullableStringSchema,
  pre_banner_img: nullableStringSchema,
  start_date: nullableStringSchema,
  end_date: nullableStringSchema,
  pre_countdown_date: nullableStringSchema,
  is_preorder_period: boolSchema.default(false),
  is_started: boolSchema.default(true),
  user_state: royalePassUserStateSchema.optional(),
}).passthrough();

export const royalePassRewardSchema = z.object({
  level: numberSchema.default(0),
  track: royalePassTrackSchema.catch("free"),
  reward_type: z.string().catch("reward"),
  reward_display_text: z.string().nullable().optional(),
  reward_image: nullableStringSchema,
  reward_image_url: nullableStringSchema,
  amount: numberSchema.default(0),
  reward_amount: optionalNumberSchema.optional(),
  is_claimable: boolSchema.default(false),
  is_claimed: boolSchema.default(false),
  is_unlocked: boolSchema.default(false),
  coupon_detail: z.unknown().nullable().optional(),
}).passthrough();

export const royalePassLevelSchema = z.object({
  level: numberSchema,
  required_exp: numberSchema.default(0),
  rewards: z.unknown().optional(),
  free_rewards: arraySchema(royalePassRewardSchema).optional(),
  premium_rewards: arraySchema(royalePassRewardSchema).optional(),
}).passthrough();

export const royalePassQuestSchema = z.object({
  quest_id: optionalNumberSchema.optional(),
  royale_pass_quest_id: optionalNumberSchema.optional(),
  name: z.string().catch("Quest"),
  description: z.string().nullable().optional(),
  scope: royalePassQuestScopeSchema.catch("season"),
  track: royalePassTrackSchema.catch("free"),
  target_value: numberSchema.default(0),
  progress_value: numberSchema.default(0),
  exp_reward: numberSchema.default(0),
  is_completed: boolSchema.default(false),
  is_exp_granted: boolSchema.default(false),
  occurrence_end_at: nullableStringSchema,
}).passthrough();

export const royalePassDetailSchema = royalePassSummarySchema.extend({
  current_level: numberSchema.optional(),
  current_exp: numberSchema.optional(),
  next_required_exp: optionalNumberSchema.optional(),
  purchase_options: royalePassPurchaseOptionsSchema.optional(),
  levels: arraySchema(royalePassLevelSchema).default([]),
  rewards: arraySchema(royalePassRewardSchema).default([]),
  quests: arraySchema(royalePassQuestSchema).default([]),
}).passthrough();

const getResponseData = (payload: unknown) => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: unknown }).data;
  }
  return payload;
};

const getListItems = (payload: unknown): unknown[] => {
  const data = getResponseData(payload);
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const objectData = data as Record<string, unknown>;
    if (Array.isArray(objectData.passes)) return objectData.passes;
    if (Array.isArray(objectData.items)) return objectData.items;
    if (Array.isArray(objectData.list)) return objectData.list;
  }
  return [];
};

export type RoyalePassTrack = z.infer<typeof royalePassTrackSchema>;
export type RoyalePassQuestScope = z.infer<typeof royalePassQuestScopeSchema>;
export type RoyalePassSummary = z.infer<typeof royalePassSummarySchema>;
export type RoyalePassDetail = z.infer<typeof royalePassDetailSchema>;
export type RoyalePassReward = z.infer<typeof royalePassRewardSchema>;
export type RoyalePassLevel = z.infer<typeof royalePassLevelSchema>;
export type RoyalePassQuest = z.infer<typeof royalePassQuestSchema>;
export type RoyalePassPurchaseOptions = z.infer<typeof royalePassPurchaseOptionsSchema>;

export const parseRoyalePassList = (payload: unknown): RoyalePassSummary[] => {
  const items = getListItems(payload).map((item: any) => {
    if (item && typeof item === "object") {
      const userState = item.user_state ?? item.user;
      if (userState) {
        return { ...item, user_state: userState };
      }
    }
    return item;
  });
  const parsed = z.array(royalePassSummarySchema).safeParse(items);
  if (!parsed.success) {
    console.error("[royalePass] invalid list response", parsed.error);
    return [];
  }
  return parsed.data;
};

export const parseRoyalePassDetail = (payload: unknown): RoyalePassDetail | null => {
  let data = getResponseData(payload) as any;
  if (data && typeof data === "object") {
    const userState = data.user_state ?? data.user;
    if (data.pass && typeof data.pass === "object") {
      data = { ...data, ...data.pass };
    }
    if (userState) {
      data.user_state = userState;
    }
  }
  const parsed = royalePassDetailSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[royalePass] invalid detail response", parsed.error);
    return null;
  }
  return parsed.data;
};

export const fetchRoyalePassList = async (): Promise<RoyalePassSummary[]> => {
  const response = await apiClient.get("/user/royale-pass");
  return parseRoyalePassList(response.data);
};

export const fetchRoyalePassDetail = async (
  passId: number | string,
): Promise<RoyalePassDetail | null> => {
  const response = await apiClient.get(`/user/royale-pass/${passId}`);
  return parseRoyalePassDetail(response.data);
};

export const buyRoyalePassPremiumWithCoin = async (passId: number | string) => {
  const response = await apiClient.post(
    `/user/royale-pass/${passId}/buy-premium/currency`,
    JSON.stringify({ currency_type: "coin" }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export const claimRoyalePassReward = async (
  passId: number | string,
  level: number | string,
  track: RoyalePassTrack,
) => {
  const response = await apiClient.post(`/user/royale-pass/${passId}/reward/${level}/${track}/claim`);
  return response.data;
};
