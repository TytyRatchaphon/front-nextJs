import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../apiClient';
import {
  addToCart,
  clearCart,
  confirmCheckout,
  fetchCartCount,
  fetchCartItems,
  fetchCartSummary,
  fetchCheckoutAddress,
  fetchCheckoutItems,
  fetchCheckoutSummary,
  removeCartItem,
  updateCartItem,
} from './cartApi';

vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('maps cart store items with compatibility fields', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        data: {
          stores: [
            {
              store_id: 1,
              items: [
                {
                  selected: true,
                  store_pack: {
                    store_pack_id: 44,
                    name: 'Starter Pack',
                    img: 'cover.png',
                    price: 19,
                  },
                },
              ],
            },
          ],
        },
      },
    });

    const result = await fetchCartItems();
    expect(result).toHaveLength(1);
    expect(result[0].items[0]).toMatchObject({
      book_id: 44,
      book_name: 'Starter Pack',
      book_cover: 'cover.png',
      price: 19,
      is_selected: true,
    });
  });

  it('passes selected_store_pack_list_ids when fetching cart items', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: { data: { stores: [] } },
    });

    await expect(fetchCartItems([230, 231])).resolves.toEqual([]);
    expect(apiClient.get).toHaveBeenCalledWith('/user/store/cart', {
      params: {
        selected_store_pack_list_ids: [230, 231],
      },
    });
  });

  it('supports react-query query context input for selected_store_pack_list_ids', async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: { data: { stores: [] } },
    });

    await expect(fetchCartItems({ queryKey: ['cartItems', [900, 901]] } as any)).resolves.toEqual([]);
    expect(apiClient.get).toHaveBeenCalledWith('/user/store/cart', {
      params: {
        selected_store_pack_list_ids: [900, 901],
      },
    });
  });

  it('returns empty array when stores payload is invalid', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { data: { stores: null } } });
    await expect(fetchCartItems()).resolves.toEqual([]);
  });

  it('returns empty array on fetchCartItems error', async () => {
    (apiClient.get as any).mockRejectedValueOnce(new Error('network'));
    await expect(fetchCartItems()).resolves.toEqual([]);
  });

  it('returns count from count endpoint', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { count: 5 } });
    await expect(fetchCartCount()).resolves.toBe(5);
  });

  it('falls back to data field for count response', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { data: 9 } });
    await expect(fetchCartCount()).resolves.toBe(9);
  });

  it('returns 0 when count request fails', async () => {
    (apiClient.get as any).mockRejectedValueOnce(new Error('boom'));
    await expect(fetchCartCount()).resolves.toBe(0);
  });

  it('addToCart posts payload and returns response data', async () => {
    const payload = { store_pack_id: 1, quantity: 2 } as any;
    (apiClient.post as any).mockResolvedValueOnce({ data: { ok: true } });
    await expect(addToCart(payload)).resolves.toEqual({ ok: true });
    expect(apiClient.post).toHaveBeenCalledWith('/user/store/cart', payload);
  });

  it('updateCartItem patches payload and returns response data', async () => {
    const payload = {
      cart_item_id: 8,
      quantity: 3,
      selected_store_pack_list_ids: [230],
    } as any;
    (apiClient.patch as any).mockResolvedValueOnce({ data: { ok: true } });
    await expect(updateCartItem(payload)).resolves.toEqual({ ok: true });
    expect(apiClient.patch).toHaveBeenCalledWith('/user/store/cart/item', payload);
  });

  it('removeCartItem hits item delete endpoint', async () => {
    (apiClient.delete as any).mockResolvedValueOnce({ data: { ok: true } });
    await expect(removeCartItem(21)).resolves.toEqual({ ok: true });
    expect(apiClient.delete).toHaveBeenCalledWith('/user/store/cart/item/21');
  });

  it('fetchCartSummary returns null on error', async () => {
    (apiClient.get as any).mockRejectedValueOnce(new Error('network'));
    await expect(fetchCartSummary()).resolves.toBeNull();
  });

  it('fetchCartSummary returns summary payload', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { data: { total: 120 } } });
    await expect(fetchCartSummary()).resolves.toEqual({ total: 120 });
  });

  it('clearCart calls delete all endpoint', async () => {
    (apiClient.delete as any).mockResolvedValueOnce({ data: { ok: true } });
    await expect(clearCart()).resolves.toEqual({ ok: true });
    expect(apiClient.delete).toHaveBeenCalledWith('/user/store/cart/items');
  });

  it('fetch checkout endpoints return data.data', async () => {
    (apiClient.get as any)
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({ data: { data: { address: null } } })
      .mockResolvedValueOnce({ data: { data: { totals: {} } } });

    await expect(fetchCheckoutItems()).resolves.toEqual({ items: [] });
    await expect(fetchCheckoutAddress()).resolves.toEqual({ address: null });
    await expect(fetchCheckoutSummary()).resolves.toEqual({ totals: {} });
  });

  it('confirmCheckout posts and returns nested data payload', async () => {
    (apiClient.post as any).mockResolvedValueOnce({
      data: { data: { success: true, message: 'ok', payment_id: 1, token: 'abc' } },
    });

    await expect(confirmCheckout()).resolves.toEqual({
      success: true,
      message: 'ok',
      payment_id: 1,
      token: 'abc',
    });
    expect(apiClient.post).toHaveBeenCalledWith('/user/store');
  });
});
