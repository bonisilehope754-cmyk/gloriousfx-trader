import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
) {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  return res;
}

export function getQueryFn<T>(options: { on401?: "throw" | "continue" } = {}) {
  return async ({ queryKey }: { queryKey: string[] }): Promise<T> => {
    const res = await fetch(`${API_BASE}${queryKey[0]}`, {
      credentials: "include",
    });

    if (res.status === 401 && options.on401 === "continue") {
      return null as T;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }

    return res.json();
  };
}

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: { onSuccess?: () => void }
) {
  const queryClient = useQueryClient();
  
  return {
    mutate: async (variables: TVariables) => {
      const result = await mutationFn(variables);
      if (options?.onSuccess) {
        options.onSuccess();
      }
      queryClient.invalidateQueries();
      return result;
    },
    isPending: false,
  };
}
