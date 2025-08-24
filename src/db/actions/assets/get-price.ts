import axios from "axios";
import { AssetPrice } from "@/types/trading";

interface GetPriceResponse {
  price: AssetPrice | null;
}

interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
}

export const getPrice = async (
  symbol: string,
  exchange: ExchangeCredentials
): Promise<GetPriceResponse | null> => {
  if (!symbol || !exchange?.apiKey || !exchange?.apiSecret) {
    return null;
  }

  try {
    const { data } = await axios.post<GetPriceResponse>(
      `/api/trading/price/${symbol}`,
      {
        apiKey: exchange.apiKey,
        apiSecret: exchange.apiSecret,
      },
      {
        timeout: 3000, // 3 second timeout for price (faster than balance)
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Price fetch error:", {
        status: error.response?.status,
        message: error.message,
        symbol,
      });
    } else {
      console.error("Unexpected error fetching price:", error);
    }
    return null;
  }
};
