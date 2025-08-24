import { SpotRestAPI } from "@binance/spot";
import { tradingPairInfo } from "@/lib/trading-utils";
import { configurationRestAPI } from "@/types/binance";

interface GetTradingPairInfoResponse {
  exchangeInfo: SpotRestAPI.ExchangeInfoResponse;
}

interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
}

export const getTradingPairInfo = async (
  symbol: string,
  exchange: ExchangeCredentials
): Promise<GetTradingPairInfoResponse | null> => {
  if (!symbol || !exchange?.apiKey || !exchange?.apiSecret) {
    return null;
  }

  try {
    const configurationRestAPI: configurationRestAPI = {
      apiKey: exchange.apiKey,
      apiSecret: exchange.apiSecret,
    };

    const exchangeInfo = await tradingPairInfo(configurationRestAPI, symbol);

    console.log(
      "exchangeInfo from the getTradingPairInfo function: ",
      exchangeInfo
    );

    return { exchangeInfo };
  } catch (error) {
    console.error("Error fetching trading pair info:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      symbol,
    });
    return null;
  }
};
