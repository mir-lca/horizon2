"use client";

import { useState, useCallback, useEffect } from "react";
import { ContainerTypes } from "./cosmos-config";
import { apiService } from "./api-service";
import { toast } from "sonner";

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  loading: boolean;
  error: Error | null;
}

type CacheStore = {
  [key in ContainerTypes]?: CacheEntry<any>;
};

const globalCacheStore: CacheStore = {};
const CACHE_EXPIRY_MS = 30000;

export function useCachedCosmosData<T extends { id?: string }>(
  containerType: ContainerTypes,
  options: {
    skipCache?: boolean;
    forceRefresh?: boolean;
  } = {}
) {
  const [localData, setLocalData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  if (!globalCacheStore[containerType]) {
    globalCacheStore[containerType] = {
      data: [],
      timestamp: 0,
      loading: false,
      error: null,
    };
  }

  const fetchData = useCallback(
    async (force = false) => {
      const cacheEntry = globalCacheStore[containerType];
      const now = Date.now();
      const isExpired = !cacheEntry?.timestamp || now - cacheEntry.timestamp > CACHE_EXPIRY_MS;

      if (!force && !options.forceRefresh && !options.skipCache && !isExpired && cacheEntry?.data.length) {
        setLocalData(cacheEntry.data as T[]);
        setLoading(false);
        return;
      }

      if (cacheEntry?.loading && !force) {
        return;
      }

      try {
        if (cacheEntry) {
          cacheEntry.loading = true;
        }
        setLoading(true);

        const items = await apiService.getAll<T>(containerType);

        if (cacheEntry && !options.skipCache) {
          cacheEntry.data = items;
          cacheEntry.timestamp = Date.now();
          cacheEntry.error = null;
        }

        setLocalData(items);
        setError(null);
      } catch (err: any) {
        console.error(`Error fetching ${containerType} data:`, err);
        const errorObj = err instanceof Error ? err : new Error(err.message || "Unknown error");
        if (cacheEntry) {
          cacheEntry.error = errorObj;
        }
        setError(errorObj);
        if (force || options.forceRefresh || isExpired) {
          toast.error(`Failed to fetch ${containerType}: ${err.message || "Unknown error"}`);
        }
      } finally {
        if (cacheEntry) {
          cacheEntry.loading = false;
        }
        setLoading(false);
      }
    },
    [containerType, options.forceRefresh, options.skipCache]
  );

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const updateItem = useCallback(
    async (item: T): Promise<T | null> => {
      try {
        const result = await apiService.upsert<T>(containerType, item);
        const cacheEntry = globalCacheStore[containerType];
        if (cacheEntry) {
          const index = cacheEntry.data.findIndex((entry: any) => entry.id === result.id);
          if (index >= 0) {
            cacheEntry.data[index] = result;
          } else {
            cacheEntry.data.push(result);
          }
          setLocalData([...cacheEntry.data] as T[]);
        }
        toast.success(`${containerType} updated successfully`);
        return result;
      } catch (err: any) {
        console.error(`Error updating ${containerType}:`, err);
        toast.error(`Failed to update ${containerType}: ${err.message || "Unknown error"}`);
        return null;
      }
    },
    [containerType]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await apiService.delete(containerType, id);
        const cacheEntry = globalCacheStore[containerType];
        if (cacheEntry) {
          cacheEntry.data = cacheEntry.data.filter((entry: any) => entry.id !== id);
          setLocalData([...cacheEntry.data] as T[]);
        }
        toast.success(`${containerType} deleted successfully`);
        return true;
      } catch (err: any) {
        console.error(`Error deleting ${containerType}:`, err);
        toast.error(`Failed to delete ${containerType}: ${err.message || "Unknown error"}`);
        return false;
      }
    },
    [containerType]
  );

  return {
    data: localData,
    loading,
    error,
    refreshData: () => fetchData(true),
    updateItem,
    deleteItem,
  };
}
