export const detectExtension = (onDetect?: () => void) => {
  if (typeof window === "undefined") return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target === document.body && mutation.removedNodes?.length > 0) {
        const removedNode = mutation.removedNodes[0];
        if (
          (removedNode.nodeName === "DIV" && (removedNode as HTMLElement).id === "root") ||
          removedNode.nodeName === "NEXT-ROUTE-ANNOUNCER"
        ) {
          if (onDetect) onDetect();
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/";
        }
      }
    });
  });

  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  return observer;
};
