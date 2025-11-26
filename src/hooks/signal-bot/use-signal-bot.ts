import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SignalBot } from "@/types/signal-bot";

export function useSignalBot(botId: string, enabled: boolean = true) {
  return useQuery<SignalBot>({
    queryKey: ["signal-bot", botId],
    queryFn: async () => {
      const { data } = await axios.get<SignalBot>(`/api/signal-bots/${botId}`);
      return data;
    },
    enabled: enabled && !!botId,
  });
}


