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
  totalValue: number | null; // Decimal from Prisma
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
