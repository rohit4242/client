import { CreateOrderData } from "@/db/schema/order";
import { useMutation } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import { toast } from "sonner";

interface OrderResponse {
  success: boolean;
  message: string;
  order: {
    orderId: number;
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    price?: string;
    status: string;
    transactTime: number;
    fills: Array<{
      price: string;
      qty: string;
      commission: string;
      commissionAsset: string;
    }>;
  };
}

interface OrderError {
  error: string;
  message?: string;
  code?: number;
}

export const useCreateOrder = () => {
    const { mutate: createOrder, isPending, error, data } = useMutation<OrderResponse, OrderError, CreateOrderData>({
        mutationFn: async (orderData: CreateOrderData) => {
            try {
                const response = await axios.post("/api/order/create", orderData);
                return response.data;
            } catch (error: unknown) {
                if (error instanceof AxiosError && error.response?.data) {
                    const errorData = error.response.data;
                    throw { 
                        error: errorData.error || "Order placement failed",
                        message: errorData.message,
                        code: errorData.code
                    };
                }
                throw { error: "Network error occurred" };
            }
        },
        onSuccess: (data) => {
            // Build description with order details
            let description = `${data.order.side} ${data.order.quantity} ${data.order.symbol}`;
            
            if (data.order.price) {
                description += ` at ${data.order.price}`;
            }
            
            // Add fill information for market orders
            if (data.order.fills && data.order.fills.length > 0) {
                const totalFilled = data.order.fills.reduce((sum, fill) => sum + parseFloat(fill.qty), 0);
                const avgPrice = data.order.fills.reduce((sum, fill) => sum + (parseFloat(fill.price) * parseFloat(fill.qty)), 0) / totalFilled;
                description += `\nFilled: ${totalFilled} at avg price ${avgPrice.toFixed(8)}`;
                
                // Show commission
                const totalCommission = data.order.fills.reduce((sum, fill) => sum + parseFloat(fill.commission), 0);
                const commissionAsset = data.order.fills[0]?.commissionAsset;
                if (totalCommission > 0 && commissionAsset) {
                    description += `\nCommission: ${totalCommission} ${commissionAsset}`;
                }
            }
            
            description += `\nOrder ID: ${data.order.orderId}`;
            description += `\nStatus: ${data.order.status}`;
            
            toast.success(data.message || "Order placed successfully", {
                description,
                duration: 10000, // Show longer for order confirmations
            });
        },
        onError: (error) => {
            const errorMessage = error.error || "Failed to place order";
            let description = error.message || "Please check your order details and try again";
            
            // Add Binance error code if available
            if (error.code) {
                description += `\nError Code: ${error.code}`;
            }
            
            toast.error(errorMessage, {
                description,
                duration: 8000,
            });
        }
    })

    return {
        createOrder,
        isPending,
        error,
        data
    }
}