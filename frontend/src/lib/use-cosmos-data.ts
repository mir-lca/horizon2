"use client";

import { useEffect, useState, useCallback } from "react";
import { ContainerTypes } from "./cosmos-config";
import { apiService } from "./api-service";
import { toast } from "sonner";

interface UseCosmosDataOptions<T> {
  initialData?: T | T[];
}

export function useCosmosData<T extends { id?: string }>(
  containerType: ContainerTypes,
  itemId?: string,
  options: UseCosmosDataOptions<T> = {}
) {
  const [data, setData] = useState<T | T[] | null>(options.initialData ?? null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = itemId
        ? await apiService.getById<T>(containerType, itemId)
        : await apiService.getAll<T>(containerType);
      setData(result);
      setError(null);
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(err.message || "Unknown error");
      setError(errorObj);
    } finally {
      setLoading(false);
    }
  }, [containerType, itemId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upsertItem = useCallback(
    async (item: T) => {
      const result = await apiService.upsert<T>(containerType, item);
      toast.success(`${containerType} updated successfully`);
      fetchData();
      return result;
    },
    [containerType, fetchData]
  );

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    upsertItem,
    refresh,
  };
}
