import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function apiRequest(
    method: string,
    url: string,
    data?: unknown | undefined,
): Promise<Response> {
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
        const json = await res.json();
        if (res.status === 401) {
            throw new Error("Unauthorized");
        }
        throw new Error(json.message || res.statusText);
    }

    return res;
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: async ({ queryKey }) => {
                const res = await apiRequest("GET", queryKey[0] as string);
                return res.json();
            },
        },
        mutations: {
            mutationFn: async ({ mutationKey, variables }) => {
                const [method, url] = mutationKey as [string, string];
                const res = await apiRequest(method, url, variables);
                return res.json();
            },
        },
    },
});
