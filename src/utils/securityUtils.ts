import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';

export const decryptContent = (cipherText: string): any => {
  try {
    const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY || 'ไม่บอก';
    const bytes = AES.decrypt(cipherText, secretKey);
    const decryptedData = bytes.toString(encUtf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const detectExtension = (onDetect?: () => void) => {
  if (typeof window === 'undefined') return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target === document.body && mutation.removedNodes?.length > 0) {
        const removedNode = mutation.removedNodes[0];
        if (
          (removedNode.nodeName === 'DIV' && (removedNode as HTMLElement).id === 'root') ||
          removedNode.nodeName === 'NEXT-ROUTE-ANNOUNCER'
        ) {
          if (onDetect) onDetect();
          window.location.href = '/';
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
