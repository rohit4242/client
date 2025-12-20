"use client";

import {
    Form,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import { toast } from "sonner";
import {
    BotConfigurationCard,
    PositionLeverageCard,
    TradeSimulationCard,
    RiskManagementCard,
    useUpdateBotForm,
    BotWithExchange,
} from "@/features/signal-bot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Shield } from "lucide-react";

interface EditBotFormProps {
    bot: BotWithExchange;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function EditBotForm({ bot, onSuccess, onOpenChange, open }: EditBotFormProps) {
    const {
        form,
        activeExchanges,
        selectedExchange,
        selectedSymbol,
        baseAsset,
        quoteAsset,
        currentPrice,
        tradingCalculations,
        validationResult,
        isValidating,
        updateBotMutation,
        onSubmit,
        watchedTradeAmount,
        watchedTradeAmountType,
        watchedAccountType,
    } = useUpdateBotForm({ bot, onSuccess, onOpenChange, open });

    const isPending = updateBotMutation.isPending;

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.error("Form Validation Errors:", errors);
                    const firstError = Object.values(errors)[0];
                    if (firstError?.message) {
                        toast.error(String(firstError.message));
                    } else {
                        toast.error("Please fix form errors before updating.");
                    }
                })}
                className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
            >
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic" className="flex items-center space-x-1 font-semibold uppercase tracking-tight text-xs">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Basic Settings</span>
                        </TabsTrigger>
                        <TabsTrigger value="risk" className="flex items-center space-x-1 font-semibold uppercase tracking-tight text-xs">
                            <Shield className="h-3.5 w-3.5" />
                            <span>Risk Management</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4 mt-4">
                        <BotConfigurationCard
                            form={form as any}
                            activeExchanges={activeExchanges}
                        />

                        <PositionLeverageCard
                            form={form as any}
                            baseAsset={baseAsset}
                            quoteAsset={quoteAsset}
                            currentPrice={currentPrice}
                            tradingCalculations={tradingCalculations}
                        />

                        <TradeSimulationCard
                            tradingCalculations={tradingCalculations}
                            validationResult={validationResult}
                            isValidating={isValidating}
                            baseAsset={baseAsset}
                            quoteAsset={quoteAsset}
                            watchedTradeAmount={watchedTradeAmount}
                            watchedTradeAmountType={watchedTradeAmountType}
                            watchedAccountType={watchedAccountType}
                        />
                    </TabsContent>

                    <TabsContent value="risk" className="space-y-4 mt-4">
                        <RiskManagementCard form={form as any} />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white/95 backdrop-blur-sm pb-1">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending || isValidating || (validationResult && !validationResult.valid)}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-8"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : isValidating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            "Update Bot"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
