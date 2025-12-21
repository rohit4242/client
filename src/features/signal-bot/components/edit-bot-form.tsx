"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateBotForm } from "../hooks/use-update-bot-form";
import { BotFormProvider } from "../contexts/bot-form-context";
import { BotConfigurationCard } from "./bot-configuration-card";
import { PositionLeverageCard } from "./position-leverage-card";
import { TradeSimulationCard } from "./trade-simulation-card";
import { RiskManagementCard } from "./risk-management-card";
import { BotWithExchange } from "@/features/signal-bot";

interface EditBotFormProps {
    bot: BotWithExchange;
    onSuccess: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function EditBotForm({
    bot,
    onSuccess,
    onOpenChange,
    open,
}: EditBotFormProps) {
    const { contextValue, onSubmit, updateBotMutation } = useUpdateBotForm({
        bot,
        onSuccess,
        onOpenChange,
        open,
    });

    const { form, validationResult, isValidating } = contextValue;
    const isPending = updateBotMutation.isPending;

    return (
        <BotFormProvider value={contextValue}>
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
                            <TabsTrigger
                                value="basic"
                                className="flex items-center space-x-1 font-semibold uppercase tracking-tight text-xs"
                            >
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>Basic Settings</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="risk"
                                className="flex items-center space-x-1 font-semibold uppercase tracking-tight text-xs"
                            >
                                <Shield className="h-3.5 w-3.5" />
                                <span>Risk Management</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <BotConfigurationCard />
                            <PositionLeverageCard />
                            <TradeSimulationCard />
                        </TabsContent>

                        <TabsContent value="risk" className="space-y-4 mt-4">
                            <RiskManagementCard />
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
                            disabled={
                                isPending ||
                                isValidating ||
                                (validationResult && !validationResult.valid)
                            }
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
        </BotFormProvider>
    );
}
