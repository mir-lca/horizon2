"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => {
      console.log("[QueryProvider] Creating new QueryClient");
      return new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000, // 30 seconds (matches previous CACHE_EXPIRY_MS)
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false, // Controlled by database refresh hook
            refetchOnMount: false, // Don't refetch on component mount
            refetchOnReconnect: false, // Don't refetch on network reconnect
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      });
    }
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
