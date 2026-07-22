export type VipTierCode = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface VipRewardPreview {
  reward_id: string;
  name: string;
  image_url?: string;
  type: 'COIN' | 'COUPON' | 'ITEM' | 'OTHER';
}

export interface VipTierConfig {
  tier_code: VipTierCode;
  name_th: string;
  name_en: string;
  step_required_amount_baht: number;
  duration_days: number;
  stack_enabled: boolean;
  stack_required_amount_baht: number;
  stack_duration_days: number;
  time_pass_discount_percent: number;
  live_chat_access: boolean;
  rewards: VipRewardPreview[];
  icon_url?: string | null;
  card_image_url?: string | null;
  color_config?: any | null;
}

export interface VipPurchaseOption {
  target_tier_code: VipTierCode;
  currency_type: 'coin';
  price: number;
  required_accumulated_amount_baht: number;
  current_progress_amount_baht: number;
  purchase_kind: 'upgrade' | 'tier_extend_stack';
  stack_duration_days?: number;
  can_purchase: boolean;
  reason_not_purchasable?: string;
  target_tier?: VipTierConfig;
}

export interface VipProgress {
  progress_amount_baht: number;
  next_tier_code?: VipTierCode;
  next_tier_required_amount_baht?: number;
  remaining_amount_baht?: number;
  upgrade_options: VipPurchaseOption[];
  is_tier_stack_mode?: boolean;
  stack_required_amount_baht?: number;
  stack_progress_amount_baht?: number;
  stack_remaining_amount_baht?: number;
}

export interface VipCurrentTier {
  tier_code: VipTierCode;
  is_paid_tier: boolean;
  valid_until: string | null; // ISO string
  days_remaining: number | null;
  time_pass_discount_percent: number;
  live_chat_access: boolean;
  icon_url?: string | null;
  card_image_url?: string | null;
  color_config?: any | null;
}

export interface VipMeResponse {
  server_time: string; // ISO string
  current_tier: VipCurrentTier;
  progress: VipProgress;
  rewards: {
    claimable_count: number;
    next_claimable_at: string | null;
    next_reward_previews: VipRewardPreview[];
  };
}

export type VipRewardStatus = 'pending' | 'claimable' | 'claimed' | 'expired' | 'cancelled';

export interface VipClaimableReward {
  claimable_id: string;
  tier_code: string;
  reward_type: string;
  reward_family: string;
  amount: number;
  status: VipRewardStatus;
  claimable_at: string; // ISO string
  expires_at: string | null; // ISO string
  claimed_at: string | null; // ISO string
  display_label: string;
  wallet_type: string;
  source_reward_code: string;
  coupon_id?: string | null;
  discount_percent?: number | null;
  grant_source_type?: string | null;
  cadence_days?: number | null;
  cadence_months?: number | null;
}

export interface VipClaimRewardResponse {
  success: boolean;
  claimed_rewards: {
    reward_id: string;
    name: string;
    type: string;
    amount?: number;
  }[];
}

export interface VipHistoryLog {
  log_id: string;
  action_type: 'PURCHASE' | 'UPGRADE' | 'STACK' | 'EXPIRED' | 'CLAIM_REWARD';
  created_at: string;
  details: any;
}
