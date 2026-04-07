export interface TrimWhiteEdgeOptions {
  whiteThreshold?: number;
  minOpaqueAlpha?: number;
  minContentAlpha?: number;
  padding?: number;
}

interface PixelBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const DEFAULT_TRIM_OPTIONS: Required<TrimWhiteEdgeOptions> = {
  whiteThreshold: 245,
  minOpaqueAlpha: 8,
  minContentAlpha: 1,
  padding: 0,
};

const trimResultCache = new Map<string, Promise<string>>();

const isLikelyGif = (src: string): boolean => {
  if (!src) return false;
  if (src.startsWith('data:image/gif')) return true;
  return /\.gif($|\?)/i.test(src);
};

const isLikelyPng = (src: string): boolean => {
  if (!src) return false;
  if (src.startsWith('data:image/png')) return true;
  return /\.png($|\?)/i.test(src);
};

const buildCacheKey = (src: string, options: Required<TrimWhiteEdgeOptions>) =>
  `${src}|${options.whiteThreshold}|${options.minOpaqueAlpha}|${options.minContentAlpha}|${options.padding}`;

const isEdgeWhitePixel = (
  data: Uint8ClampedArray,
  index: number,
  whiteThreshold: number,
  minOpaqueAlpha: number,
): boolean => {
  const alpha = data[index + 3];
  if (alpha < minOpaqueAlpha) return false;

  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  return r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
};

const removeEdgeConnectedWhitePixels = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  whiteThreshold: number,
  minOpaqueAlpha: number,
): boolean => {
  const totalPixels = width * height;
  const visited = new Uint8Array(totalPixels);
  const queue: number[] = [];
  let changed = false;

  const push = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const pixelIndex = y * width + x;
    if (visited[pixelIndex]) return;

    const rgbaIndex = pixelIndex * 4;
    if (!isEdgeWhitePixel(data, rgbaIndex, whiteThreshold, minOpaqueAlpha)) return;

    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const pixelIndex = queue[head];
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const rgbaIndex = pixelIndex * 4;

    if (data[rgbaIndex + 3] !== 0) {
      data[rgbaIndex + 3] = 0;
      changed = true;
    }

    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  return changed;
};

const findVisibleBounds = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minContentAlpha: number,
): PixelBounds | null => {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < minContentAlpha) continue;

      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < left || bottom < top) return null;
  return { left, top, right, bottom };
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for trimming'));
    img.src = src;
  });

const canvasToPngDataUrl = (canvas: HTMLCanvasElement): string | null => {
  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
};

export const trimWhiteEdgesFromImageSrc = async (
  src: string,
  options: TrimWhiteEdgeOptions = {},
): Promise<string> => {
  const normalizedSrc = typeof src === 'string' ? src.trim() : '';
  if (!normalizedSrc) return normalizedSrc;

  if (typeof window === 'undefined') return normalizedSrc;
  if (isLikelyGif(normalizedSrc)) return normalizedSrc;
  if (!isLikelyPng(normalizedSrc) && !normalizedSrc.startsWith('data:image/')) {
    return normalizedSrc;
  }

  const finalOptions: Required<TrimWhiteEdgeOptions> = {
    ...DEFAULT_TRIM_OPTIONS,
    ...options,
  };

  const cacheKey = buildCacheKey(normalizedSrc, finalOptions);
  const cached = trimResultCache.get(cacheKey);
  if (cached) return cached;

  const trimmingPromise = (async () => {
    try {
      const img = await loadImage(normalizedSrc);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) return normalizedSrc;

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = width;
      sourceCanvas.height = height;
      const sourceCtx = sourceCanvas.getContext('2d');
      if (!sourceCtx) return normalizedSrc;

      sourceCtx.drawImage(img, 0, 0, width, height);
      const imageData = sourceCtx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      const edgeChanged = removeEdgeConnectedWhitePixels(
        pixels,
        width,
        height,
        finalOptions.whiteThreshold,
        finalOptions.minOpaqueAlpha,
      );

      const bounds = findVisibleBounds(pixels, width, height, finalOptions.minContentAlpha);
      if (!bounds) return normalizedSrc;

      const paddedLeft = Math.max(0, bounds.left - finalOptions.padding);
      const paddedTop = Math.max(0, bounds.top - finalOptions.padding);
      const paddedRight = Math.min(width - 1, bounds.right + finalOptions.padding);
      const paddedBottom = Math.min(height - 1, bounds.bottom + finalOptions.padding);

      const cropWidth = paddedRight - paddedLeft + 1;
      const cropHeight = paddedBottom - paddedTop + 1;
      const isSameBounds = cropWidth === width && cropHeight === height && paddedLeft === 0 && paddedTop === 0;

      if (!edgeChanged && isSameBounds) return normalizedSrc;

      sourceCtx.putImageData(imageData, 0, 0);

      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = cropWidth;
      resultCanvas.height = cropHeight;
      const resultCtx = resultCanvas.getContext('2d');
      if (!resultCtx) return normalizedSrc;

      resultCtx.drawImage(
        sourceCanvas,
        paddedLeft,
        paddedTop,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      const dataUrl = canvasToPngDataUrl(resultCanvas);
      if (!dataUrl) return normalizedSrc;
      return dataUrl;
    } catch {
      return normalizedSrc;
    }
  })();

  trimResultCache.set(cacheKey, trimmingPromise);
  return trimmingPromise;
};
