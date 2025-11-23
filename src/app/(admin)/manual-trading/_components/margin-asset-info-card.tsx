import { Button } from "@/components/ui/button";
import { extractBaseAsset } from "@/lib/utils";
import { AssetPrice } from "@/types/trading";

interface MarginAssetBalance {
  asset: string;
  free: string;
  locked: string;
  borrowed: string;
  interest: string;
  netAsset: string;
}

interface MarginAssetInfoCardProps {
  symbol: string;
  balance: MarginAssetBalance | null;
  price: AssetPrice | null;
  lastUpdate: Date | null;
  isLoadingBalance: boolean;
  isLoadingPrice: boolean;
  onRefreshPrice: () => void;
  selectedExchange: boolean;
}

export function MarginAssetInfoCard({
  symbol,
  balance,
  price,
  lastUpdate,
  isLoadingBalance,
  isLoadingPrice,
  onRefreshPrice,
  selectedExchange,
}: MarginAssetInfoCardProps) {
  const baseAsset = extractBaseAsset(symbol);
  
  // Calculate values
  const totalBorrowed = balance 
    ? parseFloat(balance.borrowed) + parseFloat(balance.interest)
    : 0;
  
  const netAssetValue = balance ? parseFloat(balance.netAsset) : 0;
  
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

  const formatBalance = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(8);
  };

  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
      {/* Balance Section */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Margin Balance ({baseAsset})
        </span>
        {isLoadingBalance ? (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : balance ? (
          <span className="text-sm font-mono">
            {formatBalance(balance.free)} {balance.asset}
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

      {/* Margin-Specific Info */}
      {balance && (
        <div className="pt-2 border-t border-border/50 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Borrowed:</span>
              <span className={`font-mono ${totalBorrowed > 0 ? 'text-orange-600' : ''}`}>
                {formatBalance(balance.borrowed)} {balance.asset}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Interest:</span>
              <span className={`font-mono ${parseFloat(balance.interest) > 0 ? 'text-orange-600' : ''}`}>
                {formatBalance(balance.interest)} {balance.asset}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Locked:</span>
              <span className="font-mono">
                {formatBalance(balance.locked)} {balance.asset}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Net Asset:</span>
              <span className={`font-mono font-semibold ${netAssetValue < 0 ? 'text-red-600' : 'text-teal-600'}`}>
                {formatBalance(balance.netAsset)} {balance.asset}
              </span>
            </div>
          </div>
          
          {totalValue > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Value:</span>
                <span className="font-semibold">
                  ${totalValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            </div>
          )}
          
          {totalBorrowed > 0 && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
              <strong>Debt:</strong> You owe {formatBalance(totalBorrowed)} {balance.asset} (borrowed + interest)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

