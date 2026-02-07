import { z } from "zod";

// === DOMAIN TYPES (No Database) ===

export const urgencyLevelSchema = z.enum(["low", "medium", "high"]);
export type UrgencyLevel = z.infer<typeof urgencyLevelSchema>;

export const resourceTypeSchema = z.enum(["Ambulance", "Shelter", "Food", "Police", "Fire", "General"]);
export type ResourceType = z.infer<typeof resourceTypeSchema>;

// Hardcoded resource in the system
export const resourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: resourceTypeSchema,
  lat: z.number(),
  lng: z.number(),
  status: z.enum(["Available", "Busy"]),
});
export type Resource = z.infer<typeof resourceSchema>;

// Input message from the UI
export const messageInputSchema = z.object({
  content: z.string(),
});
export type MessageInput = z.infer<typeof messageInputSchema>;

// AI Extraction Result
export const extractionResultSchema = z.object({
  need: z.string(),
  quantity: z.string().nullable().optional(),
  location: z.string(),
  urgency_level: urgencyLevelSchema,
  urgency_reason: z.string(),
});
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

// Final Analyzed Item
export const analyzedMessageSchema = extractionResultSchema.extend({
  id: z.string(),
  original_content: z.string(),
  urgency_score: z.number(),
  matched_resource_id: z.string().optional(),
  matched_resource: resourceSchema.optional(), // The full resource object
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(), // Geocoded location
});
export type AnalyzedMessage = z.infer<typeof analyzedMessageSchema>;

export const bulkAnalyzeRequestSchema = z.object({
  messages: z.array(z.string()),
});
export type BulkAnalyzeRequest = z.infer<typeof bulkAnalyzeRequestSchema>;

export const bulkAnalyzeResponseSchema = z.object({
  results: z.array(analyzedMessageSchema),
});
export type BulkAnalyzeResponse = z.infer<typeof bulkAnalyzeResponseSchema>;
