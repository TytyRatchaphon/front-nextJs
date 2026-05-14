export interface UserWallet {
  coin: string;
  freecoin: string;
  heart: number;
  flower: number;
  coupon: number;
  exp_point: number;
  stamp: number;
  wheel: number;
  fast_ticket: number;
  coinIncome: string;
}

export interface UserWalletResponse {
  code: number;
  status: string;
  message: string;
  data: UserWallet;
}
