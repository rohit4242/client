"use client";

import { useSignalsQuery } from "@/features/signals";
import { SignalsTable } from "@/features/signals/components/signals-table";
import { UserSignalsManager } from "@/features/signals/components/user-signals-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Loader2 } from "lucide-react";
import { useSelectedUser } from "@/contexts/selected-user-context";
import { NoUserSelected } from "../_components/no-user-selected";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignalsPage() {
  const { selectedUser } = useSelectedUser();

  // Use the new feature hook for global signals
  const { data, isLoading } = useSignalsQuery();
  const signals = data?.signals || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
        <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-md">
          <Radio className="size-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Signal Management
          </h1>
          <p className="text-slate-600 text-base mt-1">
            View, edit, and manage all trading signals from customer bots
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
          <TabsTrigger
            value="all"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-medium"
          >
            All Signals
          </TabsTrigger>
          <TabsTrigger
            value="user"
            disabled={!selectedUser}
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-medium"
          >
            User Signals {selectedUser && `(${selectedUser.name})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card className="border-slate-200 shadow-md rounded-xl">
            <CardHeader className="border-b border-slate-200 bg-slate-50 rounded-t-xl">
              <CardTitle className="text-xl font-bold text-slate-900">All Trading Signals</CardTitle>
              <CardDescription className="text-slate-600">
                Manage signal visibility, edit signal details, and control which signals customers can see
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                  <Loader2 className="size-8 animate-spin text-teal-600 mb-4" />
                  <p className="font-medium">Loading signals...</p>
                </div>
              ) : (
                <SignalsTable signals={signals} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user" className="space-y-6">
          {!selectedUser ? (
            <Card className="border-slate-200 shadow-md rounded-xl">
              <CardContent className="pt-6">
                <NoUserSelected />
              </CardContent>
            </Card>
          ) : (
            <UserSignalsManager selectedUser={(selectedUser as any)} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
