import { useEffect, useState } from 'react';
import { detectExtension } from "@/utils/securityUtils";

export function useContentProtection(episodeData: any, onBlur?: () => void) {
    const [isFocused, setIsFocused] = useState(true);

    useEffect(() => {
        const disableRightClick = (e: MouseEvent) => {
            e.preventDefault();
        };

        const protectContent = () => {
            const noop = () => { };
            if (typeof window !== "undefined" && process.env.NODE_ENV !== "development") {
                (window as any).console.log = noop;
                (window as any).console.info = noop;
                (window as any).console.warn = noop;
                (window as any).console.error = noop;
                (window as any).console.debug = noop;
            }

            const originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tagName: string) {
                if (typeof tagName === "string" && tagName.toLowerCase() === "iframe") {
                    throw new Error("iframe creation is not allowed on this page");
                }
                return originalCreateElement(tagName);
            } as any;

            const blockIframeInsertion = () => {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1 && (node as Element).tagName === "IFRAME") {
                                node.parentNode?.removeChild(node);
                            }
                        });
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                });

                return observer;
            };

            const iframeObserver = blockIframeInsertion();

            const originalAppendChild = Node.prototype.appendChild;
            Node.prototype.appendChild = function (this: Node, child: any) {
                if (child?.tagName === "IFRAME") {
                    throw new Error("iframe insertion is not allowed");
                }
                return originalAppendChild.call(this, child);
            } as any;

            const originalInsertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function (this: Node, newNode: any, refNode: any) {
                if (newNode?.tagName === "IFRAME") {
                    throw new Error("iframe insertion is not allowed");
                }
                return originalInsertBefore.call(this, newNode, refNode);
            } as any;

            const contentElements = document.querySelectorAll(".episode-content");
            contentElements.forEach((element) => {
                try {
                    const innerTextDesc = Object.getOwnPropertyDescriptor(element, "innerText");
                    const textContentDesc = Object.getOwnPropertyDescriptor(element, "textContent");

                    if (!innerTextDesc || innerTextDesc.configurable !== false) {
                        Object.defineProperty(element, "innerText", {
                            get: () => "⚠️ เนื้อหาได้รับการปกป้อง",
                            configurable: true,
                        });
                    }

                    if (!textContentDesc || textContentDesc.configurable !== false) {
                        Object.defineProperty(element, "textContent", {
                            get: () => "⚠️ เนื้อหาได้รับการปกป้อง",
                            configurable: true,
                        });
                    }
                } catch (error) {
                }
            });

            return () => {
                iframeObserver.disconnect();
            };
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
                event.key === 'F12' ||
                event.ctrlKey ||
                event.metaKey ||
                event.key === 'PrintScreen' ||
                event.keyCode === 44
            ) {
                event.preventDefault();
                handleWindowBlur();
                setTimeout(() => {
                    handleWindowFocus();
                }, 2000);
            }
        };

        const handleRightClick = (event: Event) => {
            event.preventDefault();
        };

        window.addEventListener('blur', handleWindowBlur);
        window.addEventListener('focus', handleWindowFocus);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleRightClick);

        document.addEventListener("contextmenu", disableRightClick);

        let cleanupProtection: (() => void) | undefined;
        const timer = setTimeout(() => {
            cleanupProtection = protectContent();
        }, 1000);

        // Assuming detectExtension is a utility that returns an observer or similar cleanup
        const extensionObserver = detectExtension();

        return () => {
            window.removeEventListener('blur', handleWindowBlur);
            window.removeEventListener('focus', handleWindowFocus);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleRightClick);

            document.removeEventListener("contextmenu", disableRightClick);
            clearTimeout(timer);
        };
    }, [episodeData]);

    return { isFocused, setIsFocused };
}
