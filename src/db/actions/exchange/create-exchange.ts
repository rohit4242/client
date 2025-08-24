import { createExchangeSchema } from "@/db/schema/exchange";
import axios from "axios";
import z from "zod";


export const createExchange = async (exchange: z.infer<typeof createExchangeSchema>) => {
  try {
    const validatedExchange = createExchangeSchema.safeParse(exchange);
    if (!validatedExchange.success) {
      return { error: validatedExchange.error.message };
    }
    
    const response = await axios.post("/api/exchanges", validatedExchange.data);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating exchange:", error);
    
    // Handle axios errors (API responses with error status)
    if (axios.isAxiosError(error)) {
      console.log("Axios error response:", error.response?.data);
      
      if (error.response?.data?.error) {
        return { error: error.response.data.error };
      }
      
      // Fallback for different error response structures
      if (error.response?.data?.message) {
        return { error: error.response.data.message };
      }
      
      // If we have a response but no structured error, try to extract meaningful info
      if (error.response?.status === 400) {
        return { error: "API validation failed - please check your credentials" };
      }
    }
    
    // Handle other errors
    return { error: "Failed to create exchange" };
  }
};