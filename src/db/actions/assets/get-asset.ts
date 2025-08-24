import axios from "axios";
import { Exchange } from "@/db/schema/exchange";
import { AssetBalance } from "@/types/trading";

interface GetAssetResponse {
  asset: AssetBalance | null;
}

export const getAsset = async (
  symbol: string, 
  exchange: Exchange
): Promise<GetAssetResponse | null> => {
  if (!symbol || !exchange?.apiKey || !exchange?.apiSecret) {
    return null;
  }

  try {
    const { data } = await axios.post<GetAssetResponse>(
      `/api/account/assets/${symbol}`,
      {
        apiKey: exchange.apiKey,
        apiSecret: exchange.apiSecret,
      },
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Asset fetch error:", {
        status: error.response?.status,
        message: error.message,
        symbol,
      });
    } else {
      console.error("Unexpected error fetching asset:", error);
    }
    return null;
  }
};
