import { Plus, RefreshCcw, Bot, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SignalBotHeaderProps {
  totalBots: number;
  activeBots: number;
  onCreateBot: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  userName?: string;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function SignalBotHeader({
  totalBots,
  activeBots,
  onCreateBot,
  onRefresh,
  isRefreshing,
  userName,
  viewMode,
  onViewModeChange
}: SignalBotHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md">
          <Bot className="size-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Signal Bot
          </h1>
          <p className="text-slate-600 text-base mt-1">
            {userName ? (
              <>
                Managing <span className="font-semibold text-teal-700">{totalBots}</span> bots for <span className="font-semibold">{userName}</span> ({activeBots} active)
              </>
            ) : (
              "Automate your trading strategy with powerful signal-based bots"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-10 flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-inner">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "flex items-center justify-center size-8 rounded-lg transition-all duration-200",
              viewMode === 'grid'
                ? "bg-white text-teal-600 shadow-sm ring-1 ring-slate-200"
                : "text-slate-400 hover:text-slate-600"
            )}
            title="Grid View"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "flex items-center justify-center size-8 rounded-lg transition-all duration-200",
              viewMode === 'list'
                ? "bg-white text-teal-600 shadow-sm ring-1 ring-slate-200"
                : "text-slate-400 hover:text-slate-600"
            )}
            title="List View"
          >
            <List className="size-4" />
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2 h-10 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
        >
          <RefreshCcw className={cn("size-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>

        <Button
          onClick={onCreateBot}
          className="gap-2 h-10 bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Create Bot</span>
        </Button>
      </div>
    </div>
  );
}
