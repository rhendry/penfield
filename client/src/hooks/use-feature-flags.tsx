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
        staleTime: 30000, // Cache for 30 seconds
        retry: false, // Don't retry if flag doesn't exist
    });

    return data?.enabled ?? false;
}

/**
 * Hook to get all feature flags (admin only)
 */
export function useFeatureFlags() {
    return useQuery<FeatureFlag[]>({
        queryKey: ["/api/admin/feature-flags"],
        staleTime: 10000, // Cache for 10 seconds
    });
}

