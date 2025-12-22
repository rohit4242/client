import { type ExchangeClient } from "@/features/exchange";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

interface BorrowParams {
  asset: string;
  amount: string;
  exchangeId?: string;
}

interface RepayParams {
  asset: string;
  amount: string;
  exchangeId?: string;
}

interface TransferParams {
  asset: string;
  amount: string;
  direction: "toMargin" | "toSpot";
  exchangeId?: string;
}

/**
 * Hook for borrowing margin assets
 */
export const useBorrow = (
  exchange: ExchangeClient,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: BorrowParams) => {
      try {
        const response = await axios.post("/api/margin/borrow",
          {
            asset: params.asset,
            amount: params.amount,
            apiKey: exchange?.apiKey,
            apiSecret: exchange?.apiSecret,
          });

        if (!response.data.success) {
          throw new Error(response.data.error || "Failed to borrow");
        }

        return response.data;
      } catch (error: any) {
        // Extract error message from axios error
        const errorMessage = error.response?.data?.error || error.message || "Failed to borrow";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data, params: BorrowParams) => {
      queryClient.invalidateQueries({ queryKey: ["marginAccount"] });
      toast.success(data.message || `Successfully borrowed ${params.amount} ${params.asset}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to borrow assets");
    },
  });
};

/**
 * Hook for repaying margin assets
 */
export const useRepay = (
  exchange: ExchangeClient,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RepayParams) => {
      try {
        const response = await axios.post("/api/margin/repay", {
          asset: params.asset,
          amount: params.amount,
          apiKey: exchange?.apiKey,
          apiSecret: exchange?.apiSecret,
        });

        if (!response.data.success) {
          throw new Error(response.data.error || "Failed to repay");
        }

        return response.data;
      } catch (error: any) {
        // Extract error message from axios error
        const errorMessage = error.response?.data?.error || error.message || "Failed to repay";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data, params: RepayParams) => {
      queryClient.invalidateQueries({ queryKey: ["marginAccount"] });
      toast.success(
        data.message ||
        `Successfully repaid ${params.amount} ${params.asset}`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to repay assets");
    },
  });
};

/**
 * Hook for transferring assets between spot and margin
 */
export const useTransfer = (
  exchange: ExchangeClient,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TransferParams) => {
      try {
        const response = await axios.post("/api/margin/transfer", {
          asset: params.asset,
          amount: params.amount,
          direction: params.direction,
          apiKey: exchange?.apiKey,
          apiSecret: exchange?.apiSecret,
        });

        if (!response.data.success) {
          throw new Error(response.data.error || "Failed to transfer");
        }

        return response.data;
      } catch (error: any) {
        // Extract error message from axios error
        const errorMessage = error.response?.data?.error || error.message || "Failed to transfer";
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data, params: TransferParams) => {
      queryClient.invalidateQueries({ queryKey: ["marginAccount"] });
      // Also invalidate spot balance queries
      queryClient.invalidateQueries({ queryKey: ["assetData"] });
      queryClient.invalidateQueries({ queryKey: ["spotBalance"] });

      const directionText =
        params.direction === "toMargin" ? "to Margin" : "to Spot";
      toast.success(
        data.message ||
        `Successfully transferred ${params.amount} ${params.asset} ${directionText}`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to transfer assets");
    },
  });
};

/**
 * Hook for fetching max borrowable amount
 */
export const useMaxBorrow = (
  asset: string,
  exchange: ExchangeClient,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["maxBorrow", asset, exchange?.id],
    queryFn: async () => {
      const response = await axios.post("/api/margin/max-borrow", {
        asset,
        apiKey: exchange?.apiKey,
        apiSecret: exchange?.apiSecret,
      });

      if (!response.data.success) {
        const error = response.data.error || "Failed to fetch max borrow";
        throw new Error(error.error || "Failed to fetch max borrow");
      }

      return response.data;
    },
    enabled: enabled && !!asset,
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};
