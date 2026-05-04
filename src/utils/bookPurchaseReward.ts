export type BookPurchaseReward = {
  has_promotion: boolean;
  img: string | null;
};

const pickRewardPayload = (book: any) => (
  book?.ep_purchase_reward
  ?? book?.epPurchaseReward
  ?? book?.ep_purchaseReward
  ?? book?.epPurchaseRewards
  ?? book?.purchase_reward
  ?? null
);

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
  }
  return false;
};

export const normalizeBookPurchaseReward = (book: any): BookPurchaseReward | null => {
  const reward = pickRewardPayload(book);
  if (!reward || typeof reward !== "object") return null;

  const imgValue = reward.img ?? reward.image ?? reward.icon ?? reward.url ?? null;
  const img = typeof imgValue === "string" && imgValue.trim().length > 0
    ? imgValue.trim()
    : null;

  return {
    has_promotion: normalizeBoolean(reward.has_promotion ?? reward.hasPromotion),
    img,
  };
};

export const getBookPurchaseRewardImage = (book: any) => {
  const reward = normalizeBookPurchaseReward(book);
  if (!reward?.has_promotion || !reward.img) return null;
  return reward.img;
};
