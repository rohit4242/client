import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignalBotHeaderProps {
  totalBots: number;
  activeBots: number;
  onCreateBot: () => void;
}

export function SignalBotHeader({ totalBots, activeBots, onCreateBot }: SignalBotHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {totalBots} bot{totalBots !== 1 ? 's' : ''} total
          </span>
          <span className="text-sm text-muted-foreground">•</span>
          <span className="text-sm text-green-600">
            {activeBots} active
          </span>
        </div>
      </div>

      <Button onClick={onCreateBot} className="flex items-center space-x-2">
        <Plus className="h-4 w-4" />
        <span>Create Bot</span>
      </Button>
    </div>
  );
}
