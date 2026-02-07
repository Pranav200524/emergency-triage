import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { analyzedMessageSchema, type ExtractionResult, type Resource } from "@shared/schema";
import { openai } from "./lib/openai";
import { z } from "zod";
import { randomUUID } from "crypto";

// Helper to calculate distance (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

// Simple geocoding simulation (since we can't easily call external Nominatim without potential rate limits/CORS or extra setup)
// In a real app, we would use a geocoding service.
// Here we will map common NYC neighborhoods to rough coordinates or random jitter around NYC.
// Or we can try to use a simple lookup.
const LOCATION_MAP: Record<string, { lat: number, lng: number }> = {
  "T. Nagar": { lat: 13.0418, lng: 80.2341 },
  "Marina Beach": { lat: 13.0500, lng: 80.2824 },
  "Chennai Central": { lat: 13.0827, lng: 80.2707 },
  "Anna Nagar": { lat: 13.0850, lng: 80.2101 },
  "Adyar": { lat: 13.0067, lng: 80.2578 },
  "Velachery": { lat: 12.9791, lng: 80.2185 },
  "Mylapore": { lat: 13.0330, lng: 80.2677 },
  "Guindy": { lat: 13.0067, lng: 80.2206 },
  "Kodambakkam": { lat: 13.0521, lng: 80.2255 },
  "Besant Nagar": { lat: 13.0003, lng: 80.2665 },
  "Egmore": { lat: 13.0783, lng: 80.2619 },
  "Nungambakkam": { lat: 13.0588, lng: 80.2435 },
  "Saidapet": { lat: 13.0213, lng: 80.2231 },
  "Tambaram": { lat: 12.9229, lng: 80.1275 },
};

function approximateGeocode(locationText: string): { lat: number, lng: number } {
  // Check strict map
  for (const [key, coords] of Object.entries(LOCATION_MAP)) {
    if (locationText.toLowerCase().includes(key.toLowerCase())) {
      // Add slight jitter so multiple markers don't overlap perfectly
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.005,
        lng: coords.lng + (Math.random() - 0.5) * 0.005
      };
    }
  }
  // Default to random spot in Chennai if unknown
  return {
    lat: 13.05 + (Math.random() - 0.5) * 0.1,
    lng: 80.25 + (Math.random() - 0.5) * 0.1
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.triage.resources.list.path, async (req, res) => {
    const resources = await storage.getResources();
    res.json(resources);
  });

  app.post(api.triage.analyze.path, async (req, res) => {
    try {
      const { messages } = api.triage.analyze.input.parse(req.body);
      const results = [];
      const resources = await storage.getResources();

      for (const msg of messages) {
        if (!msg.trim()) continue;

        // 1. OpenAI Extraction
        const prompt = `
Extract emergency details from the message.
Return ONLY valid JSON with:
- need (e.g. Ambulance, Shelter, Food, Police, Fire, General)
- quantity (string or null)
- location (text)
- urgency_level (low / medium / high)
- urgency_reason (one sentence explanation)

Message: "${msg}"
`;

        let extraction: ExtractionResult;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const content = response.choices[0].message.content || "{}";
          extraction = JSON.parse(content);
        } catch (e) {
            console.error("OpenAI failed, using fallback", e);
            // Fallback
            extraction = {
                need: "General",
                quantity: null,
                location: "Unknown",
                urgency_level: "medium",
                urgency_reason: "AI analysis failed, defaulted to medium.",
            };
        }

        // 2. Compute Urgency Score
        let score = 0;
        if (extraction.urgency_level === "high") score = 70;
        else if (extraction.urgency_level === "medium") score = 40;
        else score = 20;

        const lowerMsg = msg.toLowerCase();
        if (["injury", "blood", "broken", "pain", "unconscious", "breathing"].some(w => lowerMsg.includes(w))) {
            score += 10;
        }
        if (["child", "baby", "kid", "elderly", "senior", "old", "boy", "girl"].some(w => lowerMsg.includes(w))) {
            score += 10;
        }
        score = Math.min(score, 100);

        // 3. Geocode
        const coords = approximateGeocode(extraction.location);

        // 4. Match Resource
        // Simple logic: find nearest resource of same type, or nearest overall if no type match
        // Map extraction 'need' to ResourceType
        // If need is 'Medical' -> Ambulance
        let targetType = extraction.need;
        if (targetType.toLowerCase().includes("medical") || targetType.toLowerCase().includes("injury")) targetType = "Ambulance";
        
        let bestMatch: Resource | undefined;
        let minDist = Infinity;

        for (const res of resources) {
            if (res.status !== "Available") continue;

            // Prioritize type match
            const isTypeMatch = res.type.toLowerCase() === targetType.toLowerCase();
            const dist = getDistanceFromLatLonInKm(coords.lat, coords.lng, res.lat, res.lng);
            
            // Heuristic: valid type match takes precedence. 
            // If we found a type match, we only look for closer type matches.
            // If we haven't found a type match yet, we look for nearest resource.
            // Actually, let's keep it simple: Filter by type if possible, else all.
            
            // Try strict type matching first
            if (isTypeMatch) {
                if (dist < minDist) {
                    minDist = dist;
                    bestMatch = res;
                }
            }
        }
        
        // If no type match found, fallback to nearest ANY resource? 
        // No, maybe just leave unmatched or find nearest General/Ambulance if critical?
        // Let's fallback to nearest regardless of type if high urgency and no match found?
        // For this demo, let's just stick to type matching or no match.
        
        const result: z.infer<typeof analyzedMessageSchema> = {
            id: randomUUID(),
            original_content: msg,
            ...extraction,
            urgency_score: score,
            urgency_level: extraction.urgency_level as "low" | "medium" | "high", // Cast to ensure type safety
            coordinates: coords,
            matched_resource_id: bestMatch?.id,
            matched_resource: bestMatch
        };
        
        results.push(result);
        await storage.saveAnalysisResult(result);
      }
      
      // Sort results by urgency score descending
      results.sort((a, b) => b.urgency_score - a.urgency_score);

      res.json({ results });

    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input format" });
      } else {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  return httpServer;
}
