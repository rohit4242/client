export interface Exchange {
  id: string;
  portfolioId: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  positionMode: "One_Way" | "Hedge";
  spotValue: number | null; // Value of spot account assets in USD
  marginValue: number | null; // Net value of margin account in USD
  totalValue: number | null; // Total value (spotValue + marginValue) - kept for backward compatibility
  lastSyncedAt: string | null; // Date converted to ISO string for client compatibility
  createdAt: string; // Date converted to ISO string for client compatibility
  updatedAt: string; // Date converted to ISO string for client compatibility
}

export interface CreateExchangeData {
  name: string;
  apiKey: string;
  apiSecret: string;
  positionMode: "One_Way" | "Hedge";
}

export interface UpdateExchangeData {
  apiKey?: string;
  apiSecret?: string;
  positionMode?: "One_Way" | "Hedge";
  isActive?: boolean;
}
