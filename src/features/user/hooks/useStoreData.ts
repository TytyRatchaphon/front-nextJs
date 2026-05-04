import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchStoreData } from '@/services/apiServices';
import { imageLoader } from '@/utils/imageUtils';
import type { StoreCategory } from '@/types/api';

export function useStoreData() {
  const searchParams = useSearchParams();
  const [storeData, setStoreData] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerError, setBannerError] = useState(false);
  const [activeStoreTab, setActiveStoreTab] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchStoreData();
        setStoreData(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Clear previous load error when changing tabs so each banner can attempt loading.
    setBannerError(false);
  }, [activeStoreTab, storeData]);

  useEffect(() => {
    if (!storeData.length) return;

    const requestedTab = searchParams.get('tab')?.trim().toLowerCase();
    if (!requestedTab) return;

    const normalizedRequestedTab = requestedTab.replace(/[-_\s]+/g, '');
    const findCategoryByAlias = () => {
      if (/^\d+$/.test(requestedTab)) {
        return storeData.find((category) => String(category.store_id) === requestedTab) ?? null;
      }

      if (normalizedRequestedTab === 'all') {
        return null;
      }

      return (
        storeData.find((category) => {
          const normalizedName = category.name
            .toLowerCase()
            .replace(/[-_\s]+/g, '');

          if (normalizedName.includes(normalizedRequestedTab)) {
            return true;
          }

          if (normalizedRequestedTab === 'points') {
            return (
              category.name.includes('แต้ม')
              || category.StorePacks.some((pack) =>
                [
                  pack.name,
                  pack.detail,
                  pack.type,
                  pack.type_use,
                ]
                  .filter(Boolean)
                  .some((value) => String(value).toLowerCase().includes('fast'))
              )
            );
          }

          return false;
        }) ?? null
      );
    };

    const matchedCategory = findCategoryByAlias();
    if (!matchedCategory) {
      if (normalizedRequestedTab === 'all') {
        setActiveStoreTab('all');
      }
      return;
    }

    const nextTab = String(matchedCategory.store_id);
    if (activeStoreTab !== nextTab) {
      setActiveStoreTab(nextTab);
    }
  }, [activeStoreTab, searchParams, storeData]);

  const selectedStoreCategory =
    activeStoreTab === 'all'
      ? null
      : storeData.find((category) => String(category.store_id) === activeStoreTab) ?? null;

  const selectedStoreBannerRaw = selectedStoreCategory?.banner
    || storeData.find((category) => Boolean(category.banner))?.banner
    || null;

  const selectedStoreBanner = useMemo(() => {
    if (!selectedStoreBannerRaw || selectedStoreBannerRaw === 'null' || selectedStoreBannerRaw === 'undefined') {
      return null;
    }
    if (
      selectedStoreBannerRaw.startsWith('http')
      || selectedStoreBannerRaw.startsWith('data:')
      || selectedStoreBannerRaw.startsWith('/')
    ) {
      return selectedStoreBannerRaw.replace('http:', 'https:');
    }
    return `https://img.enjoybook.co/${selectedStoreBannerRaw}`;
  }, [selectedStoreBannerRaw]);

  const storePromoSrc = !bannerError && selectedStoreBanner
    ? imageLoader({ src: selectedStoreBanner, width: 1400 })
    : '/images/storeBanner.png';

  return {
    storeData,
    loading,
    activeStoreTab,
    setActiveStoreTab,
    bannerError,
    setBannerError,
    storePromoSrc,
  };
}
