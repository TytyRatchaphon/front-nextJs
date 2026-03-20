export interface StorePackInCart {
  store_pack_id: number;
  name: string;
  img: string;
  price: number;
  type_use: string;
  full_price: number;
}

export interface CartItem {
  cart_item_id: number;
  quantity: number;
  selected: boolean;
  created_at: string;
  store_pack: StorePackInCart;
  is_available: boolean;
  limit_error?: string;
  limit_message?: string;
  // Compatibility fields for existing UI components (optional, or mapped in service)
  book_id?: number; 
  book_name?: string;
  book_cover?: string;
  price?: number;
  is_selected?: boolean;
}

export interface CartStore {
  store_id: number;
  store_name: string;
  store_icon: string | null;
  items: CartItem[];
}

export interface CartResponseData {
  stores: CartStore[];
}

export interface AddToCartPayload {
  book_id?: number | string;
  store_pack_id?: number | string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  cart_item_id: number;
  quantity?: number;
  selected?: boolean;
}

export interface CurrencySummary {
  type: string;
  amount: number;
  name: string;
}

export interface CartSummary {
  total_items: number;
  currency_list: CurrencySummary[];
}
export interface CheckoutItem {
  store_pack_id: number;
  name: string;
  img: string;
  quantity: number;
  price: number;
  currency: string;
  total_price: number;
  description: string;
}

export interface CheckoutItemsResponse {
    items: CheckoutItem[];
}

export interface ShippingItem {
    name: string;
    quantity: number;
}

export interface CheckoutAddressResponse {
    has_physical_items: boolean;
    phone: string;
    address: string;
    shipping_items: ShippingItem[];
}

export interface WalletState {
    coin: number;
    freecoin: number;
    stamp: number;
    coupon: number;
    current_rp?: number;
}

export interface CheckoutSummaryResponse {
    total_cost: Record<string, number>;
    wallet_before: WalletState;
    wallet_after: WalletState;
    can_purchase: boolean;
    limit_error: string | null;
}
