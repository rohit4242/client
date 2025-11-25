"use client";

import { Exchange } from "@/types/exchange";
import { ExchangeSelector } from "@/components/trading/exchange-selector";
import { useState } from "react";
import { SpotTradingForm } from "@/components/trading/forms/spot-trading-form";
import { MarginTradingForm } from "@/components/trading/forms/margin-trading-form";
import { POPULAR_SYMBOLS } from "@/db/schema/order";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TradingChart } from "@/components/trading/trading-chart";
import { UserWithAgent } from "@/db/actions/admin/get-all-users";
import { AccountType } from "@/types/margin";
import { AccountTypeToggle } from "@/components/trading/account-type-toggle";
import { MarginAccountCard } from "@/components/margin/margin-account-card";
import { BorrowRepayModal } from "@/components/margin/borrow-repay-modal";
import { TransferModal } from "@/components/margin/transfer-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Wallet } from "lucide-react";

interface ManualTradingViewProps {
  selectedUser: UserWithAgent;
}

export default function ManualTradingView({ selectedUser }: ManualTradingViewProps) {
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(
    null
  );
  const [selectedAsset, setSelectedAsset] = useState<string>(
    POPULAR_SYMBOLS[0]
  );
  const [accountType, setAccountType] = useState<AccountType>('spot');
  const [borrowRepayModalOpen, setBorrowRepayModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const onSelectAssetsChange = (assets: string[]) => {
    setSelectedAsset(assets[0]);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* Account Type Toggle */}
      <div className="mb-4">
        <AccountTypeToggle value={accountType} onChange={setAccountType} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Columns - Chart Area */}
        <div className="lg:col-span-2 flex flex-col min-h-0 order-2 lg:order-1">
          <div className="flex-1 min-h-[300px] lg:min-h-0 rounded-lg border overflow-hidden">
            <TradingChart symbol={`BINANCE:${selectedAsset}`} />
          </div>
        </div>

        {/* Right Column - Trading Forms */}
        <div className="lg:col-span-1 flex flex-col min-h-0 order-1 lg:order-2">
          <ScrollArea className="flex-1 max-h-full">
            <div className="space-y-6 pl-4 pb-4">
              {/* Exchange Selection */}
              <ExchangeSelector
                onSelect={setSelectedExchange}
                selectedExchange={selectedExchange}
                userId={selectedUser.id}
              />

              {/* Margin Account Status (only in margin mode) */}
              {accountType === 'margin' && (
                <>
                  <MarginAccountCard selectedExchange={selectedExchange} />
                  
                  {/* Margin Actions */}
                  {selectedExchange && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBorrowRepayModalOpen(true)}
                        className="w-full"
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Borrow/Repay
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTransferModalOpen(true)}
                        className="w-full"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Transfer
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Trading Form - Conditionally render based on account type */}
              {accountType === 'spot' ? (
                <SpotTradingForm
                  selectedExchange={selectedExchange}
                  onSelectAssetsChange={onSelectAssetsChange}
                  selectedAsset={selectedAsset}
                  userId={selectedUser.id}
                  portfolioId={selectedUser.portfolioId}
                />
              ) : (
                <MarginTradingForm
                  selectedExchange={selectedExchange}
                  onSelectAssetsChange={onSelectAssetsChange}
                  selectedAsset={selectedAsset}
                  userId={selectedUser.id}
                  portfolioId={selectedUser.portfolioId}
                />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Modals */}
      <BorrowRepayModal
        open={borrowRepayModalOpen}
        onOpenChange={setBorrowRepayModalOpen}
        exchange={selectedExchange as Exchange}
      />
      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        exchange={selectedExchange as Exchange}
      />
    </div>
  );
}
