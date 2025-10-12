"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SyncBalanceButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/sync-balance", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Portfolio balance synced successfully");
        window.location.reload();
      } else {
        toast.info(data.message || "Balance already synced or no exchange found");
      }
    } catch (error) {
      console.error("Error syncing balance:", error);
      toast.error("Failed to sync balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Sync Balance
    </Button>
  );
}

