import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { SignalBot } from "@/types/signal-bot";
import { 
  createSignalBotSchema, 
  updateSignalBotSchema 
} from "@/db/schema/signal-bot";
import { z } from "zod";

type CreateBotInput = z.infer<typeof createSignalBotSchema>;
type UpdateBotInput = z.infer<typeof updateSignalBotSchema>;

export function useCreateBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBotInput) => {
      const response = await axios.post<SignalBot>("/api/signal-bots", data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Signal bot created successfully");
      queryClient.invalidateQueries({ queryKey: ["signal-bots"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to create signal bot");
    },
  });
}

export function useUpdateBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ botId, data }: { botId: string; data: UpdateBotInput }) => {
      const response = await axios.put<SignalBot>(`/api/signal-bots/${botId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Signal bot updated successfully");
      queryClient.invalidateQueries({ queryKey: ["signal-bots"] });
      queryClient.invalidateQueries({ queryKey: ["signal-bot", data.id] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to update signal bot");
    },
  });
}

export function useToggleBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (botId: string) => {
      const response = await axios.patch(`/api/signal-bots/${botId}`, {
        action: "toggle",
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["signal-bots"] });
      queryClient.invalidateQueries({ queryKey: ["signal-bot", data.bot.id] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to toggle bot");
    },
  });
}

export function useDeleteBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (botId: string) => {
      const response = await axios.delete(`/api/signal-bots/${botId}`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Signal bot deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["signal-bots"] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to delete signal bot");
    },
  });
}



