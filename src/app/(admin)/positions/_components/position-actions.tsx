"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  X, 
  Edit, 
  BarChart3, 
  Settings,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { PositionData, PositionAction } from "@/types/position";

interface PositionActionsProps {
  position: PositionData;
  onAction: (action: PositionAction) => Promise<void>;
  disabled?: boolean;
}

export function PositionActions({ position, onAction, disabled = false }: PositionActionsProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  
  // Check if position is closed
  const isClosedPosition = position.status === "CLOSED";


  const handleClosePosition = async () => {
    setIsClosing(true);
    try {
      const closeRequest = {
        positionId: position.id,
        closeType: "FULL" as const,
        slippage: 1.0, // 1% max slippage
       
      };

      await onAction({
        type: "CLOSE_POSITION",
        payload: closeRequest
      });

      toast.success(`Position ${position.symbol} closed successfully`);
      setShowCloseDialog(false);
    } catch (error) {
      console.error("Error closing position:", error);
      toast.error("Failed to close position. Please try again.");
    } finally {
      setIsClosing(false);
    }
  };

  const getCloseOrderType = () => {
    // Determine the opposite order type for market close
    return position.side === "Long" ? "SELL" : "BUY";
  };

  const getEstimatedCloseValue = () => {
    const closeValue = position.currentPrice * position.quantity;
    const pnl = position.side === "Long" 
      ? (position.currentPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - position.currentPrice) * position.quantity;
    
    return { closeValue, pnl };
  };

  const { closeValue, pnl } = getEstimatedCloseValue();

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-1">
        {/* Close Position - only show for open positions */}
        {!isClosedPosition && (
          <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
            <AlertDialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    disabled={disabled || isClosing}
                    onClick={() => setShowCloseDialog(true)}
                  >
                    {isClosing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close Position (Market {getCloseOrderType()})</p>
                </TooltipContent>
              </Tooltip>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Position - {position.symbol}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Are you sure you want to close this {position.side.toLowerCase()} position?
                    This will execute a market {getCloseOrderType()} order.
                  </p>
                  
                  <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position Size:</span>
                      <span className="font-mono">{position.quantity.toFixed(6)} {position.symbol.replace('USDT', '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Price:</span>
                      <span className="font-mono">${position.currentPrice.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Close Value:</span>
                      <span className="font-mono">${closeValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Estimated P&L:</span>
                      <span className={`font-mono ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ This is a market order and will execute immediately at the current market price. 
                      Actual execution price may vary due to market conditions and slippage.
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isClosing}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleClosePosition}
                disabled={isClosing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isClosing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing Position...
                  </>
                ) : (
                  <>Close Position</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        )}

        {/* Edit Position - only show for open positions */}
        {!isClosedPosition && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                disabled={disabled}
                onClick={() => {
                  toast.info("Edit position functionality coming soon");
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Position (Stop Loss, Take Profit)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* View Chart */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
              disabled={disabled}
              onClick={() => {
                toast.info("Chart view functionality coming soon");
              }}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Chart</p>
          </TooltipContent>
        </Tooltip>

        {/* Position Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
              disabled={disabled}
              onClick={() => {
                toast.info("Position settings functionality coming soon");
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Position Settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
