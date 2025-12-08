"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBalanceQuery } from "@/hooks/queries/use-balance-query";
import { useMarginBalanceQuery } from "@/hooks/queries/use-margin-balance-query";
import { Exchange } from "@/types/exchange";
import { AssetBalance } from "@/types/trading";
import { Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface AccountBalancesProps {
    exchange: Exchange | null;
}

export function AccountBalances({ exchange }: AccountBalancesProps) {
    const [activeTab, setActiveTab] = useState("spot");

    const { data: spotBalances, isLoading: isLoadingSpot } = useBalanceQuery(
        null, // Fetch all
        exchange,
        { enabled: !!exchange && activeTab === "spot" }
    );

    const { data: marginBalances, isLoading: isLoadingMargin } = useMarginBalanceQuery(
        null, // Fetch all
        exchange,
        { enabled: !!exchange && activeTab === "margin" }
    );

    const spotAssets = Array.isArray(spotBalances) ? spotBalances : [];
    const marginAssets = Array.isArray(marginBalances) ? marginBalances : [];

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Account Balances</CardTitle>
                        <CardDescription>
                            Your asset balances on {exchange?.name || "Exchange"}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="spot" onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="spot">Spot</TabsTrigger>
                        <TabsTrigger value="margin">Margin (Cross)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="spot">
                        {isLoadingSpot ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : spotAssets.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                No active spot balances found.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Asset</TableHead>
                                            <TableHead className="text-right">Free</TableHead>
                                            <TableHead className="text-right">Locked</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {spotAssets.map((asset) => {
                                            const free = parseFloat(asset.free);
                                            const locked = parseFloat(asset.locked);
                                            const total = free + locked;

                                            return (
                                                <TableRow key={asset.asset}>
                                                    <TableCell className="font-medium">{asset.asset}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(free, 8)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(locked, 8)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(total, 8)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="margin">
                        {isLoadingMargin ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : marginAssets.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                No active margin balances found.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Asset</TableHead>
                                            <TableHead className="text-right">Net Asset</TableHead>
                                            <TableHead className="text-right">Borrowed</TableHead>
                                            <TableHead className="text-right">Interest</TableHead>
                                            <TableHead className="text-right">Free</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {marginAssets.map((asset) => (
                                            <TableRow key={asset.asset}>
                                                <TableCell className="font-medium">{asset.asset}</TableCell>
                                                <TableCell className={`text-right ${parseFloat(asset.netAsset) < 0 ? "text-red-500" : "text-green-500"}`}>
                                                    {formatNumber(parseFloat(asset.netAsset), 8)}
                                                </TableCell>
                                                <TableCell className="text-right text-orange-500">
                                                    {parseFloat(asset.borrowed) > 0 ? formatNumber(parseFloat(asset.borrowed), 8) : "-"}
                                                </TableCell>
                                                <TableCell className="text-right text-orange-500">
                                                    {parseFloat(asset.interest) > 0 ? formatNumber(parseFloat(asset.interest), 8) : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">{formatNumber(parseFloat(asset.free), 8)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
