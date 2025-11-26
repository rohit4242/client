import { configurationRestAPI } from "@/types/binance";
import { Spot } from "@binance/spot";
import { extractBaseAsset } from "@/lib/utils";
import { AssetPrice } from "@/types/trading";
import { getMarginAccount } from "@/lib/margin/binance-margin";

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
): Promise<AssetPrice> => {
  const client = new Spot({ configurationRestAPI });
  const response = await client.restAPI.tickerPrice({
    symbol,
  });
  const price = await response.data();
  console.log("price from the getPriceBySymbol function:", price);

  return price as AssetPrice;
};

export const getPriceBySymbols = async (
  configurationRestAPI: configurationRestAPI,
  symbols: string[]
) => {
  const client = new Spot({ configurationRestAPI });
  const response = await client.restAPI.tickerPrice({
    symbols: JSON.parse(JSON.stringify(symbols)),
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

/**
 * Calculate margin account value in USD
 * Returns the net asset value of the margin account
 */
export const calculateMarginUSDValue = async (
  configurationRestAPI: configurationRestAPI
): Promise<number> => {
  try {
    const marginAccount = await getMarginAccount(configurationRestAPI);
    
    // Get the net asset value in BTC (totalNetAssetOfBtc includes borrowed amounts)
    const netAssetBTC = parseFloat(marginAccount.totalNetAssetOfBtc || "0");
    
    if (netAssetBTC === 0) {
      return 0;
    }

    // Convert BTC value to USD
    const btcPrice = await getPriceBySymbol(configurationRestAPI, "BTCUSDT");
    const btcPriceUSD = parseFloat(btcPrice.price);
    
    const marginValueUSD = netAssetBTC * btcPriceUSD;
    
    console.log("Margin account value calculation:", {
      netAssetBTC,
      btcPriceUSD,
      marginValueUSD
    });
    
    return marginValueUSD;
  } catch (error) {
    console.error("Error calculating margin USD value:", error);
    // If margin account doesn't exist or API fails, return 0
    return 0;
  }
};

/**
 * Calculate total portfolio value separated by account type
 * Returns spot value, margin value, and total value in USD
 */
export const calculateTotalUSDValue = async (
  configurationRestAPI: configurationRestAPI
): Promise<{ spotValue: number; marginValue: number; totalValue: number }> => {
  // Calculate SPOT account value
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

  // If there are no non-stablecoin assets, just calculate from balances without fetching prices
  let prices: AssetPrice[] = [];
  if (uniqueAssets.length > 0) {
    prices = (await getPriceBySymbols(configurationRestAPI, uniqueAssets)) as AssetPrice[];
  }

  const spotValue = calculateTotalPortfolioValue(
    balances || [],
    prices
  );

  // Calculate MARGIN account value
  const marginValue = await calculateMarginUSDValue(configurationRestAPI);

  // Calculate total value
  const totalValue = spotValue + marginValue;

  console.log("Portfolio values:", { spotValue, marginValue, totalValue });

  return { spotValue, marginValue, totalValue };
};
