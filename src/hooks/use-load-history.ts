import { useQuery } from "@tanstack/react-query"
import { fetchLoadHistory } from "@/lib/nezha-api"
import { LoadHistoryResponse } from "@/types/nezha-api"

export function useLoadHistory(serverId: number, hours: number, enabled: boolean = true) {
    return useQuery<LoadHistoryResponse>({
        queryKey: ["load-history", serverId, hours],
        queryFn: () => fetchLoadHistory(serverId, hours),
        enabled: enabled && hours > 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2, // 2分钟缓存
    })
}
