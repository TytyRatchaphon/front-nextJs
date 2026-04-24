"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCartItems } from "@/services/api/cartApi";
import { useAuthStore } from "@/stores/authStore";
import { queryKeys } from "@/constants/queryKeys";

export function useNavbarCart() {
  const { isLoggedIn } = useAuthStore();

  const { data: cartStores } = useQuery({
    queryKey: queryKeys.navbar.cartItems(),
    queryFn: fetchCartItems,
    enabled: !!isLoggedIn,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const cartItemCount = useMemo(() => {
    if (!cartStores) return 0;
    return cartStores.reduce((acc, store) => acc + (store.items?.length || 0), 0);
  }, [cartStores]);

  return { cartItemCount };
}
