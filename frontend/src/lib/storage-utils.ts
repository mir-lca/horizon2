import { useState } from "react";

/**
 * Centralized Storage Utilities
 *
 * Provides type-safe, consistent localStorage and sessionStorage access
 * with error handling and data validation.
 */

export interface StorageConfig {
  prefix?: string;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
  errorHandler?: (error: Error, key: string, operation: string) => void;
}

const DEFAULT_CONFIG: Required<StorageConfig> = {
  prefix: "horizon_",
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  errorHandler: (error, key, operation) => {
    console.error(`Storage ${operation} failed for key "${key}":`, error);
  },
};

export class StorageManager {
  private config: Required<StorageConfig>;
  private storage: Storage;

  constructor(storage: Storage = window.localStorage, config: StorageConfig = {}) {
    this.storage = storage;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getKey(key: string): string {
    return `${this.config.prefix}${key}`;
  }

  setItem<T>(key: string, value: T): boolean {
    try {
      const serializedValue = this.config.serialize(value);
      this.storage.setItem(this.getKey(key), serializedValue);
      return true;
    } catch (error) {
      this.config.errorHandler(error as Error, key, "setItem");
      return false;
    }
  }

  getItem<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = this.storage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue;
      }
      return this.config.deserialize(item) as T;
    } catch (error) {
      this.config.errorHandler(error as Error, key, "getItem");
      return defaultValue;
    }
  }

  removeItem(key: string): boolean {
    try {
      this.storage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      this.config.errorHandler(error as Error, key, "removeItem");
      return false;
    }
  }

  clear(): boolean {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i += 1) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => this.storage.removeItem(key));
      return true;
    } catch (error) {
      this.config.errorHandler(error as Error, "all", "clear");
      return false;
    }
  }

  hasItem(key: string): boolean {
    return this.storage.getItem(this.getKey(key)) !== null;
  }

  keys(): string[] {
    const keys: string[] = [];

    try {
      for (let i = 0; i < this.storage.length; i += 1) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          keys.push(key.substring(this.config.prefix.length));
        }
      }
    } catch (error) {
      this.config.errorHandler(error as Error, "all", "keys");
    }

    return keys;
  }

  size(): number {
    let size = 0;

    try {
      for (let i = 0; i < this.storage.length; i += 1) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          const value = this.storage.getItem(key);
          if (value) {
            size += key.length + value.length;
          }
        }
      }
    } catch (error) {
      this.config.errorHandler(error as Error, "all", "size");
    }

    return size;
  }
}

export const localStorage = new StorageManager(typeof window !== "undefined" ? window.localStorage : ({} as Storage));

export const sessionStorage = new StorageManager(typeof window !== "undefined" ? window.sessionStorage : ({} as Storage), {
  prefix: "horizon_session_",
});

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    storage?: StorageManager;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { storage = localStorage, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = storage.getItem(key, defaultValue);
      return item !== undefined ? item : defaultValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        storage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      setStoredValue(defaultValue);

      if (typeof window !== "undefined") {
        storage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}

export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useLocalStorage(key, defaultValue, { storage: sessionStorage });
}

export const STORAGE_KEYS = {
  PROJECT_SORT_CONFIG: "projectsSortConfig",
  PROJECT_FILTER_STATE: "projectsFilterState",
  PROJECT_VIEW_MODE: "projectsViewMode",
  RESOURCE_SORT_CONFIG: "resourcesSortConfig",
  RESOURCE_FILTER_STATE: "resourcesFilterState",
  FINANCIAL_CHART_CONFIG: "financialChartConfig",
  CALCULATION_PREFERENCES: "calculationPreferences",
  THEME_MODE: "themeMode",
  SIDEBAR_COLLAPSED: "sidebarCollapsed",
  TABLE_PREFERENCES: "tablePreferences",
  SELECTED_BUSINESS_UNIT: "selectedBusinessUnit",
  SELECTED_DATE_RANGE: "selectedDateRange",
} as const;

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export interface FilterState {
  [key: string]: any;
}

export interface TablePreferences {
  columnsVisible: Record<string, boolean>;
  columnWidths: Record<string, number>;
  pageSize: number;
}

export interface ChartConfig {
  type: string;
  options: Record<string, any>;
}

export function useProjectSortConfig() {
  return useLocalStorage<SortConfig | null>(STORAGE_KEYS.PROJECT_SORT_CONFIG, null);
}

export function useProjectFilterState() {
  return useLocalStorage<FilterState>(STORAGE_KEYS.PROJECT_FILTER_STATE, {});
}

export function useResourceSortConfig() {
  return useLocalStorage<SortConfig>(STORAGE_KEYS.RESOURCE_SORT_CONFIG, {
    key: "competenceName",
    direction: "asc",
  });
}

export function useTablePreferences(tableId: string) {
  return useLocalStorage<TablePreferences>(`${STORAGE_KEYS.TABLE_PREFERENCES}_${tableId}`, {
    columnsVisible: {},
    columnWidths: {},
    pageSize: 50,
  });
}

export function useChartConfig(chartId: string) {
  return useLocalStorage<ChartConfig>(`${STORAGE_KEYS.FINANCIAL_CHART_CONFIG}_${chartId}`, {
    type: "line",
    options: {},
  });
}

export const storageDebug = {
  logAll(): void {
    console.group("Storage Debug - All Items");

    localStorage.keys().forEach((key) => {
      const value = localStorage.getItem(key);
      console.log(`[localStorage] ${key}:`, value);
    });

    sessionStorage.keys().forEach((key) => {
      const value = sessionStorage.getItem(key);
      console.log(`[sessionStorage] ${key}:`, value);
    });

    console.groupEnd();
  },

  getStats(): {
    localStorage: { keys: number; size: number };
    sessionStorage: { keys: number; size: number };
  } {
    return {
      localStorage: {
        keys: localStorage.keys().length,
        size: localStorage.size(),
      },
      sessionStorage: {
        keys: sessionStorage.keys().length,
        size: sessionStorage.size(),
      },
    };
  },

  clearAll(): void {
    localStorage.clear();
    sessionStorage.clear();
    console.log("All application storage cleared");
  },
};
