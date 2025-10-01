import ManualTradingView from "./_components/manual-trading-view";

export default async function ManualTradingPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Manual Trading</h1>
        <p className="text-muted-foreground">
          Execute trades manually with real-time market data
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ManualTradingView />
      </div>
    </div>
  );
}