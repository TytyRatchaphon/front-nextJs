"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type ClipboardEvent as ReactClipboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { App } from "antd";
import parse from "html-react-parser";
import { queryKeys } from "@/constants/query";
import { BackToTopButton } from "@/components/utility/BackToTopButton";
import EpisodeCommentSection from "@/components/bookdetail/EpisodeCommentSection";
import { modifiedHtml, addParagraphIndexes, obfuscateClipboardText, obfuscateHtmlTextNodes } from "@/utils/htmlUtils";
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { fetchBookDetail, fetchHasPaymentHistory } from "@/services/apiServices";
import { useAuthStore, AuthState } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import '@/utils/imageUtils';

// Hooks
import { useContentProtection } from "@/hooks/reader/useContentProtection";
import { useReaderLifecycle } from "./hooks/useReaderLifecycle";
import { useReadFreeQuota } from "@/hooks/reader/useReadFreeQuota";
import { useLogger } from "@/hooks/useLogger";
import { getReadEpisodePurchaseState } from "./purchaseUtils";
import {
  READER_TOGGLE_IGNORE_SELECTOR,
} from "./readerContentUtils";
import { fetchEpisodeContent } from "./readerApi";
import { useEpisodeBookmarks } from "./hooks/useEpisodeBookmarks";
import { useReadEpisodePurchase } from "./hooks/useReadEpisodePurchase";
import { useReadEpisodeList } from "./hooks/useReadEpisodeList";
import { useReadScheduledRelease } from "./hooks/useReadScheduledRelease";
import { useReaderParagraphTracking } from "./hooks/useReaderParagraphTracking";
import { useReaderObfuscationAssets } from "./hooks/useReaderObfuscationAssets";
import { useReaderPageEffects } from "./hooks/useReaderPageEffects";
import { ReadStickyEpisodeNav } from "./components/ReadStickyEpisodeNav";
import { ReadQuotaModals } from "./components/ReadQuotaModals";
import { ReadConfirmPurchaseModal } from "./components/ReadConfirmPurchaseModal";
import { ReadBookmarkModal } from "./components/ReadBookmarkModal";
import { ReaderContentArea } from "./components/ReaderContentArea";
import { ReaderTopBar } from "./components/ReaderTopBar";
import { ReadEpisodeSidebarDrawer } from "./components/ReadEpisodeSidebarDrawer";
import { ReaderGlobalStyles } from "./components/ReaderGlobalStyles";
import { ReadEpisodeErrorState, ReadEpisodeLoadingState } from "./components/ReadEpisodeStatusStates";
import { ReadConflictModal } from "./components/ReadConflictModal";

type Props = {
  bookId: string;
  episodeId: string;
};

export default function ReadEpisodePage({ bookId, episodeId: routeEpisodeId }: Props) {
  const { settings } = useWebsiteSettings();
  const router = useRouter();
  const [episodeId, setEpisodeId] = useState(routeEpisodeId);
  const { user } = useAuthStore();
  const isLoggedIn = useAuthStore((s: AuthState) => s.isLoggedIn);
  const openLoginModal = useUIStore((s: any) => s.openLoginModal);
  const { notification } = App.useApp();

  // --- 1. Fetch Data ---
  const {
    data: episode,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.read.episodeContent(episodeId),
    queryFn: () => fetchEpisodeContent(episodeId),
    enabled: !!episodeId,
    // staleTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const { data: bookDetail } = useQuery({
    queryKey: queryKeys.book.detail(bookId),
    queryFn: () => fetchBookDetail(bookId),
    enabled: !!bookId,
    // staleTime: 10 * 60 * 1000,
    // retry: 2,
  });

  const {
    bookmarks,
    isFetchingBookmarks,
    isBookmarkPopoverOpen,
    setIsBookmarkPopoverOpen,
    bookmarkModalOpen,
    bookmarkNote,
    setBookmarkNote,
    bookmarkParagraphIndex,
    editingBookmarkId,
    isSavingBookmark,
    resetBookmarkEditorState,
    openBookmarkModalAtIndex,
    openEditBookmarkModal,
    handleDeleteBookmark,
    submitBookmarkModal,
  } = useEpisodeBookmarks({
    bookId,
    episodeId,
    isLoggedIn,
    notification,
  });

  // --- 2. Custom Hooks ---
  const innerContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  const handleProtectionBlur = useCallback(() => {
    if (innerContentRef.current) {
      setContentHeight(innerContentRef.current.clientHeight);
    }
  }, []);

  const { isFocused, setIsFocused } = useContentProtection(episode, handleProtectionBlur, true);

  const {
    contentRef,
    showNav,
    setShowNav,
    isConflict,
    conflictData,
    takeover,
    fetchSessions
  } = useReaderLifecycle(bookId, episodeId, user);

  const shouldShowContent = isFocused && !isConflict;

  const {
    fontSize, setFontSize,
    fontFamily, setFontFamily,
    bgColor, setBgColor,
    textColorKey, setTextColorKey,
    themeTextColors,
    isBold, setIsBold,
    textAlign, setTextAlign,
    isAutoScroll, setIsAutoScroll,
    scrollSpeed, setScrollSpeed,
    currentBg, currentFontFamily,
    fontFamilies, bgColors,
    readerDefaultFontKey,
    hasReaderObfuscationConfig,
    isReaderAssetsReady,
  } = useReaderObfuscationAssets({
    contentRef,
    episodeId,
    episode,
  });

  const renderedEpisodeHtml = useMemo(() => {
    const rawDes = episode?.des;
    const rawContent = episode?.content;
    const rawHtml = typeof rawDes === "string"
      ? rawDes
      : (typeof rawContent === "string" ? rawContent : "");
    if (!rawHtml) return '';
    if (hasReaderObfuscationConfig) {
      return addParagraphIndexes(rawHtml).html;
    }
    const normalizedHtml = modifiedHtml(rawHtml, currentFontFamily?.family || "var(--font-sarabun), sans-serif", user);
    const indexedHtml = addParagraphIndexes(normalizedHtml).html;
    return obfuscateHtmlTextNodes(indexedHtml);
  }, [episode?.des, episode?.content, hasReaderObfuscationConfig, currentFontFamily?.family, user]);

  const parsedRenderedEpisodeHtml = useMemo(
    () => (renderedEpisodeHtml ? parse(renderedEpisodeHtml) : null),
    [renderedEpisodeHtml]
  );

  const shouldDelayObfuscatedRender = hasReaderObfuscationConfig
    && Boolean(renderedEpisodeHtml)
    && !isReaderAssetsReady;


  const {
    selectedParagraphIndex,
    setSelectedParagraphIndex,
    trackedParagraphIndex,
    showTrackedParagraphLabel,
    setShowTrackedParagraphLabel,
    showTrackedParagraphArrow,
    setShowTrackedParagraphArrow,
    getCurrentParagraphIndex,
    scrollToParagraph,
  } = useReaderParagraphTracking({
    contentRootRef: innerContentRef,
    isFocused: shouldShowContent,
    renderedEpisodeHtml,
    bookmarks,
    notification,
    onCloseBookmarkPopover: () => setIsBookmarkPopoverOpen(false),
  });

  const shouldIgnoreReaderToggle = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(READER_TOGGLE_IGNORE_SELECTOR));
  };

  const handleProtectedCopy = (event: ReactClipboardEvent<HTMLDivElement>) => {
    const selectedText = window.getSelection()?.toString() || '';
    if (!selectedText.trim()) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    event.clipboardData.setData('text/plain', obfuscateClipboardText(selectedText));
  };

  const handleReaderSurfaceClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (shouldIgnoreReaderToggle(event.target)) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    if (!isFocused) {
      setIsFocused(true);
      return;
    }

    setShowNav((prev) => !prev);
  };

  const openCreateBookmarkModal = () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    const idx = getCurrentParagraphIndex();
    if (!idx) {
      notification.warning({ message: 'ไม่พบย่อหน้าปัจจุบัน', placement: 'topRight' });
      return;
    }

    openBookmarkModalAtIndex(idx);
  };

  const openCreateBookmarkModalByIndex = (paragraphIndex: number) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    openBookmarkModalAtIndex(paragraphIndex);
  };

  const {
    episodesData,
    displayTitle,
    prevEpId,
    nextEpId,
    currentEpisodeId,
    episodeGroups,
    currentEpisodeMeta,
    isCurrentEpisodeSequentiallyUnlocked,
    isGroupExpanded,
    toggleGroupExpanded,
    collapseAllGroups,
  } = useReadEpisodeList({
    bookId,
    episodeId,
    episode,
  });

  const purchaseState = useMemo(
    () => getReadEpisodePurchaseState(
      episode as any,
      (bookDetail as any)?.use_freecoin,
      { isSequentialUnlocked: isCurrentEpisodeSequentiallyUnlocked },
    ),
    [episode, bookDetail, isCurrentEpisodeSequentiallyUnlocked]
  );

  const {
    scheduledPublishAt,
    isScheduledReleasePending,
    scheduledReleaseCountdown,
  } = useReadScheduledRelease({
    bookId,
    episodeId,
    episodePublishDatetime: (episode as any)?.publish_datetime,
    currentEpisodePublishDatetime: currentEpisodeMeta?.publishDatetime,
  });

  const isCurrentEpisodeOwned = Boolean((currentEpisodeMeta as any)?.isBuy ?? (episode as any)?.isBuy);
  const canTrackFreeReadQuota = Boolean(episode && renderedEpisodeHtml);
  const freeReadQuota = useReadFreeQuota({
    bookId,
    episodeId,
    isLoggedIn,
    userId: user?.user_id,
    canTrack: canTrackFreeReadQuota,
    isEpisodeOwned: isCurrentEpisodeOwned,
  });

  const hasReachedMemberFreeLimit =
    isLoggedIn &&
    freeReadQuota.limit > 0 &&
    freeReadQuota.currentCount >= freeReadQuota.limit;
  const isQuotaHardBlocked = freeReadQuota.isBlocked && freeReadQuota.reason === "guest-limit";

  const shouldCheckPaymentHistory =
    hasReachedMemberFreeLimit &&
    Boolean(user?.user_id) &&
    !freeReadQuota.hasShownTopupPrompt;

  const { data: hasPaymentHistory } = useQuery({
    queryKey: queryKeys.user.hasPaymentHistory(user?.user_id),
    queryFn: fetchHasPaymentHistory,
    enabled: shouldCheckPaymentHistory,
    staleTime: 5 * 60 * 1000,
  });

  // --- 2.5 Activity Logging ---
  const { log } = useLogger();

  useEffect(() => {
    if (episode && bookId && episodeId) {
      const epName = (episode as any)?.name || displayTitle || '';
      const bookTitle = (bookDetail as any)?.title || '';
      const startTime = Date.now();

      return () => {
        const duration = Math.round((Date.now() - startTime) / 1000 * 10) / 10;
        log('read_page', 'book', bookId, {
          name: epName,
          book_title: bookTitle,
          episode_id: episodeId,
        }, duration);
      };
    }
  }, [episode, bookId, episodeId, bookDetail, displayTitle, log]);

  // --- 3. Local State for UI ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListPopoverOpen, setIsListPopoverOpen] = useState(false);
  const [quotaLoginModalOpen, setQuotaLoginModalOpen] = useState(false);
  const [firstTopupModalOpen, setFirstTopupModalOpen] = useState(false);
  const allowTemporaryTextSelection = false;

  const {
    confirmOpen,
    setConfirmOpen,
    confirmMethod,
    setConfirmMethod,
    confirmFastMethod,
    setConfirmFastMethod,
    confirmAmount,
    setConfirmAmount,
    buyLoading,
    rewardPreview,
    rewardPreviewLoading,
    cancelHover,
    setCancelHover,
    openConfirm,
    handleBuy,
  } = useReadEpisodePurchase({
    bookId,
    episodeId,
    episode,
    displayTitle,
    isLoggedIn,
    openLoginModal,
    notification,
    purchaseState,
    rpImageUrl: settings?.rp,
    hasEpisodePurchaseReward: (bookDetail as any)?.ep_purchase_reward?.has_promotion === true,
    log,
  });

  // --- 4. Effects ---
  useEffect(() => {
    if (routeEpisodeId) {
      setEpisodeId(routeEpisodeId);
    }
  }, [routeEpisodeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = () => {
      const pathMatch = window.location.pathname.match(/^\/read\/([^/]+)\/([^/?#]+)/);
      if (!pathMatch) return;

      const [, pathBookId, pathEpisodeId] = pathMatch;
      const normalizedBookId = decodeURIComponent(pathBookId);
      if (normalizedBookId !== String(bookId)) return;

      const normalizedEpisodeId = decodeURIComponent(pathEpisodeId);
      setEpisodeId((prev) => (prev === normalizedEpisodeId ? prev : normalizedEpisodeId));
      window.scrollTo({ top: 0, behavior: "auto" });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [bookId]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const navigateToEpisode = useCallback(
    (nextEpisodeId: string | number, options?: { closeList?: boolean; closeSidebar?: boolean }) => {
      if (!nextEpisodeId || !bookId) return;

      const normalizedEpisodeId = String(nextEpisodeId);
      if (normalizedEpisodeId === String(episodeId)) {
        if (options?.closeList) setIsListPopoverOpen(false);
        if (options?.closeSidebar) setIsSidebarOpen(false);
        return;
      }

      const nextPath = `/read/${bookId}/${normalizedEpisodeId}`;
      if (typeof window !== "undefined" && window.location.pathname !== nextPath) {
        window.history.pushState({ bookId, episodeId: normalizedEpisodeId }, "", nextPath);
      }

      if (options?.closeList) setIsListPopoverOpen(false);
      if (options?.closeSidebar) setIsSidebarOpen(false);
      setEpisodeId(normalizedEpisodeId);
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    [bookId, episodeId]
  );

  useEffect(() => {
    if (isQuotaHardBlocked && !isLoggedIn) {
      setQuotaLoginModalOpen(true);
    }
  }, [isQuotaHardBlocked, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn && quotaLoginModalOpen) {
      return;
    }
    if (isLoggedIn && quotaLoginModalOpen) {
      setQuotaLoginModalOpen(false);
    }
  }, [isLoggedIn, quotaLoginModalOpen]);

  useEffect(() => {
    if (hasReachedMemberFreeLimit && hasPaymentHistory === false && !freeReadQuota.hasShownTopupPrompt) {
      setFirstTopupModalOpen(true);
      freeReadQuota.markTopupPromptShown();
    }
  }, [
    hasReachedMemberFreeLimit,
    freeReadQuota.hasShownTopupPrompt,
    freeReadQuota.markTopupPromptShown,
    hasPaymentHistory,
  ]);

  useReaderPageEffects({
    isListPopoverOpen,
    bookTitle: bookDetail?.title,
    displayTitle,
  });

  const readerPopoverZIndex = 1200;

  if (isLoading && !episode) {
    return <ReadEpisodeLoadingState currentBg={currentBg} />;
  }

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : "ไม่สามารถโหลดเนื้อหาได้";
    const is401Error = errorMessage.includes("ไม่พบตอน") || errorMessage.includes("ไม่มีสิทธิ์");
    return (
      <ReadEpisodeErrorState
        errorMessage={errorMessage}
        isAccessError={is401Error}
        onBack={() => router.back()}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div
      className={`min-h-screen ${currentBg?.bg} ${currentBg?.text} transition-colors duration-300 ${allowTemporaryTextSelection ? '' : 'select-none'} ${currentBg?.key === 'dark' ? 'reader-theme-dark' : 'reader-theme-light'}`}
      style={{ userSelect: allowTemporaryTextSelection ? "text" : "none", minHeight: "100vh" }}
      onCopy={handleProtectedCopy}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ReadEpisodeSidebarDrawer
        open={isSidebarOpen}
        episodeGroups={episodeGroups}
        currentEpisodeId={currentEpisodeId}
        isGroupExpanded={isGroupExpanded}
        toggleGroupExpanded={toggleGroupExpanded}
        onNavigateToEpisode={navigateToEpisode}
        onClose={closeSidebar}
      />

      <main className={`${currentBg?.bg} min-h-screen pb-20`}>
        <div className="min-h-[500px] p-4 flex flex-col items-center">
          <div
            className={`min-h-[1000px] rounded-md w-full lg:max-w-[1000px] ${currentBg?.paper || currentBg?.bg} ${currentBg?.text} shadow-lg relative flex flex-col ${showNav ? "reader-nav-visible" : "reader-nav-hidden"}`}
            onClick={handleReaderSurfaceClick}
          >
            <ReaderTopBar
              bookId={bookId}
              displayTitle={displayTitle || ""}
              currentBg={currentBg}
              zIndex={readerPopoverZIndex}
              episodeGroups={episodeGroups}
              currentEpisodeId={currentEpisodeId}
              isGroupExpanded={isGroupExpanded}
              toggleGroupExpanded={toggleGroupExpanded}
              collapseAllGroups={collapseAllGroups}
              onNavigateToEpisode={navigateToEpisode}
              isListPopoverOpen={isListPopoverOpen}
              onListPopoverOpenChange={setIsListPopoverOpen}
              fontSize={fontSize}
              setFontSize={setFontSize}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              bgColor={bgColor}
              setBgColor={setBgColor}
              textColorKey={textColorKey}
              setTextColorKey={setTextColorKey}
              themeTextColors={themeTextColors}
              isBold={isBold}
              setIsBold={setIsBold}
              textAlign={textAlign}
              setTextAlign={setTextAlign}
              isAutoScroll={isAutoScroll}
              setIsAutoScroll={setIsAutoScroll}
              scrollSpeed={scrollSpeed}
              setScrollSpeed={setScrollSpeed}
              fontFamilies={fontFamilies}
              bgColors={bgColors}
              readerDefaultFontKey={readerDefaultFontKey}
              hasReaderObfuscationConfig={hasReaderObfuscationConfig}
              showTrackedParagraphLabel={showTrackedParagraphLabel}
              setShowTrackedParagraphLabel={setShowTrackedParagraphLabel}
              showTrackedParagraphArrow={showTrackedParagraphArrow}
              setShowTrackedParagraphArrow={setShowTrackedParagraphArrow}
              isBookmarkPopoverOpen={isBookmarkPopoverOpen}
              onBookmarkPopoverOpenChange={setIsBookmarkPopoverOpen}
              bookmarks={bookmarks}
              isFetchingBookmarks={isFetchingBookmarks}
              onCreateBookmark={openCreateBookmarkModal}
              onEditBookmark={openEditBookmarkModal}
              onDeleteBookmark={handleDeleteBookmark}
              onScrollToParagraph={scrollToParagraph}
            />

            <ReaderContentArea
              contentRef={contentRef}
              innerContentRef={innerContentRef}
              allowTemporaryTextSelection={allowTemporaryTextSelection}
              renderedEpisodeHtml={renderedEpisodeHtml}
              parsedRenderedEpisodeHtml={parsedRenderedEpisodeHtml}
              isQuotaHardBlocked={isQuotaHardBlocked}
              fontSize={fontSize}
              currentFontFamily={currentFontFamily}
              isBold={isBold}
              textAlign={textAlign}
              isFocused={shouldShowContent}
              contentHeight={contentHeight}
              shouldDelayObfuscatedRender={shouldDelayObfuscatedRender}
              episode={episode}
              settings={settings}
              isScheduledReleasePending={isScheduledReleasePending}
              purchaseState={purchaseState}
              scheduledPublishAt={scheduledPublishAt}
              scheduledReleaseCountdown={scheduledReleaseCountdown}
              currentBgKey={currentBg?.key}
              onLogin={openLoginModal}
              onGoStore={() => router.push('/store')}
              onOpenConfirm={openConfirm}
              selectedParagraphIndex={selectedParagraphIndex}
              onCreateBookmarkAtParagraph={openCreateBookmarkModalByIndex}
              onClearSelectedParagraph={() => setSelectedParagraphIndex(null)}
              showTrackedParagraphLabel={showTrackedParagraphLabel}
              trackedParagraphIndex={trackedParagraphIndex}
            />

            <ReadStickyEpisodeNav
              showNav={showNav}
              currentBg={currentBg}
              prevEpId={prevEpId}
              nextEpId={nextEpId}
              bookId={bookId}
              episodeId={episodeId}
              navigateToEpisode={navigateToEpisode}
              log={log}
            />

            

            {/* Comment Section */}
            {episodeId && (
              <div className="px-4 pb-8" data-reader-ignore-toggle="true">
                <EpisodeCommentSection episodeId={episodeId} theme={currentBg} />
              </div>
            )}
          </div>
        </div>
      </main>

      <BackToTopButton />
      <ReadQuotaModals
        quotaLoginModalOpen={quotaLoginModalOpen}
        firstTopupModalOpen={firstTopupModalOpen}
        onQuotaLoginClose={() => setQuotaLoginModalOpen(false)}
        onFirstTopupClose={() => setFirstTopupModalOpen(false)}
        onLogin={openLoginModal}
        onGoHome={() => router.push("/")}
        onGoStore={() => router.push("/store")}
      />
      <ReadConfirmPurchaseModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        displayTitle={displayTitle}
        episode={episode}
        settings={settings}
        confirmMethod={confirmMethod}
        setConfirmMethod={setConfirmMethod}
        confirmFastMethod={confirmFastMethod}
        setConfirmFastMethod={setConfirmFastMethod}
        confirmAmount={confirmAmount}
        setConfirmAmount={setConfirmAmount}
        purchaseState={purchaseState}
        buyLoading={buyLoading}
        rewardPreview={rewardPreview}
        rewardPreviewLoading={rewardPreviewLoading}
        cancelHover={cancelHover}
        setCancelHover={setCancelHover}
        handleBuy={handleBuy}
      />
      <ReadBookmarkModal
        open={bookmarkModalOpen}
        editingBookmarkId={editingBookmarkId}
        bookmarkParagraphIndex={bookmarkParagraphIndex}
        bookmarkNote={bookmarkNote}
        isSavingBookmark={isSavingBookmark}
        onNoteChange={setBookmarkNote}
        onCancel={resetBookmarkEditorState}
        onSubmit={submitBookmarkModal}
      />
      <ReadConflictModal
        open={isConflict}
        bookId={bookId}
        conflictData={conflictData}
        onTakeover={takeover}
        onRefreshList={fetchSessions}
      />
      <ReaderGlobalStyles />
    </div>
  );
}
