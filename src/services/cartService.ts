import apiClient from './apiClient';
import { warnApiFallback } from './api/apiFallback';
import { CartStore, AddToCartPayload, UpdateCartItemPayload, CartSummary, CheckoutItemsResponse, CheckoutAddressResponse, CheckoutSummaryResponse } from '@/types/cart';

const EMPTY_CHECKOUT_ITEMS: CheckoutItemsResponse = { items: [] };
const EMPTY_CHECKOUT_ADDRESS: CheckoutAddressResponse = {
  has_physical_items: false,
  phone: '',
  address: '',
  shipping_items: [],
};
const EMPTY_WALLET_STATE = {
  coin: 0,
  freecoin: 0,
  stamp: 0,
  coupon: 0,
};
const EMPTY_CHECKOUT_SUMMARY: CheckoutSummaryResponse = {
  total_cost: {},
  wallet_before: EMPTY_WALLET_STATE,
  wallet_after: EMPTY_WALLET_STATE,
  can_purchase: false,
  limit_error: 'ไม่สามารถโหลดข้อมูลสรุปรายการได้',
};

// 1. Get items in cart (grouped by store)
export const fetchCartItems = async (
  input?: any,
): Promise<CartStore[]> => {
  try {
    let params: Record<string, unknown> | undefined;
    if (Array.isArray(input)) {
      params = { selected_store_pack_list_ids: input };
    } else if (input && typeof input === 'object' && 'queryKey' in input && Array.isArray((input as any).queryKey?.[1])) {
      params = { selected_store_pack_list_ids: (input as any).queryKey[1] };
    }

    const response = await apiClient.get('/user/store/cart', params ? { params } : undefined);
    const stores = response.data?.data?.stores || [];
    
    if (Array.isArray(stores)) {
        return stores.map((store: any) => ({
            ...store,
            items: Array.isArray(store.items) ? store.items.map((item: any) => ({
                ...item,
                // Add compatibility fields
                book_id: item.store_pack?.store_pack_id,
                book_name: item.store_pack?.name,
                book_cover: item.store_pack?.img,
                price: item.store_pack?.price,
                is_selected: item.selected
            })) : []
        }));
    }

    warnApiFallback('/user/store/cart', '[]', response.data);
    return [];
  } catch (error) {
    warnApiFallback('/user/store/cart', '[]', error);
    return [];
  }
};

// 2. Add item to cart
export const addToCart = async (payload: AddToCartPayload) => {
  const response = await apiClient.post('/user/store/cart', payload);
  return response.data;
};

// 3. Update item in cart (quantity or selection)
export const updateCartItem = async (payload: UpdateCartItemPayload) => {
  const response = await apiClient.patch('/user/store/cart/item', payload);
  return response.data;
};

// 4. Remove specific item from cart
export const removeCartItem = async (cartItemId: number) => {
  const response = await apiClient.delete(`/user/store/cart/item/${cartItemId}`);
  return response.data;
};

// 5. Get total item count (optional, if still needed for badge)
export const fetchCartCount = async (): Promise<number> => {
  try {
      // If the API /user/store/cart/count exists and returns number
      const response = await apiClient.get('/user/store/cart/count');
      return response.data?.count || response.data?.data || 0;
  } catch (error) {
      // If fail, fallback to summary? Or return 0
      warnApiFallback('/user/store/cart/count', '0', error);
      return 0;
  }
};

// 7. Get Cart Summary (Totals)
export const fetchCartSummary = async (): Promise<CartSummary | null> => {
    try {
        const response = await apiClient.get('/user/store/cart/summary');
        return response.data?.data || null;
    } catch (error) {
        warnApiFallback('/user/store/cart/summary', 'null', error);
        return null;
    }
}

// 6. Remove all items (Clear cart)
export const clearCart = async () => {
  const response = await apiClient.delete('/user/store/cart/items');
  return response.data;
};
// 8. Checkout - Items
export const fetchCheckoutItems = async (): Promise<CheckoutItemsResponse> => {
    try {
        const response = await apiClient.get('/user/store/checkout/items');
        const payload = response.data?.data;
        if (payload && Array.isArray(payload.items)) return payload;
        warnApiFallback('/user/store/checkout/items', 'empty checkout items', response.data);
        return EMPTY_CHECKOUT_ITEMS;
    } catch (error) {
        warnApiFallback('/user/store/checkout/items', 'empty checkout items', error);
        return EMPTY_CHECKOUT_ITEMS;
    }
};

// 9. Checkout - Address
export const fetchCheckoutAddress = async (): Promise<CheckoutAddressResponse> => {
    try {
        const response = await apiClient.get('/user/store/checkout/address');
        const payload = response.data?.data;
        if (payload && typeof payload === 'object') {
            return {
                ...EMPTY_CHECKOUT_ADDRESS,
                ...payload,
                has_physical_items: Boolean(payload.has_physical_items),
                shipping_items: Array.isArray(payload.shipping_items) ? payload.shipping_items : [],
            };
        }
        warnApiFallback('/user/store/checkout/address', 'empty checkout address', response.data);
        return EMPTY_CHECKOUT_ADDRESS;
    } catch (error) {
        warnApiFallback('/user/store/checkout/address', 'empty checkout address', error);
        return EMPTY_CHECKOUT_ADDRESS;
    }
};

// 10. Checkout - Summary
export const fetchCheckoutSummary = async (): Promise<CheckoutSummaryResponse> => {
    try {
        const response = await apiClient.get('/user/store/checkout/summary');
        const payload = response.data?.data;
        if (payload && typeof payload === 'object') {
            return {
                ...EMPTY_CHECKOUT_SUMMARY,
                ...payload,
                total_cost: payload.total_cost && typeof payload.total_cost === 'object' ? payload.total_cost : {},
                wallet_before: payload.wallet_before && typeof payload.wallet_before === 'object' ? payload.wallet_before : EMPTY_WALLET_STATE,
                wallet_after: payload.wallet_after && typeof payload.wallet_after === 'object' ? payload.wallet_after : EMPTY_WALLET_STATE,
                can_purchase: Boolean(payload.can_purchase),
                limit_error: payload.limit_error ?? null,
            };
        }
        warnApiFallback('/user/store/checkout/summary', 'empty checkout summary', response.data);
        return EMPTY_CHECKOUT_SUMMARY;
    } catch (error) {
        warnApiFallback('/user/store/checkout/summary', 'empty checkout summary', error);
        return EMPTY_CHECKOUT_SUMMARY;
    }
};

// 11. Confirm Checkout (Payment)
export const confirmCheckout = async (): Promise<{ success: boolean; message: string; payment_id: number; token: string }> => {
    // User requested to call POST /user/store based on screenshot
    const response = await apiClient.post('/user/store');
    return response.data?.data;
};
