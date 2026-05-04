"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchPromotingGroups } from "@/services/api/campaignApi";
import { fetchActiveCategories } from "@/services/api/miscApi";
import type { ActiveCategory } from "@/services/api/miscApi";
import { fetchCartItems } from "@/services/cartService";

export function useNavbarData(isLoggedIn: boolean) {
  const { data: promotingGroups } = useQuery({
    queryKey: ["promotingGroups"],
    queryFn: fetchPromotingGroups,
    staleTime: 5 * 60 * 1000,
  });

  const { data: translatedNovelCategories = [], isLoading: isLoadingTranslatedNovelCategories } = useQuery<ActiveCategory[]>({
    queryKey: ["navbarNovelCategories", "tran"],
    queryFn: () => fetchActiveCategories("tran"),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  const { data: fictionNovelCategories = [], isLoading: isLoadingFictionNovelCategories } = useQuery<ActiveCategory[]>({
    queryKey: ["navbarNovelCategories", "write"],
    queryFn: () => fetchActiveCategories("write"),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });

  const { data: cartStores } = useQuery({
    queryKey: ["cartItems"],
    queryFn: fetchCartItems,
    enabled: !!isLoggedIn,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const cartItemCount = React.useMemo(() => {
    if (!cartStores) return 0;
    return cartStores.reduce((acc, store) => acc + (store.items?.length || 0), 0);
  }, [cartStores]);

  return {
    promotingGroups,
    translatedNovelCategories,
    isLoadingTranslatedNovelCategories,
    fictionNovelCategories,
    isLoadingFictionNovelCategories,
    cartItemCount,
  };
}
