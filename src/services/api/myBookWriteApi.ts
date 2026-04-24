import secureProxyClient from "../secureProxyClient";

export interface MyBookWriteValues extends Record<string, unknown> {
  imgBook?: unknown;
  bgimg?: unknown;
  img_gif?: unknown;
  fast_ticket_daily_increase?: number | string;
  fast_coin_daily_increase?: number | string;
  fast_ep_days?: number | string;
}

type BannerFieldKey = "bgimg" | "bgImg";

const MAX_IMAGE_SIZE = 2_000_000;
const MAX_GIF_SIZE = 10_000_000;
const IMAGE_FIELD_KEYS = new Set(["img", "bgimg", "bgImg", "img_gif"]);

export class MyBookValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MyBookValidationError";
  }
}

const isEmptyValue = (value: unknown): boolean => value === undefined || value === null || value === "";

const isFileValue = (value: unknown): value is File => typeof File !== "undefined" && value instanceof File;

const mapFieldKey = (key: string, bannerFieldKey: BannerFieldKey): string => {
  if (key === "imgBook") return "img";
  if (key === "bgimg") return bannerFieldKey;
  return key;
};

const validateFileSize = (keyName: string, file: File) => {
  const maxSize = keyName === "img_gif" ? MAX_GIF_SIZE : MAX_IMAGE_SIZE;
  if (file.size <= maxSize) return;

  throw new MyBookValidationError(
    keyName === "img_gif" ? "ไฟล์ GIF ต้องมีขนาดไม่เกิน 10 MB" : "รูปภาพต้องมีขนาดไม่เกิน 2 MB"
  );
};

const appendValueToFormData = (formData: FormData, keyName: string, value: unknown) => {
  if (Array.isArray(value)) {
    formData.append(keyName, value.join(","));
    return;
  }

  if (isFileValue(value)) {
    formData.append(keyName, value);
    return;
  }

  formData.append(keyName, String(value));
};

export const buildMyBookFormData = (
  values: MyBookWriteValues,
  options: { bannerFieldKey: BannerFieldKey }
): FormData => {
  const formData = new FormData();
  formData.append("accept_conditions", "true");

  for (const [key, rawValue] of Object.entries(values)) {
    const keyName = mapFieldKey(key, options.bannerFieldKey);
    if (isEmptyValue(rawValue)) continue;

    if (IMAGE_FIELD_KEYS.has(keyName) && !isFileValue(rawValue)) {
      continue;
    }

    if (isFileValue(rawValue)) {
      validateFileSize(keyName, rawValue);
    }

    appendValueToFormData(formData, keyName, rawValue);
  }

  return formData;
};

const MULTIPART_HEADERS = {
  "Content-Type": "multipart/form-data",
};

export const createMyBook = async (values: MyBookWriteValues) => {
  const formData = buildMyBookFormData(values, { bannerFieldKey: "bgimg" });
  return secureProxyClient.post("/user/mybook", formData, {
    headers: MULTIPART_HEADERS,
  });
};

export const updateMyBook = async (bookId: string | number, values: MyBookWriteValues) => {
  const formData = buildMyBookFormData(values, { bannerFieldKey: "bgImg" });
  return secureProxyClient.put(`/user/mybook/${bookId}`, formData, {
    headers: MULTIPART_HEADERS,
  });
};
