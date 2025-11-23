"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountType } from "@/types/margin";

interface AccountTypeToggleProps {
  value: AccountType;
  onChange: (value: AccountType) => void;
}

export function AccountTypeToggle({
  value,
  onChange,
}: AccountTypeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        Account Type:
      </span>
      <Tabs value={value} onValueChange={(v) => onChange(v as AccountType)}>
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="spot" className="text-sm">
            Spot
          </TabsTrigger>
          <TabsTrigger value="margin" className="text-sm">
            Margin
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

