import apiClient from './apiClient';
import { CartStore, AddToCartPayload, UpdateCartItemPayload, CartSummary, CheckoutItemsResponse, CheckoutAddressResponse, CheckoutSummaryResponse } from '../interfaces/cart.interface';

type FetchCartItemsInput = Array<number | string> | { queryKey?: readonly unknown[] } | undefined;

const resolveSelectedStorePackListIds = (input: FetchCartItemsInput): Array<number | string> | undefined => {
  if (Array.isArray(input)) {
    return input;
  }

  if (input && typeof input === 'object' && 'queryKey' in input) {
    const queryKey = input.queryKey;
    const maybeSelectedIds = Array.isArray(queryKey) ? queryKey[1] : undefined;
    if (Array.isArray(maybeSelectedIds)) {
      return maybeSelectedIds.filter((id): id is number | string => typeof id === 'number' || typeof id === 'string');
    }
  }

  return undefined;
};

// 1. Get items in cart (grouped by store)
export const fetchCartItems = async (input?: FetchCartItemsInput): Promise<CartStore[]> => {
  try {
    const selectedStorePackListIds = resolveSelectedStorePackListIds(input);
    const response = await apiClient.get('/user/store/cart', selectedStorePackListIds?.length ? {
      params: {
        selected_store_pack_list_ids: selectedStorePackListIds,
      },
    } : undefined);
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

    return [];
  } catch (error) {
    console.error("Fetch Cart Error", error);
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
  } catch {
      // If fail, fallback to summary? Or return 0
      return 0;
  }
};

// 7. Get Cart Summary (Totals)
export const fetchCartSummary = async (): Promise<CartSummary | null> => {
    try {
        const response = await apiClient.get('/user/store/cart/summary');
        return response.data?.data || null;
    } catch {
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
    const response = await apiClient.get('/user/store/checkout/items');
    return response.data?.data;
};

// 9. Checkout - Address
export const fetchCheckoutAddress = async (): Promise<CheckoutAddressResponse> => {
    const response = await apiClient.get('/user/store/checkout/address');
    return response.data?.data;
};

// 10. Checkout - Summary
export const fetchCheckoutSummary = async (): Promise<CheckoutSummaryResponse> => {
    const response = await apiClient.get('/user/store/checkout/summary');
    return response.data?.data;
};

// 11. Confirm Checkout (Payment)
export const confirmCheckout = async (): Promise<{ success: boolean; message: string; payment_id: number; token: string }> => {
    // User requested to call POST /user/store based on screenshot
    const response = await apiClient.post('/user/store');
    return response.data?.data;
};
