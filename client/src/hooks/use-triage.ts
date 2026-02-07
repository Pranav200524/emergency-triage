import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { 
  type BulkAnalyzeResponse, 
  type Resource 
} from "@shared/schema";

export function useResources() {
  return useQuery({
    queryKey: [api.triage.resources.list.path],
    queryFn: async () => {
      const res = await fetch(api.triage.resources.list.path);
      if (!res.ok) throw new Error("Failed to fetch resources");
      return api.triage.resources.list.responses[200].parse(await res.json());
    },
  });
}

export function useAnalyzeMessages() {
  return useMutation({
    mutationFn: async (messages: string[]) => {
      const res = await fetch(api.triage.analyze.path, {
        method: api.triage.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to analyze messages");
      }
      
      return api.triage.analyze.responses[200].parse(await res.json());
    },
  });
}
