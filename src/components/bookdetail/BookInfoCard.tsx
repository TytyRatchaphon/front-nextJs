"use client";

import Image from "next/image";
import { App } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import SuccessAnimation from "@/components/utility/SuccessAnimation";
import { useBuyEpisodesMutation, useBuyGroupPromotionMutation } from "@/hooks/book/useBookWriteMutations";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { refreshToken } from "@/services/apiServices";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import "@/types/errors";
import "@/utils/imageUtils";
import { useLogger } from "@/hooks/useLogger";
import { requestNavbarRankRefresh } from "@/utils/rankRefresh";
import { queryKeys } from "@/constants/query";
import BookInfoCardPurchaseModals from "./BookInfoCardPurchaseModals";
import BookInfoCardPurchasePanel from "./BookInfoCardPurchasePanel";
import BookInfoCardPurchaseStyles from "./BookInfoCardPurchaseStyles";
import BookInfoCardWalletSection from "./BookInfoCardWalletSection";
import type { BookInfoCardProps } from "./BookInfoCard.types";
import { decodeTokenPayload as decodeToken } from "./bookInfoCardPurchaseUtils";
import { useBookInfoCardPurchaseState } from "./useBookInfoCardPurchaseState";

const BookInfoCard = ({ book, bookId }: BookInfoCardProps) => {
  const isDeleted = book.status?.toLowerCase().trim() === "delete";
  const { token, isLoggedIn, updateToken, user } = useAuthStore();
  const openLoginModal = useUIStore((state) => state.openLoginModal);
  const queryClient = useQueryClient();
  const { modal: modalApi, notification } = App.useApp();
  const { log } = useLogger();
  const { settings } = useWebsiteSettings();
  const buyGroupPromotionMutation = useBuyGroupPromotionMutation(bookId);
  const buyEpisodesMutation = useBuyEpisodesMutation(bookId);

  const messageApi = {
    success: (content: unknown) => notification.success({ message: String(content ?? "") }),
    error: (content: unknown) => notification.error({ message: String(content ?? "") }),
    warning: (content: unknown) => notification.warning({ message: String(content ?? "") }),
    info: (content: unknown) => notification.info({ message: String(content ?? "") }),
  };

  const refreshNavbarRank = () => {
    void requestNavbarRankRefresh(queryClient);
  };

  const {
    allSelectableIds,
    allSelected,
    buildBuyEpsPayload,
    bulkPurchaseMode,
    buyAllFastTicketCount,
    buyAllIds,
    buyAllModalOpen,
    buyAllRewardPreview,
    buyAllRewardPreviewLoading,
    buyAllTotal,
    buyLoading,
    canEpisodePayWithFreecoin,
    closeBuyAllConfirmModal,
    closeManualBuyConfirmModal,
    closeModal,
    episodesData,
    expandedGroups,
    fastPayWith,
    formatFreeUntil,
    formatPromotionRewardDate,
    getEpisodesForSelectionMode,
    getProgressiveSelectableIds,
    handleBuyAllClick,
    handleBuyEarlyAccessClick,
    hasEarlyAccessEpisodes,
    isEpisodeBaseSelectable,
    isEpisodeSequentiallyUnlocked,
    isFetching,
    isModalOpen,
    manualBuyConfirmModalOpen,
    manualRewardPreview,
    manualRewardPreviewLoading,
    openManualBuyConfirmModal,
    openModal,
    payWith,
    previewPromotionRewards,
    promotionRewards,
    selectedEpisodeIds,
    selectedSummary,
    selectionModalMode,
    setBuyAllIds,
    setBuyLoading,
    setFastPayWith,
    setPayWith,
    setSelectedEpisodeIds,
    setShowSuccess,
    showSuccess,
    toggleEpisode,
    toggleGroup,
    toggleGroupSelect,
    toggleSelectAll,
  } = useBookInfoCardPurchaseState({
    book,
    bookId,
    token,
    isLoggedIn,
    openLoginModal,
    messageApi,
  });

  const notifyRpEarned = (rpEarned?: number) => {
    if (!rpEarned || rpEarned <= 0) return;

    notification.success({
      message: "ยินดีด้วย!",
      description: (
        <div className="flex items-center gap-1">
          <span>คุณได้รับ {rpEarned}</span>
          {settings?.rp ? (
            <Image src={settings.rp} alt="RP" width={16} height={16} unoptimized className="object-contain" />
          ) : (
            <span>RP</span>
          )}
        </div>
      ),
      placement: "topRight",
    });
  };

  const refreshAuthToken = async () => {
    try {
      const refreshRes = await refreshToken();
      if (refreshRes?.data?.token) updateToken(refreshRes.data.token);
    } catch {
      // Purchase succeeded; token refresh is best-effort.
    }
  };

  const handleBuyPromotion = async () => {
    if (buyLoading) return;
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!book.promotion?.id) {
      messageApi.error("ไม่พบข้อมูลโปรโมชั่น");
      return;
    }
    const promotion = book.promotion;

    modalApi.confirm({
      title: "ยืนยันการซื้อโปรโมชั่น",
      content: (
        <div>
          <div>คุณต้องการซื้อโปรโมชั่น &quot;{book.promotion.title}&quot; หรือไม่?</div>
          <div className="mt-2 flex">
            ราคาโปรโมชั่น:
            <b className="mr-2 flex text-red-600">{book.promotion.price.toLocaleString()}</b>
            <Image src="/images/e-coin.png" alt="Coin" width={24} height={24} />
          </div>
        </div>
      ),
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      okButtonProps: { className: "!bg-red-600 hover:!bg-red-700 !border-red-600 !text-white" },
      onOk: async () => {
        try {
          setBuyLoading(true);
          const res = await buyGroupPromotionMutation.mutateAsync({
            dfb_id: promotion.id,
            payWith: "coin",
          });

          if (res?.code !== 200) {
            messageApi.error(res?.message || "ไม่สามารถทำการซื้อได้");
            return;
          }

          log("buy_promotion", "book", String(bookId), {
            promotion_id: book.promotion?.id,
            price: book.promotion?.price,
            promotion_title: book.promotion?.title,
            book_title: book?.title,
          });

          setShowSuccess(true);
          refreshNavbarRank();

          const newToken = res.data?.token;
          if (!newToken) return;

          const decoded = decodeToken(newToken);
          if (user && book.promotion?.price) {
            const expectedCoin = (Number(user.coin) || 0) - (Number(book.promotion.price) || 0);
            const tokenCoin = Number(decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0);
            const finalCoin = tokenCoin > expectedCoin ? expectedCoin : tokenCoin;
            useAuthStore.getState().login({ ...user, ...decoded, coin: finalCoin }, newToken);
          } else {
            updateToken(newToken);
          }
        } catch (error: any) {
          messageApi.error(error?.response?.data?.message || error?.message || "เกิดข้อผิดพลาดขณะซื้อ");
        } finally {
          setBuyLoading(false);
        }
      },
      onCancel: () => setBuyLoading(false),
    });
  };

  const handleConfirmManualPurchase = async () => {
    try {
      setBuyLoading(true);
      const payload = buildBuyEpsPayload(selectedEpisodeIds, payWith, fastPayWith);
      const res = await buyEpisodesMutation.mutateAsync(payload);

      if (res?.code !== 200) {
        messageApi.error(res?.message || "ไม่สามารถทำการซื้อได้");
        return;
      }

      log("buy_episode", "book", String(bookId), {
        episodes_count: selectedEpisodeIds.length,
        total: selectedSummary.total,
        method: payWith,
        book_title: book?.title,
      });

      setShowSuccess(true);
      refreshNavbarRank();
      notifyRpEarned(res.data?.rp_earned);

      if (res.data?.token) {
        updateToken(res.data.token);
      } else {
        await refreshAuthToken();
      }

      closeManualBuyConfirmModal();
      closeModal();
      setSelectedEpisodeIds([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "เกิดข้อผิดพลาดขณะซื้อ");
    } finally {
      setBuyLoading(false);
    }
  };

  const handleConfirmBuyAllPurchase = async () => {
    try {
      if (buyAllFastTicketCount > 0 && payWith === "freecoin") {
        messageApi.error("ตอนล่วงหน้าต้องใช้ FastTicket + เหรียญ");
        return;
      }

      setBuyLoading(true);
      const payload = buildBuyEpsPayload(buyAllIds, payWith, fastPayWith);
      const res = await buyEpisodesMutation.mutateAsync(payload);

      if (res?.code !== 200) {
        messageApi.error(res?.message || "ไม่สามารถทำการซื้อได้");
        return;
      }

      log("buy_episode", "book", String(bookId), {
        episodes_count: buyAllIds.length,
        total: buyAllTotal,
        method: payWith,
        buy_all: true,
        book_title: book?.title,
      });

      setShowSuccess(true);
      refreshNavbarRank();
      notifyRpEarned(res.data?.rp_earned);

      const newToken = res.data?.token;
      if (newToken) {
        const decoded = decodeToken(newToken);

        if (user) {
          let finalCoin = Number(decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0);
          let finalFreeCoin = Number(decoded.freecoin ?? 0);

          if (payWith === "coin") {
            const expectedCoin = (Number(user.coin) || 0) - buyAllTotal;
            if (finalCoin > expectedCoin) finalCoin = expectedCoin;
          } else if (payWith === "freecoin") {
            const expectedFreeCoin = (Number(user.freecoin) || 0) - buyAllTotal;
            if (finalFreeCoin > expectedFreeCoin) finalFreeCoin = expectedFreeCoin;
          }

          useAuthStore.getState().login(
            {
              ...user,
              ...decoded,
              coin: finalCoin >= 0 ? finalCoin : 0,
              freecoin: finalFreeCoin >= 0 ? finalFreeCoin : 0,
            },
            newToken,
          );
        } else {
          updateToken(newToken);
        }
      } else {
        await refreshAuthToken();
      }

      closeBuyAllConfirmModal();
      setBuyAllIds([]);
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "เกิดข้อผิดพลาดขณะซื้อ");
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <aside className="w-full">
      <div className="sticky top-4 space-y-4">
        <BookInfoCardWalletSection
          isLoggedIn={isLoggedIn}
          user={user}
          book={book}
          onLoginNeeded={openLoginModal}
        />

        <BookInfoCardPurchasePanel
          book={book}
          user={user}
          settings={settings}
          isDeleted={isDeleted}
          isLoggedIn={isLoggedIn}
          buyLoading={buyLoading}
          hasEarlyAccessEpisodes={hasEarlyAccessEpisodes}
          promotionRewards={promotionRewards}
          previewPromotionRewards={previewPromotionRewards}
          onBuyPromotion={handleBuyPromotion}
          onBuyAllClick={handleBuyAllClick}
          onBuyEarlyAccessClick={handleBuyEarlyAccessClick}
          onOpenManualSelection={() => openModal("all")}
          formatPromotionRewardDate={formatPromotionRewardDate}
        />

        {!isDeleted && (
          <>
            <BookInfoCardPurchaseModals
              book={book}
              settings={settings}
              isSelectionOpen={isModalOpen}
              isFetchingEpisodes={isFetching}
              selectionModalMode={selectionModalMode}
              episodesData={episodesData}
              expandedGroups={expandedGroups}
              selectedEpisodeIds={selectedEpisodeIds}
              selectedSummary={selectedSummary}
              allSelectableIds={allSelectableIds}
              allSelected={allSelected}
              payWith={payWith}
              fastPayWith={fastPayWith}
              manualConfirmOpen={manualBuyConfirmModalOpen}
              manualRewardPreviewLoading={manualRewardPreviewLoading}
              manualRewardPreview={manualRewardPreview}
              buyAllConfirmOpen={buyAllModalOpen}
              buyAllIds={buyAllIds}
              buyAllTotal={buyAllTotal}
              buyAllFastTicketCount={buyAllFastTicketCount}
              buyAllRewardPreviewLoading={buyAllRewardPreviewLoading}
              buyAllRewardPreview={buyAllRewardPreview}
              bulkPurchaseMode={bulkPurchaseMode}
              buyLoading={buyLoading}
              hasEarlyAccessEpisodes={hasEarlyAccessEpisodes}
              onCloseSelection={closeModal}
              onToggleSelectAll={toggleSelectAll}
              onOpenManualConfirm={openManualBuyConfirmModal}
              onToggleGroup={toggleGroup}
              onToggleGroupSelect={toggleGroupSelect}
              onToggleEpisode={toggleEpisode}
              onCloseManualConfirm={closeManualBuyConfirmModal}
              onConfirmManualPurchase={handleConfirmManualPurchase}
              onCloseBuyAllConfirm={closeBuyAllConfirmModal}
              onConfirmBuyAllPurchase={handleConfirmBuyAllPurchase}
              onPayWithChange={setPayWith}
              onFastPayWithChange={setFastPayWith}
              getEpisodesForSelectionMode={getEpisodesForSelectionMode}
              getProgressiveSelectableIds={getProgressiveSelectableIds}
              canEpisodePayWithFreecoin={canEpisodePayWithFreecoin}
              isEpisodeSequentiallyUnlocked={isEpisodeSequentiallyUnlocked}
              isEpisodeBaseSelectable={isEpisodeBaseSelectable}
              formatFreeUntil={formatFreeUntil}
            />

            <div className="my-5 hidden border-t border-gray-200 lg:block" />
          </>
        )}
      </div>

      {showSuccess && (
        <SuccessAnimation
          onComplete={async () => {
            setShowSuccess(false);
            await queryClient.invalidateQueries({ queryKey: queryKeys.book.episodes(bookId) });
            await queryClient.invalidateQueries({ queryKey: queryKeys.book.detail(bookId) });
            refreshNavbarRank();
          }}
        />
      )}

      <BookInfoCardPurchaseStyles />
    </aside>
  );
};

export default BookInfoCard;
