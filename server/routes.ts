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
  "Times Square": { lat: 40.7580, lng: -73.9855 },
  "Central Park": { lat: 40.7829, lng: -73.9654 },
  "Brooklyn Bridge": { lat: 40.7061, lng: -73.9969 },
  "Empire State Building": { lat: 40.7484, lng: -73.9857 },
  "Grand Central": { lat: 40.7527, lng: -73.9772 },
  "Harlem": { lat: 40.8116, lng: -73.9465 },
  "Chelsea": { lat: 40.7465, lng: -74.0014 },
  "SoHo": { lat: 40.7233, lng: -74.0030 },
  "Tribeca": { lat: 40.7163, lng: -74.0086 },
  "Chinatown": { lat: 40.7158, lng: -73.9970 },
  "Battery Park": { lat: 40.7033, lng: -74.0170 },
  "Wall Street": { lat: 40.7074, lng: -74.0113 },
  "Greenwich Village": { lat: 40.7336, lng: -74.0027 },
  "East Village": { lat: 40.7264, lng: -73.9818 },
  "Upper West Side": { lat: 40.7870, lng: -73.9754 },
  "Upper East Side": { lat: 40.7736, lng: -73.9566 },
};

function approximateGeocode(locationText: string): { lat: number, lng: number } {
  // Check strict map
  for (const [key, coords] of Object.entries(LOCATION_MAP)) {
    if (locationText.toLowerCase().includes(key.toLowerCase())) {
      // Add slight jitter so multiple markers don't overlap perfectly
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.002,
        lng: coords.lng + (Math.random() - 0.5) * 0.002
      };
    }
  }
  // Default to random spot in NYC if unknown
  return {
    lat: 40.75 + (Math.random() - 0.5) * 0.1, // Approx range 40.70 - 40.80
    lng: -73.98 + (Math.random() - 0.5) * 0.1 // Approx range -74.03 - -73.93
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
