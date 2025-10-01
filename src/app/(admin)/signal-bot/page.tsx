import { Suspense } from "react";
import { SignalBotClient } from "./_components/signal-bot-client";
import { SignalBotLoading } from "./_components/signal-bot-loading";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signal Bot | Bytix",
  description: "Automated trading with signal-based strategies",
};

export default function SignalBotPage() {
  return (
    <div className="flex flex-col space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Signal Bot</h2>
          <p className="text-muted-foreground">
            Automated trading with TradingView signals and custom strategies
          </p>
        </div>
      </div>

      <Suspense fallback={<SignalBotLoading />}>
        <SignalBotClient />
      </Suspense>
    </div>
  );
}
