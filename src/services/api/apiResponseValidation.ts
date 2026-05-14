import { z } from "zod";

export class ApiResponseValidationError extends Error {
  constructor(
    readonly endpoint: string,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(`Invalid API response from ${endpoint}`);
    this.name = "ApiResponseValidationError";
  }
}

export const validateApiPayload = <T>(
  schema: z.ZodType<T>,
  payload: unknown,
  endpoint: string,
): T => {
  const result = schema.safeParse(payload);

  if (result.success) {
    return result.data;
  }

  const error = new ApiResponseValidationError(endpoint, result.error.issues);

  if (process.env.NODE_ENV !== "test") {
    console.warn("[api-validation] Invalid API response", {
      endpoint,
      issues: result.error.issues,
    });
  }

  throw error;
};

export const apiEnvelopeSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    code: z.coerce.number().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
    data: dataSchema,
  }).passthrough();

export const paginationSchema = z.object({
  page: z.coerce.number(),
  limit: z.coerce.number(),
  total: z.coerce.number(),
  totalPages: z.coerce.number(),
  nextPage: z.coerce.number().nullable(),
  prevPage: z.coerce.number().nullable(),
}).passthrough();

export const looseRecordSchema = z.record(z.string(), z.unknown());
