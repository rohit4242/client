export interface Exchange {
  id: string;
  userAccountId: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  positionMode: "One_Way" | "Hedge";
  totalValue: number | null; // Number from Prisma
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
