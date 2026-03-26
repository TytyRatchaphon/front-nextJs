import { useEffect, useState } from "react";
import { detectExtension } from "@/utils/securityUtils";

type DescriptorBackup = {
  element: Element;
  innerTextDesc?: PropertyDescriptor;
  textContentDesc?: PropertyDescriptor;
};

export function useContentProtection(episodeData: any, onBlur?: () => void) {
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
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

    const handleWindowBlur = () => {
      if (onBlur) onBlur();
      setIsFocused(false);
    };

    const handleWindowFocus = () => {
      setIsFocused(true);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "F12" ||
        event.ctrlKey ||
        event.metaKey ||
        event.key === "PrintScreen" ||
        event.keyCode === 44
      ) {
        event.preventDefault();
        handleWindowBlur();
        focusRestoreTimeout = window.setTimeout(() => {
          handleWindowFocus();
        }, 2000);
      }
    };

    const handleRightClick = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleRightClick);

    document.addEventListener("contextmenu", disableRightClick);

    const timer = window.setTimeout(() => {
      protectContent();
    }, 1000);

    extensionObserver = detectExtension();

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleRightClick);

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
  }, [episodeData, onBlur]);

  return { isFocused, setIsFocused };
}
