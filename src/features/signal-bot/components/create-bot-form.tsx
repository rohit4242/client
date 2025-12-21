"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Shield, Loader2 } from "lucide-react";
import { useCreateBotForm } from "../hooks/use-create-bot-form";
import { BotFormProvider } from "../contexts/bot-form-context";
import { BotConfigurationCard } from "./bot-configuration-card";
import { PositionLeverageCard } from "./position-leverage-card";
import { TradeSimulationCard } from "./trade-simulation-card";
import { RiskManagementCard } from "./risk-management-card";
import { BotWithExchange } from "@/features/signal-bot";

interface CreateBotFormProps {
    onSuccess: (result: BotWithExchange) => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
}

export function CreateBotForm({
    onSuccess,
    onOpenChange,
    open,
}: CreateBotFormProps) {
    const { contextValue, onSubmit, createBotMutation } = useCreateBotForm({
        onSuccess,
        onOpenChange,
        open,
    });

    const { form, calculations, validationResult, isValidating } = contextValue;

    return (
        <BotFormProvider value={contextValue}>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
                >
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="basic" className="flex items-center space-x-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>Basic Setup</span>
                            </TabsTrigger>
                            <TabsTrigger value="risk" className="flex items-center space-x-1">
                                <Shield className="h-4 w-4" />
                                <span>Risk Management</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <BotConfigurationCard />
                            <PositionLeverageCard />
                            <TradeSimulationCard />
                        </TabsContent>

                        <TabsContent value="risk" className="space-y-4">
                            <RiskManagementCard />
                        </TabsContent>
                    </Tabs>

                    <Separator />

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createBotMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                createBotMutation.isPending ||
                                isValidating ||
                                !calculations?.hasSufficientWithBorrow ||
                                (validationResult && !validationResult.valid)
                            }
                        >
                            {createBotMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : isValidating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Validating...
                                </>
                            ) : (
                                "Create Bot"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </BotFormProvider>
    );
}
