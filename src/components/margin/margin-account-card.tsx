"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarginAccount } from "@/hooks/trading/use-margin-account";
import { type ExchangeClient } from "@/features/exchange";
import {
    formatMarginLevel,
    getRiskLevel,
    formatAssetAmount,
    getRiskColor,
    getRiskBadgeText,
} from "@/lib/margin/margin-utils";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { MarginAsset } from "@/types/margin";

interface MarginAccountCardProps {
    selectedExchange: ExchangeClient | null;
}

// Assets to display
const DISPLAY_ASSETS = ["USDT", "BTC", "ETH", "BNB"];

export function MarginAccountCard({ selectedExchange }: MarginAccountCardProps) {
    const { data, isLoading, error, refetch } = useMarginAccount(
        selectedExchange ?? undefined
    );

    if (!selectedExchange) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Margin Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Select an exchange to view margin account
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Margin Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Margin Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <p className="text-sm text-destructive">
                            Failed to load margin account
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="text-sm text-primary hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data?.success || !data.data) {
        return null;
    }

    const marginLevelValue = parseFloat(data.data.marginLevel || "999");
    const riskLevel = getRiskLevel(marginLevelValue);
    const riskColor = getRiskColor(riskLevel);

    // Filter and format user assets
    const userAssets = data.data.userAssets?.filter((asset) =>
        DISPLAY_ASSETS.includes(asset.asset)
    ) || [];

    // Sort assets in the order of DISPLAY_ASSETS
    const sortedAssets = DISPLAY_ASSETS.map((assetName) =>
        userAssets.find((a) => a.asset === assetName)
    ).filter(Boolean);

    // Calculate total values
    const totalAssetBtc = parseFloat(data.data.totalAssetOfBtc || "0");
    const totalLiabilityBtc = parseFloat(data.data.totalLiabilityOfBtc || "0");
    const netAssetBtc = parseFloat(data.data.totalNetAssetOfBtc || "0");

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Margin Account</CardTitle>
                    <Badge variant="outline" className={riskColor}>
                        {getRiskBadgeText(riskLevel)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Account Overview */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Total Assets</span>
                        </div>
                        <p className="text-sm font-semibold">
                            {formatAssetAmount(totalAssetBtc, 8)} BTC
                        </p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Total Debt</span>
                        </div>
                        <p className="text-sm font-semibold text-red-600">
                            {formatAssetAmount(totalLiabilityBtc, 8)} BTC
                        </p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Net Assets</span>
                        </div>
                        <p className="text-sm font-semibold text-green-600">
                            {formatAssetAmount(netAssetBtc, 8)} BTC
                        </p>
                    </div>
                </div>

                {/* Margin Level */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Margin Level</span>
                        <span className={`text-lg font-bold ${riskLevel === "safe" ? "text-green-600" :
                                riskLevel === "warning" ? "text-yellow-600" : "text-red-600"
                            }`}>
                            {formatMarginLevel(marginLevelValue)}
                        </span>
                    </div>
                    <Progress
                        value={Math.min((marginLevelValue / 10) * 100, 100)}
                        className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                        {riskLevel === "safe" && "Your account is healthy"}
                        {riskLevel === "warning" && "⚠️ Low margin level - consider adding collateral"}
                        {riskLevel === "danger" && "⚠️ Critical - risk of liquidation"}
                    </p>
                </div>

                {/* Asset Details */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">Asset Balances</h4>
                    <div className="space-y-2">
                        {sortedAssets.length > 0 ? (
                            sortedAssets.map((asset: MarginAsset | undefined) => {
                                if (!asset) return null;
                                const free = parseFloat(asset.free || "0");
                                const borrowed = parseFloat(asset.borrowed || "0");
                                const interest = parseFloat(asset.interest || "0");
                                const locked = parseFloat(asset.locked || "0");
                                const netAsset = parseFloat(asset.netAsset || "0");

                                return (
                                    <div
                                        key={asset.asset}
                                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{asset.asset}</span>
                                                {borrowed > 0 && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Borrowed
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className={`font-semibold ${netAsset >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatAssetAmount(netAsset, asset.asset === 'USDT' ? 2 : 8)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Free:</span>
                                                <span className="font-medium">
                                                    {formatAssetAmount(free, asset.asset === 'USDT' ? 2 : 8)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Locked:</span>
                                                <span className="font-medium">
                                                    {formatAssetAmount(locked, asset.asset === 'USDT' ? 2 : 8)}
                                                </span>
                                            </div>
                                            {borrowed > 0 && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Borrowed:</span>
                                                        <span className="font-medium text-red-600">
                                                            {formatAssetAmount(borrowed, asset.asset === 'USDT' ? 2 : 8)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Interest:</span>
                                                        <span className="font-medium text-orange-600">
                                                            {formatAssetAmount(interest, asset.asset === 'USDT' ? 2 : 8)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No assets found in margin account
                            </p>
                        )}
                    </div>
                </div>

                {/* Account Type Info */}
                <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Account Type:</span>
                        <span className="font-medium">
                            {data.data.accountType === "MARGIN_1" ? "Cross Margin Classic" : "Cross Margin Pro"}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
