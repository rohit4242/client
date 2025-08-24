import axios from "axios";

export const deleteExchange = async (id: string) => {
  try {
    const response = await axios.delete(`/api/exchanges/${id}`);
    console.log("Exchange deleted:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting exchange:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Failed to delete exchange");
    }
    throw new Error("Failed to delete exchange");
  }
};