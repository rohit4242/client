import { Action as SignalAction } from "@prisma/client";

export type { SignalAction };

export interface Signal {
    id: string;
    botId: string;
    action: SignalAction;
    symbol: string;
    price: number | null;
    message: string | null;
    processed: boolean;
    error: string | null;
    visibleToCustomer: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SignalClient extends Omit<Signal, 'createdAt' | 'updatedAt'> {
    createdAt: string;
    updatedAt: string;
}

export interface SignalWithBot extends SignalClient {
    botName: string;
    customerName: string;
    customerEmail: string;
    customerId: string;
}

export interface GetSignalsInput {
    userId?: string;
    botId?: string;
    processed?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
    status?: "ALL" | "PROCESSED" | "PENDING" | "ERROR";
    action?: SignalAction | "ALL";
    visibleOnly?: boolean;
}

export interface GetSignalsResult {
    signals: SignalWithBot[];
    total: number;
}
