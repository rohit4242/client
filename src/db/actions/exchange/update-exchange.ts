import axios from "axios";

export interface UpdateExchangeData {
  name?: string;
  accountName?: string;
  apiKey?: string;
  apiSecret?: string;
  positionMode?: "OneWay" | "Hedge";
  isActive?: boolean;
}

export const updateExchange = async (id: string, data: UpdateExchangeData) => {
  try {
    const response = await axios.put(`/api/exchanges/${id}`, data);
    console.log("Exchange updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating exchange:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Failed to update exchange");
    }
    throw new Error("Failed to update exchange");
  }
};
