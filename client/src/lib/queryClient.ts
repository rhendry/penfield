import { QueryClient } from "@tanstack/react-query";

export async function apiRequest(
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
            throw new Error("Invalid username or password");
        }
        throw new Error(json.message || res.statusText);
    }

    return res;
}

export async function getQueryClient({ queryKey }: { queryKey: readonly unknown[] }) {
    const res = await apiRequest("GET", queryKey[0] as string);
    return res.json();
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryClient,
        },
    },
});
