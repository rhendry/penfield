import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface FeatureFlag {
    name: string;
    enabled: boolean;
    description?: string;
}

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(name: string): boolean {
    const { data } = useQuery<{ name: string; enabled: boolean }>({
        queryKey: [`/api/feature-flags/${name}`],
        staleTime: 0, // Always refetch to get latest state
        gcTime: 0, // Don't cache at all (formerly cacheTime)
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        retry: false, // Don't retry if flag doesn't exist
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/feature-flags/${name}`);
            const flag = await res.json();
            // Convert enabled from "true"/"false" string to boolean
            return {
                name: flag.name,
                enabled: flag.enabled === true || flag.enabled === "true",
            };
        },
    });

    return data?.enabled ?? false;
}

/**
 * Hook to get all feature flags (admin only)
 */
export function useFeatureFlags() {
    return useQuery<FeatureFlag[]>({
        queryKey: ["/api/admin/feature-flags"],
        staleTime: 0, // Always refetch to get latest state
        gcTime: 0, // Don't cache at all (formerly cacheTime)
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
}

