import { Button } from "@/components/ui/button";
import { extractBaseAsset } from "@/lib/utils";
import { AssetBalance, AssetPrice } from "@/types/trading";

interface AssetInfoCardProps {
  symbol: string;
  balance: AssetBalance | null;
  price: AssetPrice | null;
  lastUpdate: Date | null;
  isLoadingBalance: boolean;
  isLoadingPrice: boolean;
  onRefreshPrice: () => void;
  selectedExchange: boolean;
}

export function AssetInfoCard({
  symbol,
  balance,
  price,
  lastUpdate,
  isLoadingBalance,
  isLoadingPrice,
  onRefreshPrice,
  selectedExchange,
}: AssetInfoCardProps) {
  const baseAsset = extractBaseAsset(symbol);
  
  console.log('[AssetInfoCard] Received props:', {
    symbol,
    balance,
    hasBalance: !!balance,
    balanceAsset: balance?.asset,
    balanceFree: balance?.free,
    isLoadingBalance,
    selectedExchange
  });
  
  // Calculate total value
  const totalValue = balance && price 
    ? parseFloat(balance.free) * parseFloat(price.price)
    : 0;

  // Format price with optimal precision
  const formatPrice = (priceValue: string) => {
    const num = parseFloat(priceValue);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: num < 1 ? 8 : 2,
    });
  };

  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
      {/* Balance Section */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Available Balance ({baseAsset})
        </span>
        {isLoadingBalance ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : balance ? (
          <span className="text-sm font-mono">
            {parseFloat(balance.free).toFixed(8)} {balance.asset}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {selectedExchange ? 'No balance found' : 'Select exchange first'}
          </span>
        )}
      </div>
      
      {/* Price Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Current Price ({symbol})
          </span>
          {price && lastUpdate && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-2 text-xs hover:bg-muted"
                onClick={onRefreshPrice}
                disabled={isLoadingPrice}
              >
                {isLoadingPrice ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "↻"
                )}
              </Button>
            </div>
          )}
        </div>
        
        {isLoadingPrice && !price ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : price ? (
          <div className="text-right">
            <div className="text-sm font-mono text-teal-600">
              ${formatPrice(price.price)}
            </div>
            {lastUpdate && (
              <div className="text-xs text-muted-foreground">
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {selectedExchange ? 'Price not available' : 'Select exchange first'}
          </span>
        )}
      </div>

      {/* Additional Info */}
      {balance && (
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Locked: {parseFloat(balance.locked).toFixed(8)} {balance.asset}
            </span>
            {totalValue > 0 && (
              <span>
                Total Value: ${totalValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
