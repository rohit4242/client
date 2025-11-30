import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SignalBot } from "@/types/signal-bot";

export function useSignalBots(userId: string, enabled: boolean = true) {
  return useQuery<SignalBot[]>({
    queryKey: ["signal-bots", userId],
    queryFn: async () => {
      const { data } = await axios.get<SignalBot[]>(`/api/signal-bots`, {
        params: { userId },
      });
      return data;
    },
    enabled,
  });
}



