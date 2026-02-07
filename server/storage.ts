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
      { id: "1", name: "Mount Sinai Hospital", type: "Ambulance", lat: 40.7891, lng: -73.9529, status: "Available" },
      { id: "2", name: "Bellevue Hospital", type: "Ambulance", lat: 40.7396, lng: -73.9765, status: "Available" },
      { id: "3", name: "NY Presbyterian", type: "Ambulance", lat: 40.8402, lng: -73.9431, status: "Busy" },
      { id: "4", name: "Red Cross Shelter A", type: "Shelter", lat: 40.7128, lng: -74.0060, status: "Available" },
      { id: "5", name: "Brooklyn Tech Shelter", type: "Shelter", lat: 40.6888, lng: -73.9764, status: "Available" },
      { id: "6", name: "Food Bank NYC", type: "Food", lat: 40.8030, lng: -73.9500, status: "Available" },
      { id: "7", name: "City Harvest", type: "Food", lat: 40.7550, lng: -73.9950, status: "Available" },
      { id: "8", name: "FDNY Battalion 9", type: "Fire", lat: 40.7600, lng: -73.9840, status: "Available" },
      { id: "9", name: "NYPD Precinct 14", type: "Police", lat: 40.7500, lng: -73.9900, status: "Available" },
      { id: "10", name: "St. Mary's Shelter", type: "Shelter", lat: 40.8100, lng: -73.9200, status: "Busy" },
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
