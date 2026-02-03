import FingerprintJS from '@fingerprintjs/fingerprintjs';

const STORAGE_KEY = 'x-device-id';

// In-memory cache for the current session
let memoryCache: string | null = null;

export const getDeviceId = async (): Promise<string> => {
  if (typeof window === 'undefined') {
    return '';
  }

  // 1. Use memory cache if available (prevents re-running during the same session)
  if (memoryCache) {
    return memoryCache;
  }

  try {
    // 2. Load FingerprintJS agent
    const fp = await FingerprintJS.load();
    
    // 3. Get the visitor identifier
    const result = await fp.get();

    // Debug: Log all components
    console.log('Fingerprint Result:', result);
    
    const deviceId = result.visitorId;

    // 4. Update memory cache
    memoryCache = deviceId;

    // (Optional) We can still save to localStorage for debugging, but we don't trust it for reading
    localStorage.setItem(STORAGE_KEY, deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('Failed to generate device ID:', error);
    // Fallback if fingerprint fails (should be rare)
    return 'fallback-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
};
