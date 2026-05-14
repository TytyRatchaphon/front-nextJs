import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  ApiResponseValidationError,
  apiEnvelopeSchema,
  validateApiPayload,
} from "./apiResponseValidation";

describe("apiResponseValidation", () => {
  it("returns parsed payload when the schema matches", () => {
    const schema = apiEnvelopeSchema(z.object({ value: z.coerce.number() }));

    const result = validateApiPayload(schema, { data: { value: "42" } }, "/demo");

    expect(result.data.value).toBe(42);
  });

  it("throws a contextual validation error when the payload is invalid", () => {
    const schema = apiEnvelopeSchema(z.object({ items: z.array(z.unknown()) }));

    expect(() => validateApiPayload(schema, { data: { items: "nope" } }, "/demo")).toThrow(
      ApiResponseValidationError,
    );

    try {
      validateApiPayload(schema, { data: { items: "nope" } }, "/demo");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiResponseValidationError);
      expect((error as ApiResponseValidationError).endpoint).toBe("/demo");
      expect((error as ApiResponseValidationError).issues.length).toBeGreaterThan(0);
    }
  });
});
