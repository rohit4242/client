import { configurationRestAPI } from "@/types/binance";
import { Spot } from "@binance/spot";
import { extractBaseAsset } from "@/lib/utils";
import { AssetPrice } from "@/types/trading";

export const getBalance = async (
  configurationRestAPI: configurationRestAPI
) => {
  const client = new Spot({ configurationRestAPI });
  const response = await client.restAPI.getAccount({
    omitZeroBalances: true,
  });

  const { balances } = await response.data();
  console.log("balances from the getBalance function: ", balances);
  return balances;
};

export const getBalanceBySymbol = async (
  configurationRestAPI: configurationRestAPI,
  symbol: string
) => {
  const balances = await getBalance(configurationRestAPI);

  console.log("hello ", balances);

  // Extract the base asset from the trading pair symbol
  const baseAsset = extractBaseAsset(symbol);

  console.log("hello-2: ", baseAsset);

  const asset = balances?.find((balance) => balance.asset === baseAsset);

  console.log("asset: ", asset);
  return asset;
};

export const getPriceBySymbol = async (
  configurationRestAPI: configurationRestAPI,
  symbol: string
) => {
  const client = new Spot({ configurationRestAPI });
  const response = await client.restAPI.tickerPrice({
    symbol,
  });
  const price = await response.data();
  console.log("price from the getPriceBySymbol function:", price);

  return price;
};

export const getPriceBySymbolV2 = async (
  configurationRestAPI: configurationRestAPI,
  symbol: string
) => {
  const configurationWebsocketAPI = {
    apiKey: configurationRestAPI.apiKey,
    apiSecret: configurationRestAPI.apiSecret,
    wsUrl: "wss://ws-api.binance.com/ws-api/v3",
  };
  const client = new Spot({ configurationWebsocketAPI });

  // Use WebSocket API to fetch ticker price (real-time), following the example
  let connection: Awaited<
    ReturnType<typeof client.websocketAPI.connect>
  > | null = null;

  try {
    connection = await client.websocketAPI.connect();

    const response = await connection.tickerPrice({ symbol });

    const rateLimits = response.rateLimits;
    if (rateLimits) {
      console.log("tickerPrice() rate limits:", rateLimits);
    }

    const data = response.data as AssetPrice;
    console.log("price from the getPriceBySymbol function:", data);
    return data;
  } catch (error) {
    console.error("getPriceBySymbol error:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.disconnect();
    }
  }
};
export const getPriceBySymbols = async (
  configurationRestAPI: configurationRestAPI,
  symbols: string[]
) => {
  const client = new Spot({ configurationRestAPI });
  const response = await client.restAPI.tickerPrice({
    symbols: symbols,
  });
  const prices = await response.data();
  console.log("prices from the getPriceBySymbols function: ", prices);
  return prices;
};

export const tradingPairInfo = async (
  configurationRestAPI: configurationRestAPI,
  symbol: string
) => {
  const client = new Spot({ configurationRestAPI });
  const response = await client.restAPI.exchangeInfo({ symbol });
  const exchangeInfo = await response.data();
  console.log("exchangeInfo from the tradingPairInfo function: ", exchangeInfo);
  return exchangeInfo;
};

export const calculateTotalPortfolioValue = (
  balances: {
    asset?: string;
    free?: string;
    locked?: string;
  }[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prices: any
): number => {
  let totalValue = 0;

  for (const balance of balances) {
    if (!balance.asset || !balance.free || !balance.locked) continue;
    const totalBalance = Number(balance.free) + Number(balance.locked);

    if (totalBalance === 0 || isNaN(totalBalance)) continue;

    if (
      balance.asset === "USDT" ||
      balance.asset === "BUSD" ||
      balance.asset === "USD"
    ) {
      totalValue += totalBalance;
      continue;
    }

    const symbol = `${balance.asset}USDT`;

    let priceData;
    if (Array.isArray(prices)) {
      priceData = prices.find((p) => p.symbol === symbol);
    } else if (typeof prices === "object" && "data" in prices) {
      priceData = prices.data.find(
        (p: { symbol: string }) => p.symbol === symbol
      );
    }

    if (priceData && priceData.price) {
      const assetPrice = parseFloat(priceData.price);
      if (!isNaN(assetPrice)) {
        totalValue += totalBalance * assetPrice;
      }
    }
  }

  return totalValue;
};

export const calculateTotalUSDValue = async (
  configurationRestAPI: configurationRestAPI
) => {
  const balances = await getBalance(configurationRestAPI);

  const uniqueAssets = [
    ...new Set(
      balances
        ?.filter(
          (balance) =>
            balance.asset !== "USDT" &&
            balance.asset !== "BUSD" &&
            balance.asset !== "USD"
        )
        .filter((balance) => balance.free !== "0" || balance.locked !== "0")
        .map((balance) => `${balance.asset}USDT`) || []
    ),
  ];
  const prices = await getPriceBySymbols(configurationRestAPI, uniqueAssets);

  const totalPortfolioValue = calculateTotalPortfolioValue(
    balances || [],
    prices
  );

  return totalPortfolioValue;
};
