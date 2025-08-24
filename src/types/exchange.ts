export interface Exchange {
  id: string;
  userId: string;
  userAccountId: string;
  name: string;
  accountName: string | null;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  positionMode: "OneWay" | "Hedge";
  totalValue: number | null; // Decimal from Prisma converted to number
  lastSyncedAt: string | null; // Date converted to ISO string for client compatibility
  createdAt: string; // Date converted to ISO string for client compatibility
  updatedAt: string; // Date converted to ISO string for client compatibility
}

export interface CreateExchangeData {
  name: string;
  accountName: string;
  apiKey: string;
  apiSecret: string;
  positionMode: "OneWay" | "Hedge";
}

export interface UpdateExchangeData {
  accountName?: string;
  apiKey?: string;
  apiSecret?: string;
  positionMode?: "OneWay" | "Hedge";
  isActive?: boolean;
}
