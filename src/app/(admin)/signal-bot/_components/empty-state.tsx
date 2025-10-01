import { Bot, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onCreateBot: () => void;
}

export function EmptyState({ onCreateBot }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-6">
          <Bot className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">No Signal Bots Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first signal bot to start automated trading with TradingView signals. 
          Set up custom strategies, risk management, and let your bot handle the trades.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button onClick={onCreateBot} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Your First Bot</span>
          </Button>
          <Button variant="outline" asChild>
            <a 
              href="https://www.tradingview.com/support/solutions/43000529348-about-webhooks/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Learn About Webhooks</span>
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col items-center space-y-2">
            <div className="rounded-full bg-blue-100 p-2">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <span>Automated Trading</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="rounded-full bg-green-100 p-2">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <span>TradingView Signals</span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <div className="rounded-full bg-purple-100 p-2">
              <Plus className="h-4 w-4 text-purple-600" />
            </div>
            <span>Risk Management</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
