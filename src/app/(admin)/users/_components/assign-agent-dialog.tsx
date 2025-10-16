"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAllAgents } from "@/db/actions/admin/get-all-users";

interface AssignAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    name: string;
    email: string;
    agentId?: string | null;
    agentName?: string | null;
  };
}

export function AssignAgentDialog({
  open,
  onOpenChange,
  customer,
}: AssignAgentDialogProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    customer.agentId || "none"
  );
  const [agents, setAgents] = useState<
    { id: string; name: string; email: string; customerCount: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadAgents();
    }
  }, [open]);

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const agentsList = await getAllAgents();
      setAgents(agentsList);
    } catch (error) {
      console.error("Error loading agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleAssignAgent = async () => {
    if (selectedAgentId === customer.agentId || (selectedAgentId === "none" && !customer.agentId)) {
      toast.info("No changes made");
      onOpenChange(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${customer.id}/assign-agent`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: selectedAgentId === "none" ? null : selectedAgentId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign agent");
      }

      const action = selectedAgentId === "none" ? "unassigned from agent" : "assigned to agent";
      toast.success(`Successfully ${action} for ${customer.name}`);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error assigning agent:", error);
      toast.error(error instanceof Error ? error.message : "Failed to assign agent");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Agent</DialogTitle>
          <DialogDescription>
            Assign or change the agent for {customer.name} ({customer.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent</Label>
            {isLoadingAgents ? (
              <div className="text-sm text-muted-foreground">Loading agents...</div>
            ) : (
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No Agent (Unassign)</span>
                  </SelectItem>
                  {agents.length === 0 ? (
                    <SelectItem value="no-agents" disabled>
                      No agents available
                    </SelectItem>
                  ) : (
                    agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} - {agent.email} ({agent.customerCount} customers)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {customer.agentName && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              <strong>Current Agent:</strong> {customer.agentName}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssignAgent}
            disabled={isLoading || isLoadingAgents || (agents.length === 0 && selectedAgentId !== "none")}
          >
            {isLoading ? "Updating..." : "Update Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

