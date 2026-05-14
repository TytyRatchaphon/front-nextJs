import { useEffect, useState } from "react";
import { detectExtension } from "@/utils/securityUtils";

type DescriptorBackup = {
  element: Element;
  innerTextDesc?: PropertyDescriptor;
  textContentDesc?: PropertyDescriptor;
};

export function useContentProtection(episodeData: any, onBlur?: () => void, enabled = true) {
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsFocused(true);
      return;
    }

    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const noop = () => {};
    const originalConsole = {
      log: window.console.log,
      info: window.console.info,
      warn: window.console.warn,
      error: window.console.error,
      debug: window.console.debug,
    };
    const originalCreateElement = document.createElement.bind(document);
    const originalAppendChild = Node.prototype.appendChild;
    const originalInsertBefore = Node.prototype.insertBefore;
    const descriptorBackups: DescriptorBackup[] = [];

    let iframeObserver: MutationObserver | null = null;
    let extensionObserver: MutationObserver | undefined;
    let focusRestoreTimeout: number | null = null;

    const setFocusStateSafely = (next: boolean) => {
      setIsFocused((prev) => (prev === next ? prev : next));
    };

    const restoreDescriptors = () => {
      descriptorBackups.forEach(({ element, innerTextDesc, textContentDesc }) => {
        try {
          if (innerTextDesc) {
            Object.defineProperty(element, "innerText", innerTextDesc);
          } else {
            delete (element as { innerText?: string }).innerText;
          }

          if (textContentDesc) {
            Object.defineProperty(element, "textContent", textContentDesc);
          } else {
            delete (element as { textContent?: string }).textContent;
          }
        } catch {
          // Ignore descriptor restore failure
        }
      });

      descriptorBackups.length = 0;
    };

    const restorePatchedApis = () => {
      document.createElement = originalCreateElement as typeof document.createElement;
      Node.prototype.appendChild = originalAppendChild;
      Node.prototype.insertBefore = originalInsertBefore;

      if (process.env.NODE_ENV !== "development") {
        window.console.log = originalConsole.log;
        window.console.info = originalConsole.info;
        window.console.warn = originalConsole.warn;
        window.console.error = originalConsole.error;
        window.console.debug = originalConsole.debug;
      }
    };

    const isIframeElement = (node: Node | null | undefined): node is Element => {
      return Boolean(node && node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "IFRAME");
    };

    const protectContent = () => {
      if (process.env.NODE_ENV !== "development") {
        window.console.log = noop;
        window.console.info = noop;
        window.console.warn = noop;
        window.console.error = noop;
        window.console.debug = noop;
      }

      document.createElement = ((tagName: string, options?: ElementCreationOptions) => {
        if (typeof tagName === "string" && tagName.toLowerCase() === "iframe") {
          throw new Error("iframe creation is not allowed on this page");
        }
        return originalCreateElement(tagName, options);
      }) as typeof document.createElement;

      Node.prototype.appendChild = function <T extends Node>(this: Node, child: T): T {
        if (isIframeElement(child)) {
          throw new Error("iframe insertion is not allowed");
        }
        return originalAppendChild.call(this, child) as T;
      };

      Node.prototype.insertBefore = function <T extends Node>(
        this: Node,
        newNode: T,
        refNode: Node | null
      ): T {
        if (isIframeElement(newNode)) {
          throw new Error("iframe insertion is not allowed");
        }
        return originalInsertBefore.call(this, newNode, refNode) as T;
      };

      iframeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && (node as Element).tagName === "IFRAME") {
              node.parentNode?.removeChild(node);
            }
          });
        });
      });

      iframeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      const contentElements = document.querySelectorAll(".episode-content");
      contentElements.forEach((element) => {
        try {
          const innerTextDesc = Object.getOwnPropertyDescriptor(element, "innerText");
          const textContentDesc = Object.getOwnPropertyDescriptor(element, "textContent");
          descriptorBackups.push({ element, innerTextDesc, textContentDesc });

          if (!innerTextDesc || innerTextDesc.configurable !== false) {
            Object.defineProperty(element, "innerText", {
              get: () => "Content is protected",
              configurable: true,
            });
          }

          if (!textContentDesc || textContentDesc.configurable !== false) {
            Object.defineProperty(element, "textContent", {
              get: () => "Content is protected",
              configurable: true,
            });
          }
        } catch {
          // Ignore descriptor patch failure
        }
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = (event.key || "").toLowerCase();
      const isOsKey = key === "meta" || key === "os" || event.keyCode === 91 || event.keyCode === 92;
      const isDevtoolsShortcut =
        key === "f12"
        || event.keyCode === 123
        || (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))
        || (event.metaKey && event.altKey && ["i", "j", "c"].includes(key))
        || (event.ctrlKey && key === "u")
        || (event.metaKey && event.altKey && key === "u");

      if (isOsKey || isDevtoolsShortcut) {
        event.preventDefault();
        if (onBlur) onBlur();
        setFocusStateSafely(false);
        if (focusRestoreTimeout) {
          window.clearTimeout(focusRestoreTimeout);
        }
        focusRestoreTimeout = window.setTimeout(() => {
          setFocusStateSafely(true);
        }, 2000);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("contextmenu", disableRightClick);

    const timer = window.setTimeout(() => {
      protectContent();
    }, 1000);
    extensionObserver = detectExtension();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("contextmenu", disableRightClick);
      window.clearTimeout(timer);
      if (focusRestoreTimeout) {
        window.clearTimeout(focusRestoreTimeout);
      }
      extensionObserver?.disconnect();
      iframeObserver?.disconnect();
      restoreDescriptors();
      restorePatchedApis();
    };
  }, [episodeData, onBlur, enabled]);

  return { isFocused, setIsFocused };
}
