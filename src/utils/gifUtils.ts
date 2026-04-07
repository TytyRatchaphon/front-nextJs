import { decompressFrames, parseGIF, type ParsedFrame } from 'gifuct-js';

export interface ExtractGifFirstFrameOptions {
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

export const isGifFile = (file: File | null | undefined): boolean => {
  if (!file) return false;
  const type = file.type?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';
  return type === 'image/gif' || name.endsWith('.gif');
};

const getImageDecoderCtor = () => {
  if (typeof globalThis === 'undefined') return null;
  return (globalThis as any).ImageDecoder ?? null;
};

const createOutputFileFromBlob = (
  blob: Blob,
  sourceFile: File,
  outputType: NonNullable<ExtractGifFirstFrameOptions['outputType']>,
) => {
  const baseName = sourceFile.name.replace(/\.gif$/i, '') || 'book-cover';
  const ext = outputType === 'image/png' ? 'png' : outputType === 'image/webp' ? 'webp' : 'jpg';

  return new File([blob], `${baseName}-cover.${ext}`, {
    type: blob.type || outputType,
    lastModified: Date.now(),
  });
};

type ParsedGifData = {
  width: number;
  height: number;
  frames: ParsedFrame[];
};

const parsedGifCache = new WeakMap<File, Promise<ParsedGifData>>();

const parseGifWithLibrary = async (gifFile: File): Promise<ParsedGifData> => {
  const cached = parsedGifCache.get(gifFile);
  if (cached) return cached;

  const next = (async () => {
    const arrayBuffer = await gifFile.arrayBuffer();
    const parsedGif = parseGIF(arrayBuffer);
    const frames = decompressFrames(parsedGif, true);

    const width = Number(parsedGif?.lsd?.width ?? 0);
    const height = Number(parsedGif?.lsd?.height ?? 0);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error('GIF dimensions are invalid');
    }

    if (!Array.isArray(frames) || frames.length === 0) {
      throw new Error('GIF has no decodable frames');
    }

    return {
      width,
      height,
      frames,
    };
  })();

  parsedGifCache.set(gifFile, next);
  return next;
};

const renderFrameWithCanvasFromImage = async (
  file: File,
  options: ExtractGifFirstFrameOptions = {},
): Promise<File> => {
  if (typeof window === 'undefined') {
    throw new Error('GIF frame extraction is only available in browser');
  }

  const outputType = options.outputType ?? 'image/jpeg';
  const quality = options.quality ?? 0.92;
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to decode GIF'));
      img.src = objectUrl;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      throw new Error('GIF dimensions are invalid');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (!blob) {
      throw new Error('Unable to render GIF frame');
    }

    return createOutputFileFromBlob(blob, file, outputType);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const renderFrameWithGifLibrary = async (
  gifFile: File,
  frameIndex: number,
  options: ExtractGifFirstFrameOptions = {},
): Promise<File> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('GIF frame extraction is only available in browser');
  }

  const outputType = options.outputType ?? 'image/jpeg';
  const quality = options.quality ?? 0.92;
  const parsed = await parseGifWithLibrary(gifFile);
  const safeFrameIndex = Math.min(
    Math.max(0, Math.floor(frameIndex)),
    Math.max(0, parsed.frames.length - 1),
  );

  const canvas = document.createElement('canvas');
  canvas.width = parsed.width;
  canvas.height = parsed.height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const restoreBuffers: Array<{ x: number; y: number; imageData: ImageData } | null> = Array.from(
    { length: parsed.frames.length },
    () => null,
  );

  const applyDisposalForFrame = (frame: ParsedFrame, framePosition: number) => {
    const { left, top, width, height } = frame.dims;
    if (frame.disposalType === 2) {
      ctx.clearRect(left, top, width, height);
      return;
    }

    if (frame.disposalType === 3) {
      const buffer = restoreBuffers[framePosition];
      if (buffer) {
        ctx.putImageData(buffer.imageData, buffer.x, buffer.y);
      } else {
        ctx.clearRect(left, top, width, height);
      }
    }
  };

  for (let i = 0; i <= safeFrameIndex; i += 1) {
    if (i > 0) {
      applyDisposalForFrame(parsed.frames[i - 1], i - 1);
    }

    const frame = parsed.frames[i];
    const { left, top, width, height } = frame.dims;

    if (!width || !height) continue;

    if (frame.disposalType === 3) {
      restoreBuffers[i] = {
        x: left,
        y: top,
        imageData: ctx.getImageData(left, top, width, height),
      };
    }

    const imageData = ctx.createImageData(width, height);
    imageData.data.set(frame.patch);
    ctx.putImageData(imageData, left, top);
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  if (!blob) {
    throw new Error('Unable to render selected GIF frame');
  }

  return createOutputFileFromBlob(blob, gifFile, outputType);
};

export const isGifFrameSelectionSupported = (): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (Boolean(getImageDecoderCtor())) return true;
  return typeof Uint8ClampedArray !== 'undefined';
};

export const getGifFrameCount = async (gifFile: File): Promise<number> => {
  if (!isGifFile(gifFile)) return 1;

  const Decoder = getImageDecoderCtor();
  if (!Decoder) {
    try {
      const parsed = await parseGifWithLibrary(gifFile);
      return parsed.frames.length > 0 ? parsed.frames.length : 1;
    } catch {
      return 1;
    }
  }

  try {
    const decoder = new Decoder({
      data: new Uint8Array(await gifFile.arrayBuffer()),
      type: 'image/gif',
    });

    if (decoder?.tracks?.ready) {
      await decoder.tracks.ready;
    }

    const frameCount = Number(decoder?.tracks?.selectedTrack?.frameCount ?? 1);
    decoder?.close?.();

    if (Number.isFinite(frameCount) && frameCount > 0) return frameCount;
  } catch {
    // no-op
  }

  try {
    const parsed = await parseGifWithLibrary(gifFile);
    return parsed.frames.length > 0 ? parsed.frames.length : 1;
  } catch {
    return 1;
  }
};

export const extractGifFrameAsFile = async (
  gifFile: File,
  frameIndex: number,
  options: ExtractGifFirstFrameOptions = {},
): Promise<File> => {
  if (!isGifFile(gifFile)) {
    throw new Error('Input file is not GIF');
  }

  const Decoder = getImageDecoderCtor();
  if (!Decoder) {
    try {
      return await renderFrameWithGifLibrary(gifFile, frameIndex, options);
    } catch {
      return renderFrameWithCanvasFromImage(gifFile, options);
    }
  }

  const outputType = options.outputType ?? 'image/jpeg';
  const quality = options.quality ?? 0.92;

  let decoder: any = null;
  try {
    decoder = new Decoder({
      data: new Uint8Array(await gifFile.arrayBuffer()),
      type: 'image/gif',
    });

    if (decoder?.tracks?.ready) {
      await decoder.tracks.ready;
    }

    const frameCount = Number(decoder?.tracks?.selectedTrack?.frameCount ?? 1);
    const safeFrameCount = Number.isFinite(frameCount) && frameCount > 0 ? frameCount : 1;
    const safeFrameIndex = Math.min(Math.max(0, Math.floor(frameIndex)), safeFrameCount - 1);

    const decoded = await decoder.decode({ frameIndex: safeFrameIndex });
    const bitmap = decoded?.image;
    if (!bitmap) {
      throw new Error('Unable to decode selected GIF frame');
    }

    const width = bitmap.displayWidth || bitmap.width;
    const height = bitmap.displayHeight || bitmap.height;
    if (!width || !height) {
      throw new Error('Decoded GIF frame has invalid dimensions');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (!blob) {
      throw new Error('Unable to render selected GIF frame');
    }

    return createOutputFileFromBlob(blob, gifFile, outputType);
  } catch {
    // Fallback path when ImageDecoder is unavailable/unstable in some browsers.
    try {
      return await renderFrameWithGifLibrary(gifFile, frameIndex, options);
    } catch {
      return renderFrameWithCanvasFromImage(gifFile, options);
    }
  } finally {
    decoder?.close?.();
  }
};

export const extractGifFirstFrameAsFile = async (
  gifFile: File,
  options: ExtractGifFirstFrameOptions = {},
): Promise<File> => {
  return extractGifFrameAsFile(gifFile, 0, options);
};
