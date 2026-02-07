import { Resource, AnalyzedMessage } from "@shared/schema";

export interface IStorage {
  getResources(): Promise<Resource[]>;
  saveAnalysisResult(result: AnalyzedMessage): Promise<void>;
  getAnalysisResults(): Promise<AnalyzedMessage[]>;
}

export class MemStorage implements IStorage {
  private resources: Resource[];
  private results: AnalyzedMessage[];

  constructor() {
    this.results = [];
    this.resources = [
      { id: "1", name: "Apollo Hospital", type: "Ambulance", lat: 13.0645, lng: 80.2504, status: "Available" },
      { id: "2", name: "MMM Hospital", type: "Ambulance", lat: 13.0841, lng: 80.1887, status: "Available" },
      { id: "3", name: "SIMS Hospital", type: "Ambulance", lat: 13.0514, lng: 80.2104, status: "Busy" },
      { id: "4", name: "Relief Shelter Chennai Central", type: "Shelter", lat: 13.0827, lng: 80.2707, status: "Available" },
      { id: "5", name: "Anna Nagar Community Center", type: "Shelter", lat: 13.0850, lng: 80.2101, status: "Available" },
      { id: "6", name: "Tamil Nadu Food Bank", type: "Food", lat: 13.0400, lng: 80.2400, status: "Available" },
      { id: "7", name: "Amma Unavagam", type: "Food", lat: 13.0700, lng: 80.2200, status: "Available" },
      { id: "8", name: "Fire & Rescue Mylapore", type: "Fire", lat: 13.0330, lng: 80.2677, status: "Available" },
      { id: "9", name: "Chennai Police HQ", type: "Police", lat: 13.0418, lng: 80.2755, status: "Available" },
      { id: "10", name: "St. Thomas Mount Shelter", type: "Shelter", lat: 13.0035, lng: 80.2014, status: "Busy" },
    ];
  }

  async getResources(): Promise<Resource[]> {
    return this.resources;
  }

  async saveAnalysisResult(result: AnalyzedMessage): Promise<void> {
    this.results.push(result);
  }

  async getAnalysisResults(): Promise<AnalyzedMessage[]> {
    return this.results;
  }
}

export const storage = new MemStorage();
