import { useEffect } from "react";

type UseReaderPageEffectsParams = {
  isListPopoverOpen: boolean;
  bookTitle?: string | null;
  displayTitle?: string | null;
};

export function useReaderPageEffects({
  isListPopoverOpen,
  bookTitle,
  displayTitle,
}: UseReaderPageEffectsParams) {
  useEffect(() => {
    if (!isListPopoverOpen) return;

    const timerId = window.setTimeout(() => {
      const container = document.getElementById("episode-list-container");
      const activeItem = document.getElementById("active-episode-item");

      if (container && activeItem) {
        const containerHeight = container.clientHeight;
        const itemHeight = activeItem.clientHeight;

        const containerRect = container.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();
        const relativeTop = itemRect.top - containerRect.top;
        const currentScrollTop = container.scrollTop;
        const newScrollTop = currentScrollTop + relativeTop - (containerHeight / 2) + (itemHeight / 2);
        container.scrollTo({ top: newScrollTop, behavior: "smooth" });
      }
    }, 100);

    return () => window.clearTimeout(timerId);
  }, [isListPopoverOpen]);

  useEffect(() => {
    if (bookTitle) {
      document.title = displayTitle ? `${displayTitle} - ${bookTitle} | EnjoyBook` : `${bookTitle} | EnjoyBook`;
    } else {
      document.title = "EnjoyBook - อ่านนิยายออนไลน์";
    }
  }, [bookTitle, displayTitle]);

  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const disableDevTools = (e: KeyboardEvent) => {
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", disableDevTools);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", disableDevTools);
    };
  }, []);
}
