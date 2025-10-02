"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserX } from "lucide-react";

export function NoUserSelected() {
  return (
    <Alert className="border-orange-500/50 bg-orange-500/10">
      <UserX className="h-5 w-5 text-orange-500" />
      <AlertTitle className="text-orange-500">No Customer Selected</AlertTitle>
      <AlertDescription>
        Please select a customer from the sidebar to manage their portfolio and perform
        trading actions.
      </AlertDescription>
    </Alert>
  );
}

