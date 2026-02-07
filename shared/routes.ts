import { z } from "zod";
import { bulkAnalyzeRequestSchema, bulkAnalyzeResponseSchema, resourceSchema } from "./schema";

export const api = {
  triage: {
    analyze: {
      method: "POST" as const,
      path: "/api/analyze" as const,
      input: bulkAnalyzeRequestSchema,
      responses: {
        200: bulkAnalyzeResponseSchema,
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    resources: {
      list: {
        method: "GET" as const,
        path: "/api/resources" as const,
        responses: {
          200: z.array(resourceSchema),
        },
      },
    }
  },
};

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};
