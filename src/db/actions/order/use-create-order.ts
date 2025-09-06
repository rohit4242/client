import { CreateOrderData } from "@/db/schema/order";
import { SpotRestAPI } from "@binance/spot";
import { useMutation } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import { toast } from "sonner";

interface OrderResponse {
  success: boolean;
  order: {
    id: string;
    symbol: string;
    side: string;
    type: string;
    price: number;
    quantity: number;
    value: number;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  binanceResponse: SpotRestAPI.NewOrderResponse;
  message: string;
  lotSizeAdjustments?: string[];
  notionalAdjustments?: string[];
  quantityAdjusted?: boolean;
}

interface OrderError {
  error: string;
  details?: string;
  orderId?: string;
}

export const useCreateOrder = () => {
    const { mutate: createOrder, isPending, error, data } = useMutation<OrderResponse, OrderError, CreateOrderData>({
        mutationFn: async (orderData: CreateOrderData) => {
            try {
                const response = await axios.post("/api/order/create", orderData);
                return response.data;
            } catch (error: unknown) {
                if (error instanceof AxiosError) {
                    throw { error: error.response?.data.error || "Network error occurred" };
                }
                throw { error: "Network error occurred" };
            }
        },
        onSuccess: (data) => {
            // Build description with adjustment info
            let description = `${data.order.side} ${data.order.quantity} ${data.order.symbol} at ${data.order.price}`;
            
            if (data.quantityAdjusted) {
                const adjustments = [
                    ...(data.lotSizeAdjustments || []),
                    ...(data.notionalAdjustments || [])
                ];
                if (adjustments.length > 0) {
                    description += `\n⚠️ Quantity adjusted: ${adjustments.join(', ')}`;
                }
            }
            
            toast.success(data.message || "Order created successfully", {
                description,
            });
        },
        onError: (error) => {
            toast.error(error.error || "Failed to create order", {
                description: error.details || "Please check your order details and try again",
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