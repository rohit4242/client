import { Suspense } from "react";
import { SignalBotClient } from "./_components/signal-bot-client";
import { SignalBotLoading } from "./_components/signal-bot-loading";
import { getSelectedUser } from "@/lib/selected-user-server";
import { NoUserSelected } from "../_components/no-user-selected";
import { Bot } from "lucide-react";

export default async function SignalBotPage() {
  const selectedUser = await getSelectedUser();

  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
          <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md">
            <Bot className="size-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Signal Bot
            </h1>
            <p className="text-slate-600 text-base mt-1">
              Automated trading with TradingView signals and custom strategies
            </p>
          </div>
        </div>
        <NoUserSelected />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <Suspense fallback={<SignalBotLoading />}>
        <SignalBotClient userId={selectedUser.id} />
      </Suspense>
    </div>
  );
}
