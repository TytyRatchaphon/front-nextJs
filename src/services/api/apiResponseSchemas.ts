import { z } from "zod";

import { apiEnvelopeSchema, looseRecordSchema, paginationSchema } from "./apiResponseValidation";

const looseObjectSchema = z.object({}).passthrough();
const categoryBookListDataSchema = z.object({
  pagination: paginationSchema,
  books: z.array(looseRecordSchema),
  banner: looseObjectSchema.nullable().optional(),
}).passthrough();

export const articleSchemas = {
  popular: apiEnvelopeSchema(z.object({
    list: z.array(looseRecordSchema),
  }).passthrough()),
  latest: apiEnvelopeSchema(z.object({
    list: z.array(looseRecordSchema),
    pagination: paginationSchema,
  }).passthrough()),
  detail: apiEnvelopeSchema(looseObjectSchema),
};

export const storeSchemas = {
  store: apiEnvelopeSchema(z.array(looseRecordSchema)),
  stickers: apiEnvelopeSchema(z.array(looseRecordSchema)),
  coupons: apiEnvelopeSchema(z.array(looseRecordSchema)),
};

export const categorySchemas = {
  all: apiEnvelopeSchema(z.array(looseRecordSchema)),
  bookList: z.object({
    code: z.coerce.number().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
    data: categoryBookListDataSchema.optional(),
  }).passthrough(),
  banners: apiEnvelopeSchema(z.array(looseRecordSchema)),
  activeTypes: apiEnvelopeSchema(z.array(looseRecordSchema)),
  activeCategories: apiEnvelopeSchema(z.array(looseRecordSchema)),
};

export const bookSchemas = {
  detail: z.union([apiEnvelopeSchema(looseObjectSchema), looseObjectSchema]),
  purchaseDetails: apiEnvelopeSchema(looseObjectSchema),
  latestReadEpisode: apiEnvelopeSchema(looseObjectSchema),
  recommendation: apiEnvelopeSchema(z.array(looseRecordSchema)),
  promotionOptions: apiEnvelopeSchema(z.array(looseRecordSchema)),
  newNovels: apiEnvelopeSchema(z.object({
    books: z.array(looseRecordSchema),
    pagination: paginationSchema,
  }).passthrough()),
};

export const homeSchemas = {
  homeData: apiEnvelopeSchema(z.object({
    slides: z.array(looseRecordSchema),
    popup: z.array(looseRecordSchema).optional(),
    groupBookHome: z.array(looseRecordSchema).optional(),
    spotlight: z.array(looseRecordSchema).optional(),
  }).passthrough()),
  bookUpdates: apiEnvelopeSchema(z.array(looseRecordSchema)),
};
