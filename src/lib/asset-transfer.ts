import { configurationRestAPI } from "@/types/binance";
import { Wallet } from "@binance/wallet";

/**
 * Transfer assets between Spot and Margin accounts using Universal Transfer API
 * @param config - API configuration (requires "Permits Universal Transfer" permission)
 * @param asset - Asset to transfer (e.g., 'USDT', 'BTC', 'ETH')
 * @param amount - Amount to transfer
 * @param type - Transfer type: 'MAIN_MARGIN' (Spot to Margin) or 'MARGIN_MAIN' (Margin to Spot)
 * @returns Transfer result with tranId
 * @see https://developers.binance.com/docs/wallet/asset/user-universal-transfer
 */
export const transferAsset = async (
  config: configurationRestAPI, 
  asset: string, 
  amount: string, 
  type: 'MAIN_MARGIN' | 'MARGIN_MAIN'
) => {
  const client = new Wallet({ configurationRestAPI: config });
  
  // Universal Transfer API
  // MAIN_MARGIN: Spot account transfer to Margin (cross) account
  // MARGIN_MAIN: Margin (cross) account transfer to Spot account
  const response = await client.restAPI.userUniversalTransfer({
    type: type,
    asset: asset,
    amount: parseFloat(amount),
  });
  
  return await response.data();
};
