"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ExternalLink } from 'lucide-react';

interface EmptyStateProps {
  onConnectExchange: () => void;
}

export function EmptyState({ onConnectExchange }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <ExternalLink className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No exchanges connected</h3>
            <p className="text-muted-foreground">
              Connect your first exchange to start trading
            </p>
          </div>
          <Button onClick={onConnectExchange}>
            <Plus className="w-4 h-4 mr-2" />
            Connect Exchange
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
