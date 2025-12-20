/**
 * Manual Trading Feature - Trading Form Hook
 * 
 * Centralized form logic shared between spot and margin trading forms
 */

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback } from "react";
import { TradingFormData, getDefaultValues, type OrderTypeType } from "@/db/schema/order";
import { TradingFormSchema } from "@/db/schema/order";

interface UseTradingFormParams {
    initialOrderType?: OrderTypeType;
    onSuccess?: () => void;
}

interface UseTradingFormResult {
    form: UseFormReturn<TradingFormData>;
    orderType: OrderTypeType;
    setOrderType: (type: OrderTypeType) => void;
    handleOrderTypeChange: (type: OrderTypeType) => void;
    handleAssetChange: (value: string, onSelectAssetsChange: (assets: string[]) => void) => void;
    resetForm: () => void;
}

export function useTradingForm({
    initialOrderType = "MARKET",
    onSuccess,
}: UseTradingFormParams = {}): UseTradingFormResult {
    const [orderType, setOrderType] = useState<OrderTypeType>(initialOrderType);

    // Initialize form with react-hook-form
    const form = useForm<TradingFormData>({
        resolver: zodResolver(TradingFormSchema),
        defaultValues: getDefaultValues(orderType),
    });

    // Handle order type change (Market vs Limit)
    const handleOrderTypeChange = useCallback((type: OrderTypeType) => {
        setOrderType(type);
        form.reset(getDefaultValues(type));
    }, [form]);

    // Handle asset change
    const handleAssetChange = useCallback((value: string, onSelectAssetsChange: (assets: string[]) => void) => {
        onSelectAssetsChange([value]);
        form.setValue("symbol", value);
    }, [form]);

    // Reset form to default values
    const resetForm = useCallback(() => {
        form.reset(getDefaultValues(orderType));
    }, [form, orderType]);

    return {
        form,
        orderType,
        setOrderType,
        handleOrderTypeChange,
        handleAssetChange,
        resetForm,
    };
}
