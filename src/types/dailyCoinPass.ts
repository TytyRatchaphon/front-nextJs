export interface DailyCoinPassAsset {
  url: string;
  type?: string;
  [key: string]: any;
}

export interface DailyCoinPassCurrencyAmount {
  currency: string;
  amount: number;
}

export interface DailyCoinPassClaimEndpoint {
  method: string;
  url: string;
  body: any;
}

export interface DailyCoinPassActivePass {
  user_pass_id: number;
  plan_id: number;
  code: string;
  name: string;
  pass_state: string;
  claim_state: string;
  claim_endpoint?: DailyCoinPassClaimEndpoint | null;
  effective_start_date?: string;
  effective_end_date?: string;
  assets?: Record<string, DailyCoinPassAsset>;
  [key: string]: any;
}

export interface DailyCoinPassPlanSummary {
  plan_id: number;
  total_claimed: number;
  total_available: number;
  [key: string]: any;
}

export interface DailyCoinPassMeResponse {
  server_date: string; // YYYY-MM-DD
  reset_hour: number;
  next_reset_at: string; // ISO String
  global_assets?: Record<string, DailyCoinPassAsset>;
  active_passes: DailyCoinPassActivePass[];
  plan_summaries: DailyCoinPassPlanSummary[];
  claimable_count: number;
  claimable_total_freecoin: number;
  claimable_totals_by_currency: DailyCoinPassCurrencyAmount[];
  can_claim: boolean;
}

export interface DailyCoinPassClaimSlot {
  day_no: number;
  service_date: string;
  reward_type: string;
  amount: number;
}

export interface DailyCoinPassClaimResponse {
  claimed_count: number;
  total_freecoin: number;
  total_by_currency: DailyCoinPassCurrencyAmount[];
  balance_before: number;
  balance_after: number;
  balances_before_by_currency: DailyCoinPassCurrencyAmount[];
  balances_after_by_currency: DailyCoinPassCurrencyAmount[];
  claimed_slots: DailyCoinPassClaimSlot[];
  affected_passes: DailyCoinPassActivePass[];
  affected_plan_summaries: DailyCoinPassPlanSummary[];
}

export interface DailyCoinPassClaimRequest {
  user_pass_id?: number;
  claim_scope: 'today' | 'catchup' | 'all';
  day_no?: number;
  day_nos?: number[];
  claim_date?: string;
  claim_dates?: string[];
}

export interface DailyCoinPassCalendarDay {
  day_no: number;
  service_date: string;
  status: 'future' | 'no_reward' | 'claimed' | 'reversed' | 'expired' | 'locked' | 'claimable_today' | 'claimable_catchup' | 'catchup_quota_exhausted';
  reward_type?: string;
  amount?: number;
}

export interface DailyCoinPassCalendarResponse {
  server_date: string;
  reset_hour: number;
  user_pass_id: number;
  plan_id: number;
  code: string;
  name: string;
  assets?: Record<string, DailyCoinPassAsset>;
  global_assets?: Record<string, DailyCoinPassAsset>;
  stack_order: number;
  effective_start_date: string;
  effective_end_date: string;
  locked_by_previous_stack: boolean;
  can_claim_today: boolean;
  can_claim_catchup: boolean;
  summary: {
    total_days: number;
    claimed_days: number;
    missed_days: number;
    catchup_quota: number;
    catchup_used: number;
    [key: string]: any;
  };
  days: DailyCoinPassCalendarDay[];
}

export interface DailyCoinPassHistoryRow {
  user_pass_id: number;
  plan_id: number;
  code: string;
  name: string;
  status: string;
  effective_start_date: string;
  effective_end_date: string;
  store_pack?: any;
}

export interface DailyCoinPassPassHistoryResponse {
  page: number;
  limit: number;
  total: number;
  global_assets?: Record<string, DailyCoinPassAsset>;
  rows: DailyCoinPassHistoryRow[];
}

export interface DailyCoinPassClaimHistoryRow {
  claim_date: string;
  reward_type: string;
  amount: number;
  status: 'claimed' | 'reversed';
  user_pass_id?: number;
  [key: string]: any;
}

export interface DailyCoinPassClaimHistoryResponse {
  page: number;
  limit: number;
  total: number;
  rows: DailyCoinPassClaimHistoryRow[];
}
